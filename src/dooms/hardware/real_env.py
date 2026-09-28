"""The pipeline's robot + world interface for a physical SO-ARM101 (or the virtual rig standing in for one).

Kinematics come from a digital twin (the MuJoCo model driven by the measured joint angles), vision from the overview
camera and its calibration, and every command passes the safety layer: joint limits, a joint-speed cap, a table-floor
check, overload (collision) detection and temperature / voltage watchdogs. In dry-run mode nothing is sent to the
servos; the twin follows the commands so the motion can be previewed in the 3D view.
"""
from __future__ import annotations

import mujoco
import numpy as np

from ..perception.camera import RGBDObservation
from ..robots import get_profile
from ..sim.mujoco_env import SO101_HOME, MuJoCoEnv
from ..sim.scene_export import poses
from ..task import TaskSpec
from .feetech import BusError
from .so101 import ARM, JOINTS, REF_Q, ArmCalibration, HardwareError, SafetyConfig, SafetyStop, SO101Hardware

MAX_MISSED_READS = 4          # consecutive failed reads the loop rides through (~80 ms) before stopping

TIP_LOCAL = np.array([-0.0065, 0.0, -0.100])       # between the closed jaw tips (gripper body frame)
REST_Q = np.array([0.0, -1.60, 1.55, 1.10, 0.0, -0.1745])   # folded: safe to switch the torque off
JAW_CLOSED = -0.1745


def twin_task() -> TaskSpec:
    return TaskSpec(name="twin", instruction="", objects=[], keypoints={}, success=[])


