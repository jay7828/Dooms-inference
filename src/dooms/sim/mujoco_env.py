"""MuJoCo implementation of SimEnv + RobotInterface (Franka Panda)."""
from __future__ import annotations

import mujoco
import numpy as np

from ..perception.camera import CameraParams, RGBDObservation
from ..task import TaskSpec
from .base import RobotInterface, RobotState, SimEnv
from .scene_export import poses
from .scenes.builder import BOTTLE_HALF_H, BOTTLE_R, CAP_HALF_H, CAP_R, TRAY_HALF, build_spec

ARM_JOINTS = [f"joint{i}" for i in range(1, 8)]
GRIPPER_CTRL_MAX = 255.0
GRIPPER_MAX_WIDTH = 0.08


class MuJoCoEnv(SimEnv, RobotInterface):
    def __init__(self, task: TaskSpec, cfg: dict):
        self.task, self.cfg = task, cfg
        self.model = build_spec(task, cfg).compile()
        self.data = mujoco.MjData(self.model)
        m = self.model
        self.n_joints = 7
        self._jid = [m.joint(n).id for n in ARM_JOINTS]
        self._qadr = np.array([m.jnt_qposadr[j] for j in self._jid])
        self._dadr = np.array([m.jnt_dofadr[j] for j in self._jid])
        self._fq = [m.jnt_qposadr[m.joint(n).id] for n in ("finger_joint1", "finger_joint2")]
        self._hand = m.body("hand").id
        self._tcp = m.site("tcp").id
        self._ft = m.site("ft").id
        self._force_adr = m.sensor_adr[mujoco.mj_name2id(m, mujoco.mjtObj.mjOBJ_SENSOR, "wrist_force")]
        self._torque_adr = m.sensor_adr[mujoco.mj_name2id(m, mujoco.mjtObj.mjOBJ_SENSOR, "wrist_torque")]
        self._lo = m.jnt_range[self._jid, 0].copy()
        self._hi = m.jnt_range[self._jid, 1].copy()
        self.control_dt = 1.0 / cfg["sim"]["control_hz"]
        self._substeps = max(1, int(round(self.control_dt / m.opt.timestep)))
        self._renderers: dict[tuple, mujoco.Renderer] = {}
        self._q_des = np.zeros(7)
        self._grip_ctrl = GRIPPER_CTRL_MAX
        self.frames: list[np.ndarray] = []
        self.record = False
        self.pose_sink = None       # callable(t, poses (nbody,7) float32) every control tick (live 3D streaming)
        self.push_hint: dict[str, np.ndarray] = {}   # keypoints a (scripted) planner defined on the fly
        self.frame_sink = None      # callable(rgb ndarray) invoked at video_fps while stepping (live streaming)
        self._frame_every = max(1, int(round(cfg["sim"]["control_hz"] / cfg["pipeline"].get("video_fps", 20))))
        self._tick = 0
        self.q_home = m.key("home").qpos[:7].copy()

    # ---------------------------------------------------------------- scene
    def reset(self, seed: int) -> None:
        m, d = self.model, self.data
        rng = np.random.default_rng(seed)
        mujoco.mj_resetDataKeyframe(m, d, m.key("home").id)
        placed: list[tuple[float, float]] = []
        for o in self.task.objects:
            for _ in range(200):
                x, y = rng.uniform(*o.x_range), rng.uniform(*o.y_range)
                if all(np.hypot(x - px, y - py) >= self.task.min_object_separation for px, py in placed):
                    break
            placed.append((x, y))
            yaw = rng.uniform(*o.yaw_range)
            quat = np.array([np.cos(yaw / 2), 0, 0, np.sin(yaw / 2)])
            bid = m.body(o.name).id
            if True:
                adr = m.jnt_qposadr[m.joint(f"{o.name}_free").id]
                z = m.body_pos[bid][2]
                if o.type == "bottle" and o.lying:              # knocked over: axis horizontal, resting on its side
                    roll = np.array([np.cos(np.pi / 4), np.sin(np.pi / 4), 0.0, 0.0])
                    quat = np.zeros(4)
                    mujoco.mju_mulQuat(quat, np.array([np.cos(yaw / 2), 0, 0, np.sin(yaw / 2)]), roll)
                    z = BOTTLE_R + 0.002
                d.qpos[adr:adr + 3] = [x, y, z]
                d.qpos[adr + 3:adr + 7] = quat
        mujoco.mj_forward(m, d)
        self._q_des = self.q_home.copy()
        self._grip_ctrl = GRIPPER_CTRL_MAX
        self.frames.clear()
        self.push_hint = {}
        self._tick = 0
        self._apply_ctrl()
        for _ in range(int(self.cfg["sim"]["settle_seconds"] / m.opt.timestep)):
            mujoco.mj_step(m, d)

    # ---------------------------------------------------------------- RobotInterface
    def state(self) -> RobotState:
        d = self.data
        wrench = np.zeros(6)
        R_ft = d.site_xmat[self._ft].reshape(3, 3)
        wrench[:3] = R_ft @ d.sensordata[self._force_adr:self._force_adr + 3]
        wrench[3:] = R_ft @ d.sensordata[self._torque_adr:self._torque_adr + 3]
        return RobotState(
            q=d.qpos[self._qadr].copy(), dq=d.qvel[self._dadr].copy(),
            tcp_pos=d.site_xpos[self._tcp].copy(), tcp_rot=d.site_xmat[self._tcp].reshape(3, 3).copy(),
            gripper_width=float(d.qpos[self._fq[0]] + d.qpos[self._fq[1]]), wrench=wrench, t=float(d.time))

    def jacobian(self, point_world):
        jp = np.zeros((3, self.model.nv))
        jr = np.zeros((3, self.model.nv))
        mujoco.mj_jac(self.model, self.data, jp, jr, np.asarray(point_world, dtype=float), self._hand)
        return jp[:, self._dadr], jr[:, self._dadr]

    def joint_limits(self):
        return self._lo, self._hi

    def set_joint_targets(self, q):
        self._q_des = np.clip(q, self._lo, self._hi)

    def set_gripper(self, width: float) -> None:
        self._grip_ctrl = float(np.clip(width / GRIPPER_MAX_WIDTH, 0, 1) * GRIPPER_CTRL_MAX)

    def _apply_ctrl(self):
        self.data.ctrl[:7] = self._q_des
        self.data.ctrl[7] = self._grip_ctrl

    def step(self) -> None:
        self._apply_ctrl()
        for _ in range(self._substeps):
            mujoco.mj_step(self.model, self.data)
        self._tick += 1
        if self.pose_sink is not None:
            self.pose_sink(float(self.data.time), poses(self.data))
        if (self.record or self.frame_sink is not None) and self._tick % self._frame_every == 0:
            rgb = self._render_rgb("scene_cam", 480, 360)
            if self.record:
                self.frames.append(rgb)
            if self.frame_sink is not None:
                self.frame_sink(rgb)

    # ---------------------------------------------------------------- SimEnv
    def _renderer(self, w: int, h: int) -> mujoco.Renderer:
        key = (w, h)
        if key not in self._renderers:
            self._renderers[key] = mujoco.Renderer(self.model, height=h, width=w)
        return self._renderers[key]

    def _render_rgb(self, cam: str, w: int, h: int) -> np.ndarray:
        r = self._renderer(w, h)
        r.update_scene(self.data, camera=cam)
        return r.render().copy()

    def render(self, camera: str = "scene") -> RGBDObservation:
        cc = self.cfg["sim"]["cameras"][camera]
        w, h, name = cc["width"], cc["height"], f"{camera}_cam"
        r = self._renderer(w, h)
        r.update_scene(self.data, camera=name)
        rgb = r.render().copy()
        r.enable_depth_rendering()
        r.update_scene(self.data, camera=name)
        depth = r.render().copy().astype(np.float32)
        r.disable_depth_rendering()
        zfar = self.model.vis.map.zfar * self.model.stat.extent
        depth[depth >= 0.99 * zfar] = 0.0
        cid = self.model.camera(name).id
        T = np.eye(4)
        T[:3, :3] = self.data.cam_xmat[cid].reshape(3, 3)
        T[:3, 3] = self.data.cam_xpos[cid]
        cam_params = CameraParams.from_fovy(camera, w, h, self.model.cam_fovy[cid], T)
        return RGBDObservation(rgb=rgb, depth=depth, camera=cam_params, t=float(self.data.time))

    def free_table_spot(self) -> np.ndarray:
        """A reachable bare-table point far from every object (used by oracle grounding / the demo planner)."""
        objs = [self.object_pos(o.name)[:2] for o in self.task.objects]
        clear = [0.14 if o.type == "tray" else 0.08 for o in self.task.objects]
        best, best_score = None, -1e9
        for x in np.linspace(0.34, 0.62, 15):
            for y in np.linspace(-0.34, 0.34, 35):
                score = min(np.hypot(x - p[0], y - p[1]) - c for p, c in zip(objs, clear))
                score -= 0.15 * abs(y)            # prefer spots near the middle of the workspace
                if score > best_score:
                    best, best_score = np.array([x, y, 0.0]), score
        return best

    def _bottle_frame(self, name: str):
        for o in self.task.objects:
            if o.type == "bottle" and name in (f"{o.name}_body_center", f"{o.name}_cap_end"):
                bid = self.model.body(o.name).id
                return self.data.xpos[bid].copy(), self.data.xmat[bid].reshape(3, 3)[:, 2].copy()   # centre, axis (cap side)
        return None

    def bottle_lying(self, name: str = "bottle") -> bool:
        return abs(self.data.xmat[self.model.body(name).id].reshape(3, 3)[2, 2]) < 0.5

    def gt_keypoint(self, name: str):
        if name in self.push_hint:
            return self.push_hint[name].copy(), np.array([0.0, 0.0, 1.0])
        frame = self._bottle_frame(name)
        if frame is not None:                   # surface points on a (possibly lying) bottle
            c, a = frame
            up = np.array([0.0, 0.0, 1.0])
            perp = up - (up @ a) * a
            lying = np.linalg.norm(perp) > 1e-3
            perp = perp / np.linalg.norm(perp) if lying else up
            if name.endswith("_body_center"):
                return (c + BOTTLE_R * perp, up) if lying else (c + a * BOTTLE_HALF_H, a)
            base = c + a * (BOTTLE_HALF_H + CAP_HALF_H)
            return (base + CAP_R * perp, up) if lying else (base + a * CAP_HALF_H, a)
        if name == "table_free_spot":
            return self.free_table_spot(), np.array([0.0, 0.0, 1.0])
        sid = self.model.site(name).id
        return self.data.site_xpos[sid].copy(), self.data.site_xmat[sid].reshape(3, 3)[:, 2].copy()

    def visible_keypoint(self, name: str):
        """Where a careful observer would point: like gt_keypoint, but a tray that already holds something is
        aimed at its visible empty floor (beside the occupant) instead of the covered centre."""
        pos, normal = self.gt_keypoint(name)
        if name == "box_inside":
            box = self.object_pos("box")
            inside = [self.object_pos(o.name) for o in self.task.objects if o.name != "box"
                      if abs(self.object_pos(o.name)[0] - box[0]) < 0.09 and abs(self.object_pos(o.name)[1] - box[1]) < 0.09
                      and self.object_pos(o.name)[2] < 0.1]
            if inside:
                dy = float(np.mean([p[1] - box[1] for p in inside]))
                pos = pos + np.array([0.0, -0.05 if dy > 0 else 0.05, 0.0])
        return pos, normal

    def gt_axis(self, name: str):
        """In-plane edge axis + symmetry for boxy keypoints (cube tops); (None, 180) for round ones."""
        if not name.startswith("cube"):
            return None, 180.0
        sid = self.model.site(name).id
        ax = self.data.site_xmat[sid].reshape(3, 3)[:, 0].copy()
        return ax, 90.0

    def object_pos(self, name: str) -> np.ndarray:
        return self.data.xpos[self.model.body(name).id].copy()

    def object_vel(self, name: str) -> np.ndarray:
        return self.data.cvel[self.model.body(name).id][3:].copy()

    def has_keypoint(self, name: str) -> bool:
        if name == "table_free_spot" or name in self.push_hint or self._bottle_frame(name) is not None:
            return True
        return mujoco.mj_name2id(self.model, mujoco.mjtObj.mjOBJ_SITE, name) >= 0

    def tray_half_inner(self) -> float:
        return TRAY_HALF - 0.016

    def close(self):
        for r in self._renderers.values():
            r.close()
        self._renderers.clear()
