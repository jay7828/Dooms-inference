from __future__ import annotations

import numpy as np

from .base import Context, Controller, TaskTerm

Z = np.array([0.0, 0.0, 1.0])


def _fold(x: float, sym: float) -> float:
    return (x + sym / 2) % sym - sym / 2


class YawAlign(Controller):
    """Rotate the gripper about the vertical so the horizontal direction of `source` (eef_y = the direction
    along which the fingers open) makes `angle` with the object's top-face edge `target` (<keypoint>_axis).
    The result is folded by the face's symmetry (90 deg for square faces, 180 deg otherwise)."""

    name = "YawAlign"

    def __init__(self, source: str, target: str, angle: float, priority: int = 2, stage: int = 0):
        self.source, self.target, self.angle = source, target, float(angle)
        self.priority, self.stage = priority, stage
        self._t: np.ndarray | None = None
        self._sym = 180.0

    def on_stage_start(self, ctx: Context) -> None:
        try:
            self._t = ctx.vector(self.target).copy()
        except KeyError:            # no edge direction (round object / open surface): nothing to align to
            self._t = None
            return
        kp = ctx.keypoints.get(self.target[: -len("_axis")]) if self.target.endswith("_axis") else None
        self._sym = kp.axis_sym if kp is not None else 180.0

    def _err(self, ctx: Context) -> float:
        if self._t is None:
            return 0.0
        s = ctx.vector(self.source).copy()
        s[2] = 0.0
        t = self._t.copy()
        t[2] = 0.0
        if np.linalg.norm(s) < 1e-6 or np.linalg.norm(t) < 1e-6:
            return 0.0
        s, t = s / np.linalg.norm(s), t / np.linalg.norm(t)
        phi = np.arctan2(float(Z @ np.cross(s, t)), float(s @ t))
        return _fold(phi - self.angle, np.deg2rad(self._sym))

    def term(self, ctx: Context) -> TaskTerm | None:
        if self._t is None:
            return None
        _, jr = ctx.robot.jacobian(ctx.state.tcp_pos)
        c = ctx.cfg["execution"]
        return TaskTerm(J=(Z @ jr)[None, :], e=np.array([self._err(ctx)]), gain=c["ang_gain"], v_max=c["max_ang_speed"])

    def finished(self, ctx: Context) -> bool:
        return abs(self._err(ctx)) < ctx.cfg["execution"]["ang_tol"]

    def describe(self) -> str:
        return f"YawAlign({self.source}, {self.target}, angle={np.rad2deg(self.angle):.0f} deg)"
