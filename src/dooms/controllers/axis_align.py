from __future__ import annotations

import numpy as np

from .base import Context, Controller, TaskTerm


def _perp_basis(u: np.ndarray) -> np.ndarray:
    a = np.array([1.0, 0, 0]) if abs(u[0]) < 0.9 else np.array([0, 1.0, 0])
    b1 = np.cross(u, a)
    b1 /= np.linalg.norm(b1)
    b2 = np.cross(u, b1)
    return np.stack([b1, b2], axis=1)  # (3,2)


class AxisAlign(Controller):
    """Rotate so the angle between `source` and `target` vectors equals `angle` (radians).
    Rotation about `source` itself is left free."""

    name = "AxisAlign"

    def __init__(self, source: str, target: str, angle: float, priority: int = 1, stage: int = 0):
        self.source, self.target, self.angle = source, target, float(angle)
        self.priority, self.stage = priority, stage
        self._target_vec: np.ndarray | None = None

    def on_stage_start(self, ctx: Context) -> None:
        # snapshot target vector unless it is a live eef axis
        if not self.target.startswith("eef"):
            self._target_vec = ctx.vector(self.target).copy()

    def _rot_error(self, ctx: Context):
        u = ctx.vector(self.source)
        v = self._target_vec if self._target_vec is not None else ctx.vector(self.target)
        # desired direction t: v rotated by `angle` in the plane spanned by (v, u)
        w = u - (u @ v) * v
        if np.linalg.norm(w) < 1e-6:
            w = _perp_basis(v)[:, 0]
        w /= np.linalg.norm(w)
        t = np.cos(self.angle) * v + np.sin(self.angle) * w
        c = np.cross(u, t)
        s = np.linalg.norm(c)
        phi = np.arctan2(s, float(u @ t))
        axis = c / s if s > 1e-8 else _perp_basis(u)[:, 0]
        return u, phi * axis, phi

    def term(self, ctx: Context) -> TaskTerm:
        u, e3, _ = self._rot_error(ctx)
        B = _perp_basis(u)
        _, jr = ctx.robot.jacobian(ctx.state.tcp_pos)
        c = ctx.cfg["execution"]
        return TaskTerm(J=B.T @ jr, e=B.T @ e3, gain=c["ang_gain"], v_max=c["max_ang_speed"])

    def finished(self, ctx: Context) -> bool:
        return self._rot_error(ctx)[2] < ctx.cfg["execution"]["ang_tol"]

    def describe(self) -> str:
        return f"AxisAlign({self.source}, {self.target}, angle={np.rad2deg(self.angle):.0f} deg)"
