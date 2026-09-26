"""Runtime: evaluates the compiled controllers every tick and drives the robot interface."""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from scipy.spatial.transform import Rotation

from ..controllers.base import Context, Keypoint, TaskTerm
from ..controllers.stack import solve_stack
from ..sim.base import RobotInterface
from .compiler import SubtaskScript


@dataclass
class SubtaskResult:
    subtask_id: int
    name: str
    success: bool
    reason: str
    sim_seconds: float
    stages_done: int
    gripper_width: float = 0.0


class Runtime:
    def __init__(self, robot: RobotInterface, cfg: dict, q_home: np.ndarray):
        self.robot, self.cfg, self.q_home = robot, cfg, q_home
        self.dt = 1.0 / cfg["sim"]["control_hz"]
        self._q_des: np.ndarray | None = None

    def hold(self, seconds: float = 0.2) -> None:
        for _ in range(int(seconds / self.dt)):
            self._servo([])
            self.robot.step()

    def _hold_terms(self, s, p_hold, R_hold) -> list[TaskTerm]:
        c = self.cfg["execution"]
        jp, jr = self.robot.jacobian(s.tcp_pos)
        e_rot = Rotation.from_matrix(R_hold @ s.tcp_rot.T).as_rotvec()
        return [TaskTerm(J=jp, e=p_hold - s.tcp_pos, gain=c["pos_gain"], v_max=c["max_lin_speed"]),
                TaskTerm(J=jr, e=e_rot, gain=c["ang_gain"], v_max=c["max_ang_speed"])]

    def go_home(self, seconds: float = 2.5) -> None:
        """Recovery motion: open the gripper and return to the home posture (clears the camera's view)."""
        self.robot.set_gripper(0.08)
        q0 = self.robot.state().q.copy()
        n = int(seconds / self.dt)
        for i in range(1, n + 1):
            a = i / n
            self.robot.set_joint_targets(q0 + (self.q_home - q0) * (a * a * (3 - 2 * a)))
            self.robot.step()
        self._q_des = None
        self.hold(0.3)

    def _servo(self, levels: list) -> None:
        s = self.robot.state()
        if self._q_des is None:
            self._q_des = s.q.copy()
        c = self.cfg["execution"]
        if levels:
            dq = solve_stack(levels, self.robot.n_joints, c["damping"], q_post_err=self.q_home - s.q)
        else:  # nothing to track (e.g. gripper-only stage): hold the pose
            dq = np.zeros(self.robot.n_joints)
        # integrate the target, but never let it run far ahead of the measured joints
        self._q_des = np.clip(self._q_des + dq * self.dt, s.q - 0.12, s.q + 0.12)
        self.robot.set_joint_targets(self._q_des)

    def run_subtask(self, script: SubtaskScript, keypoints, on_stage_done=None) -> SubtaskResult:
        """`keypoints`: dict, or a callable returning the current keypoint snapshot (re-read at every stage)."""
        self._q_des = None
        c = self.cfg["execution"]
        t0 = self.robot.state().t
        stages_done = 0
        provider = keypoints
        for stage in script.stages:
            keypoints = provider() if callable(provider) else provider
            ctx = Context(self.robot, self.robot.state(), keypoints, self.cfg, 0.0, self.dt)
            for ctl in stage:
                ctl.on_stage_start(ctx)
            grip = [g for g in (ctl.gripper_command() for ctl in stage) if g is not None]
            if grip:
                self.robot.set_gripper(grip[-1])
            ok_ticks, ts = 0, 0.0
            s0 = self.robot.state()
            p_hold, R_hold = s0.tcp_pos.copy(), s0.tcp_rot.copy()
            while True:
                s = self.robot.state()
                if s.t - t0 > c["max_subtask_seconds"]:
                    return SubtaskResult(script.subtask_id, script.name, False, "timeout",
                                         s.t - t0, stages_done, s.gripper_width)
                ctx = Context(self.robot, s, keypoints, self.cfg, ts, self.dt)
                terms = [(ctl.priority, ctl.term(ctx)) for ctl in stage]
                levels = [lv for lv in ([t for p, t in terms if p == pr and t is not None]
                                        for pr in sorted({p for p, _ in terms})) if lv]
                if levels:   # lowest priority: axes nobody commands stay where they were (no posture drift)
                    levels.append(self._hold_terms(s, p_hold, R_hold))
                self._servo(levels)
                self.robot.step()
                ts += self.dt
                ctx = Context(self.robot, self.robot.state(), keypoints, self.cfg, ts, self.dt)
                done = all(ctl.finished(ctx) for ctl in stage)
                ok_ticks = ok_ticks + 1 if done else 0
                if ok_ticks >= 3:
                    break
            stages_done += 1
            if on_stage_done is not None:
                on_stage_done(stage)
        s = self.robot.state()
        return SubtaskResult(script.subtask_id, script.name, True, "converged", s.t - t0, stages_done,
                             s.gripper_width)
