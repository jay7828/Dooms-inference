"""MuJoCo implementation of SimEnv + RobotInterface (Franka Panda or SO-ARM101, chosen by the robot profile)."""
from __future__ import annotations

import mujoco
import numpy as np

from ..perception.camera import CameraParams, RGBDObservation
from ..robots import DEFAULT_ROBOT, RobotProfile, adapt_task, get_profile
from ..task import TaskSpec
from .base import RobotInterface, RobotState, SimEnv
from .scene_export import poses
from .scenes.builder import build_spec

ARM_JOINTS = {"franka": [f"joint{i}" for i in range(1, 8)],
              "so101": ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll"]}
GRIPPER_CTRL_MAX = 255.0
# SO-ARM101 ready pose (pan, lift, elbow, wrist flex, wrist roll): hovers over the workspace, gripper pointing down
SO101_HOME = np.array([0.0, -0.59, 0.45, 1.55, 0.0])
SO101_FIXED_PAD_X = -0.0115        # inner face of the fixed jaw in the `gripper` body frame (m)


class MuJoCoEnv(SimEnv, RobotInterface):
    def __init__(self, task: TaskSpec, cfg: dict, robot: str | RobotProfile | None = None, extras=None):
        self.profile = robot if isinstance(robot, RobotProfile) else get_profile(robot)
        self.dims = self.profile.dims
        self.max_width = self.profile.max_width
        self.force_sensor = self.profile.force_sensor
        self.task, self.cfg = adapt_task(task, self.profile), cfg
        self.model = build_spec(self.task, cfg, self.profile, extras).compile()
        self.data = mujoco.MjData(self.model)
        m = self.model
        so = self.profile.id == "so101"
        self.n_joints = self.profile.dof
        self._jid = [m.joint(n).id for n in ARM_JOINTS[self.profile.id]]
        self._qadr = np.array([m.jnt_qposadr[j] for j in self._jid])
        self._dadr = np.array([m.jnt_dofadr[j] for j in self._jid])
        self._hand = m.body("gripper" if so else "hand").id
        self._tcp = m.site("tcp").id
        if so:
            self._jaw = m.joint("gripper").id
            self._jaw_adr = m.jnt_qposadr[self._jaw]
            self._build_jaw_table()
        else:
            self._fq = [m.jnt_qposadr[m.joint(n).id] for n in ("finger_joint1", "finger_joint2")]
            self._ft = m.site("ft").id
            self._force_adr = m.sensor_adr[mujoco.mj_name2id(m, mujoco.mjtObj.mjOBJ_SENSOR, "wrist_force")]
            self._torque_adr = m.sensor_adr[mujoco.mj_name2id(m, mujoco.mjtObj.mjOBJ_SENSOR, "wrist_torque")]
        self._lo = m.jnt_range[self._jid, 0].copy()
        self._hi = m.jnt_range[self._jid, 1].copy()
        self.control_dt = 1.0 / cfg["sim"]["control_hz"]
        self._substeps = max(1, int(round(self.control_dt / m.opt.timestep)))
        self._renderers: dict[tuple, mujoco.Renderer] = {}
        self._q_des = np.zeros(self.n_joints)
        self._grip_ctrl = GRIPPER_CTRL_MAX if not so else self._width_to_jaw(self.max_width)
        self.frames: list[np.ndarray] = []
        self.record = False
        self.pose_sink = None       # callable(t, poses (nbody,7) float32) every control tick (live 3D streaming)
        self.push_hint: dict[str, np.ndarray] = {}   # keypoints a (scripted) planner defined on the fly
        self.frame_sink = None      # callable(rgb ndarray) invoked at video_fps while stepping (live streaming)
        self._frame_every = max(1, int(round(cfg["sim"]["control_hz"] / cfg["pipeline"].get("video_fps", 20))))
        self._tick = 0
        self.q_home = SO101_HOME.copy() if so else m.key("home").qpos[:7].copy()

    # ---------------------------------------------------------------- SO-ARM101 jaw <-> opening width
    def _build_jaw_table(self) -> None:
        """The SO-ARM101 has one moving jaw on a hinge. Opening width = distance from the fixed jaw's inner face to the
        moving jaw's fingertip along the opening direction; tabulated once so it can be inverted."""
        m = self.model
        d = mujoco.MjData(m)
        tip = m.geom("moving_jaw_sph_tip1").id
        body = self._hand
        lo, hi = m.jnt_range[self._jaw]
        thetas = np.linspace(lo, hi, 181)
        widths = []
        for th in thetas:
            d.qpos[:] = 0
            d.qpos[self._jaw_adr] = th
            mujoco.mj_kinematics(m, d)
            local = d.xmat[body].reshape(3, 3).T @ (d.geom_xpos[tip] - d.xpos[body])
            widths.append(local[0] - SO101_FIXED_PAD_X)
        self._jaw_theta, self._jaw_width = thetas, np.maximum.accumulate(np.array(widths))   # monotone in the usable range

    def _width_to_jaw(self, width: float) -> float:
        return float(np.interp(np.clip(width, self._jaw_width[0], self.max_width), self._jaw_width, self._jaw_theta))

    def _gripper_width(self) -> float:
        if self.profile.id == "so101":
            return float(np.interp(self.data.qpos[self._jaw_adr], self._jaw_theta, self._jaw_width))
        d = self.data
        return float(d.qpos[self._fq[0]] + d.qpos[self._fq[1]])

    # ---------------------------------------------------------------- scene
    def reset(self, seed: int) -> None:
        m, d = self.model, self.data
        rng = np.random.default_rng(seed)
        if self.profile.id == "so101":
            mujoco.mj_resetData(m, d)
            d.qpos[self._qadr] = self.q_home
            d.qpos[self._jaw_adr] = self._width_to_jaw(self.max_width)
        else:
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
                    z = self.dims.bottle_r + 0.002
                d.qpos[adr:adr + 3] = [x, y, z]
                d.qpos[adr + 3:adr + 7] = quat
        mujoco.mj_forward(m, d)
        self._q_des = self.q_home.copy()
        self._grip_ctrl = self._width_to_jaw(self.max_width) if self.profile.id == "so101" else GRIPPER_CTRL_MAX
        self.frames.clear()
        self.push_hint = {}
        self._tick = 0
        self._apply_ctrl()
        for _ in range(int(self.cfg["sim"]["settle_seconds"] / m.opt.timestep)):
            mujoco.mj_step(m, d)

    # ---------------------------------------------------------------- RobotInterface
    def state(self) -> RobotState:
        d = self.data
        wrench = np.zeros(6)                       # arms without a wrist sensor report zeros
        if self.force_sensor:
            R_ft = d.site_xmat[self._ft].reshape(3, 3)
            wrench[:3] = R_ft @ d.sensordata[self._force_adr:self._force_adr + 3]
            wrench[3:] = R_ft @ d.sensordata[self._torque_adr:self._torque_adr + 3]
        return RobotState(
            q=d.qpos[self._qadr].copy(), dq=d.qvel[self._dadr].copy(),
            tcp_pos=d.site_xpos[self._tcp].copy(), tcp_rot=d.site_xmat[self._tcp].reshape(3, 3).copy(),
            gripper_width=self._gripper_width(), wrench=wrench, t=float(d.time))

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
        if self.profile.id == "so101":
            self._grip_ctrl = self._width_to_jaw(width)         # jaw angle (rad)
        else:
            self._grip_ctrl = float(np.clip(width / self.max_width, 0, 1) * GRIPPER_CTRL_MAX)

    def _apply_ctrl(self):
        self.data.ctrl[:self.n_joints] = self._q_des
        self.data.ctrl[self.n_joints] = self._grip_ctrl

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
        k = self.dims.tray_half / 0.09                   # keep-out radii scale with the arm's objects
        clear = [(0.14 if o.type == "tray" else 0.08) * k for o in self.task.objects]
        best, best_score = None, -1e9
        x0, x1, y1 = (0.34, 0.62, 0.34) if self.profile.id == "franka" else (0.11, 0.26, 0.15)
        for x in np.linspace(x0, x1, 15):
            for y in np.linspace(-y1, y1, 35):
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
            D = self.dims
            BOTTLE_R, BOTTLE_HALF_H, CAP_R, CAP_HALF_H = D.bottle_r, D.bottle_half_h, D.cap_r, D.cap_half_h
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
            th = self.dims.tray_half
            inside = [self.object_pos(o.name) for o in self.task.objects if o.name != "box"
                      if abs(self.object_pos(o.name)[0] - box[0]) < th and abs(self.object_pos(o.name)[1] - box[1]) < th
                      and self.object_pos(o.name)[2] < 0.1]
            if inside:
                dy = float(np.mean([p[1] - box[1] for p in inside]))
                pos = pos + np.array([0.0, (-0.55 if dy > 0 else 0.55) * th, 0.0])
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
        return self.dims.tray_half - 0.016

    def close(self):
        for r in self._renderers.values():
            r.close()
        self._renderers.clear()