class RealSO101Env:
    def __init__(self, hw: SO101Hardware, cal: ArmCalibration, cfg: dict, safety: SafetyConfig, clock,
                 gt_env=None):
        self.profile = get_profile("so101")
        self.dims = self.profile.dims
        self.max_width = self.profile.max_width
        self.force_sensor = False
        self.n_joints = 5
        self.q_home = SO101_HOME.copy()
        self.hw, self.cal, self.cfg, self.safety, self.clock = hw, cal, cfg, safety, clock
        self.twin = MuJoCoEnv(twin_task(), cfg, self.profile)
        self._kin = mujoco.MjData(self.twin.model)           # scratch data for floor checks
        self._jaw_lo, self._jaw_hi = self.twin.model.jnt_range[self.twin.model.joint("gripper").id]
        self.ground_truth_env = gt_env
        self.camera = None
        self.camera_cal = None
        self.task = twin_task()
        self.control_dt = 1.0 / cfg["sim"]["control_hz"]
        self.frames: list = []
        self.record = False
        self.pose_sink = None
        self.frame_sink = None
        self._frame_every = 5
        self._tick = 0
        self._overload_t = np.zeros(len(JOINTS))
        self.t0 = clock.now()
        self._next = clock.now()
        self.last_load: dict = {}
        self.refresh_limits()
        self._q = self._read_q()
        self._q_sent = self._q.copy()
        self._q_cmd = self._q.copy()
        self._update_twin()

    # ------------------------------------------------------------------ configuration
    @property
    def dry_run(self) -> bool:
        return self.safety.dry_run

    @property
    def grasp_min_width(self) -> float:
        return -1.0 if self.dry_run else self.profile.grasp_min_width     # dry run: nothing is really grasped

    def refresh_limits(self) -> None:
        lo, hi = self.cal.limits()
        self._lo6, self._hi6 = lo, hi
        self._lo, self._hi = lo[:5].copy(), hi[:5].copy()

    def bind(self, task: TaskSpec, camera, camera_cal) -> None:
        from ..robots import adapt_task
        self.task = adapt_task(task, self.profile)
        self.camera, self.camera_cal = camera, camera_cal

    # ------------------------------------------------------------------ RobotInterface
    def _read_q(self) -> np.ndarray:
        if self.dry_run and hasattr(self, "_q_sent"):
            return self._q_sent.copy()
        pos, load = self.hw.read_motion()
        self.last_load = load
        return self.cal.to_q(pos)

    def _update_twin(self) -> None:
        d = self.twin.data
        d.qpos[self.twin._qadr] = self._q[:5]
        d.qpos[self.twin._jaw_adr] = self._q[5]
        d.time = self.clock.now() - self.t0
        mujoco.mj_kinematics(self.twin.model, d)
        mujoco.mj_comPos(self.twin.model, d)

    def state(self):
        return self.twin.state()

    def jacobian(self, point_world):
        return self.twin.jacobian(point_world)

    def joint_limits(self):
        return self._lo, self._hi

    def set_joint_targets(self, q) -> None:
        self._q_cmd[:5] = np.clip(q, self._lo, self._hi)

    def set_gripper(self, width: float) -> None:
        self._q_cmd[5] = float(np.clip(self.twin._width_to_jaw(width), max(self._jaw_lo, self._lo6[5]),
                                       min(self._jaw_hi, self._hi6[5])))

    def tip_of(self, q: np.ndarray) -> np.ndarray:
        k, m = self._kin, self.twin.model
        k.qpos[self.twin._qadr] = q[:5]
        k.qpos[self.twin._jaw_adr] = q[5]
        mujoco.mj_kinematics(m, k)
        gb = m.body("gripper").id
        return k.xpos[gb] + k.xmat[gb].reshape(3, 3) @ TIP_LOCAL

    def _floor_ok(self, q: np.ndarray) -> bool:
        """Refuse motions that push the jaw tips below the table; moving up out of it is always allowed."""
        z_new = self.tip_of(q)[2]
        if z_new > -0.004:
            return True
        return z_new >= self.tip_of(self._q_sent)[2] - 0.0005

    def step(self) -> None:
        dt = self.control_dt
        max_step = self.safety.joint_speed * dt
        target = self._q_sent + np.clip(self._q_cmd - self._q_sent, -max_step, max_step)
        target[5] = self._q_sent[5] + np.clip(self._q_cmd[5] - self._q_sent[5], -3 * max_step, 3 * max_step)
        if not self._floor_ok(target):
            self.hold()
            raise SafetyStop("stopped: that motion would push the gripper into the table")
        self._q_sent = target
        if not self.dry_run:
            self.hw.write_goals(self.cal.to_counts(self._q_sent))
        now = self.clock.now()
        if self._next > now:
            self.clock.sleep(self._next - now)
            self._next += dt
        else:
            self._next = now + dt                          # fell behind (slow bus / camera): do not try to catch up
        try:
            self._q = self._read_q()
            self._missed = 0
        except BusError as e:                               # a glitch: keep the last reading for a few ticks
            self._missed = getattr(self, "_missed", 0) + 1
            if self._missed > MAX_MISSED_READS:
                self._q_cmd = self._q_sent.copy()
                raise HardwareError(f"lost communication with the arm ({e}); it holds its last position. "
                                    "Check the USB cable and power, then reconnect.") from e
        self._tick += 1
        if not self.dry_run:
            self._watchdogs(dt)
        self._update_twin()
        if self.pose_sink is not None:
            self.pose_sink(float(self.twin.data.time), poses(self.twin.data))
        if self.frame_sink is not None and self.camera is not None and self._tick % self._frame_every == 0:
            try:
                self.frame_sink(self.camera.read())
            except Exception:  # noqa: BLE001  (a camera hiccup must not stop the arm mid-motion)
                pass

    def _watchdogs(self, dt: float) -> None:
        limit = self.safety.overload_pct * 10
        if not hasattr(self, "_overload_q"):
            self._overload_q = self._q.copy()
        for i, j in enumerate(JOINTS):
            # Blocked = straining hard and far behind the command, with NO progress during the whole window.
            # (Accelerating, or lifting slowly at the edge of reach, also loads a servo, but the joint keeps moving.)
            lag = abs(self._q_sent[i] - self._q[i])
            heavy = j in ARM and abs(self.last_load.get(i + 1, 0)) >= limit and lag >= self.safety.overload_lag
            if not heavy:
                self._overload_t[i] = 0.0
                continue
            if self._overload_t[i] == 0.0:
                self._overload_q[i] = self._q[i]                 # where the joint was when the strain began
            self._overload_t[i] += dt
            if abs(self._q[i] - self._overload_q[i]) > np.radians(1.5):
                self._overload_t[i] = dt                         # it is getting there: restart the window here
                self._overload_q[i] = self._q[i]
            if self._overload_t[i] >= self.safety.overload_seconds:
                self.hold()
                stretched = float(np.hypot(*self.tip()[:2])) > 0.26 and self.tip()[2] > -0.002
                raise SafetyStop(f"stopped: {j.replace('_', ' ')} is overloaded. " + (
                    "The arm is stretched far out and may not be strong enough to hold this pose: work closer to "
                    "the base, or check that nothing is pressing on it." if stretched else
                    "Something is blocking it: clear the obstruction, then continue."))
        if self._tick % 25 == 0:                         # twice a second
            try:
                tel = self.hw.telemetry()
            except BusError:
                return                                       # the next check comes half a second later
            if tel["temperature"] >= self.safety.max_temperature:
                self.hold()
                raise SafetyStop(f"stopped: a servo is at {tel['temperature']} C. Let the arm cool down.")
            base = self.hw.base_voltage or tel["voltage"]
            if tel["voltage"] < self.safety.min_voltage_ratio * base:
                self.hold()
                raise SafetyStop(f"stopped: supply voltage dropped to {tel['voltage']:.1f} V (was {base:.1f} V)")

    def hold(self) -> None:
        """Stay exactly where the arm is now (the Stop button, and every safety stop)."""
        if not self.dry_run:
            try:
                self.hw.hold()
                self._q = self._read_q()
            except Exception:  # noqa: BLE001
                pass
        self._q_sent = self._q.copy()
        self._q_cmd = self._q.copy()

    def sync_from_hardware(self) -> None:
        """Re-read the arm (after torque was off and it was moved by hand) so the next command starts from there."""
        self._q = self._read_q() if not self.dry_run else self._q
        self._q_sent = self._q.copy()
        self._q_cmd = self._q.copy()
        self._next = self.clock.now()
        self._update_twin()

    # ------------------------------------------------------------------ motions used by the setup screens
    def move_to(self, q6, timeout: float = 12.0) -> None:
        q6 = np.asarray(q6, float)
        self._q_cmd[:5] = np.clip(q6[:5], self._lo, self._hi)
        self._q_cmd[5] = np.clip(q6[5], self._lo6[5], self._hi6[5])
        t_end = self.clock.now() + timeout
        while self.clock.now() < t_end:
            self.step()
            if np.all(np.abs(self._q - self._q_cmd) < 0.03) and np.all(np.abs(self._q_sent - self._q_cmd) < 1e-6):
                return
        raise SafetyStop("the arm did not reach the target pose (blocked, or torque too low)")

    def jog(self, delta_xyz, timeout: float = 4.0) -> None:
        """Move the jaw tips by a small Cartesian step (metres) with the gripper pointing down, the way tasks work.
        (Leaving the orientation free lets the arm stretch out straight, which asks more of the shoulder than it has.)"""
        from ..controllers.axis_align import AxisAlign
        from ..controllers.base import Keypoint
        from ..controllers.pos_align import PosAlign
        from ..execution.compiler import SubtaskScript
        from ..execution.runtime import Runtime
        tip = self.tip()
        goal = Keypoint("jog_goal", tip + np.asarray(delta_xyz, float), np.array([0.0, 0.0, 1.0]))
        tcp = self.state().tcp_pos
        off = tcp - tip                                     # move the tcp so the tip lands on the goal
        ctls = [PosAlign("eef_tcp", "jog_goal", ax, float(off[k]), 1, 0) for k, ax in enumerate("xyz")]
        ctls.append(AxisAlign("eef_z", "world_z", np.pi, 2, 0))
        cfg = {**self.cfg, "execution": {**self.cfg["execution"], "max_subtask_seconds": timeout}}
        Runtime(self, cfg, self.q_home).run_subtask(SubtaskScript(0, "jog", [ctls], {}), {"jog_goal": goal})

    def tip(self) -> np.ndarray:
        d, m = self.twin.data, self.twin.model
        gb = m.body("gripper").id
        return d.xpos[gb] + d.xmat[gb].reshape(3, 3) @ TIP_LOCAL

    def joints_deg(self) -> dict[str, float]:
        return {j: round(float(np.degrees(self._q[i])), 1) for i, j in enumerate(JOINTS)}

    # ------------------------------------------------------------------ world (what SimEnv provides)
    def keypoint_height(self, name: str) -> float:
        """Height of the surface a keypoint lies on; the RGB-only camera lifts pixels onto this plane."""
        d = self.dims
        low = name.lower()
        if any(w in low for w in ("table", "spot", "push", "floor_free", "free_")):
            return 0.0
        for o in self.task.objects:
            if low.startswith(o.name):
                if o.type == "cube":
                    return float(o.size)
                if o.type == "bottle":
                    return float(d.bottle_len)
                if o.type == "tray":
                    return float(d.tray_floor)
        return 0.0

    def face_size(self, name: str) -> float | None:
        """Side of a square top face under a keypoint (cubes), used to recognise that face in the image."""
        low = name.lower()
        for o in self.task.objects:
            if low.startswith(o.name) and o.type == "cube" and not any(w in low for w in ("table", "spot", "push")):
                return float(o.size)
        return None

    def render(self, camera: str = "scene") -> RGBDObservation:
        if camera != "scene":
            raise RuntimeError("this robot has no wrist depth camera; wrist re-grounding is disabled")
        if self.camera is None or self.camera_cal is None:
            raise RuntimeError("the overview camera is not connected and calibrated")
        rgb = self.camera.read()
        h, w = rgb.shape[:2]
        return RGBDObservation(rgb=rgb, depth=None, camera=self.camera_cal.params(w, h),
                               t=float(self.twin.data.time), height_of=self.keypoint_height,
                               face_size_of=self.face_size)

    def reset(self, seed: int) -> None:
        """A real table cannot be reset by software; the person arranges it."""

    def has_keypoint(self, name: str) -> bool:
        return self.ground_truth_env is not None and self.ground_truth_env.has_keypoint(name)

    def gt_keypoint(self, name: str):
        return self.ground_truth_env.gt_keypoint(name)

    def object_pos(self, name: str):
        return self.ground_truth_env.object_pos(name)

    def object_vel(self, name: str):
        return self.ground_truth_env.object_vel(name)

    def close(self) -> None:
        pass


def ref_pose() -> np.ndarray:
    return REF_Q.copy()
