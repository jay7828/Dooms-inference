from __future__ import annotations

import numpy as np

from .base import Context, Controller, TaskTerm


def axis_vector(ctx: Context, axis: str) -> np.ndarray:
    sign = -1.0 if axis.startswith("-") else 1.0
    return sign * ctx.vector(axis.lstrip("-+"))


class PosAlign(Controller):
    """Drive `source` so that  n . p_source = n . p_target + offset  along task axis n."""

    name = "PosAlign"

    def __init__(self, source: str, target: str, axis: str, offset: float, priority: int = 1, stage: int = 0):
        self.source, self.target, self.axis, self.offset = source, target, axis, float(offset)
        self.priority, self.stage = priority, stage
        self._r_tcp: np.ndarray | None = None   # held-point offset in tcp frame
        self._target_pos: np.ndarray | None = None

    def on_stage_start(self, ctx: Context) -> None:
        s = ctx.state
        if self.source == "eef_tcp":
            self._r_tcp = np.zeros(3)
        else:
            p0 = ctx.keypoints[self.source].pos
            self._r_tcp = s.tcp_rot.T @ (p0 - s.tcp_pos)
        # target is a snapshot: live eef_tcp is frozen at stage start
        self._target_pos = s.tcp_pos.copy() if self.target == "eef_tcp" else ctx.keypoints[self.target].pos.copy()

    def _source_now(self, ctx: Context) -> np.ndarray:
        return ctx.state.tcp_pos + ctx.state.tcp_rot @ self._r_tcp

    def _error(self, ctx: Context):
        n = axis_vector(ctx, self.axis)
        p = self._source_now(ctx)
        return n, float(n @ (self._target_pos - p) + self.offset), p

    def term(self, ctx: Context) -> TaskTerm:
        n, e, p = self._error(ctx)
        jp, _ = ctx.robot.jacobian(p)
        c = ctx.cfg["execution"]
        return TaskTerm(J=(n @ jp)[None, :], e=np.array([e]), gain=c["pos_gain"], v_max=c["max_lin_speed"])

    def finished(self, ctx: Context) -> bool:
        return abs(self._error(ctx)[1]) < ctx.cfg["execution"]["pos_tol"]

    def describe(self) -> str:
        return f"PosAlign({self.source}, {self.target}, axis={self.axis}, offset={self.offset:+.3f} m)"
