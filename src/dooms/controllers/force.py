from __future__ import annotations

import numpy as np

from .base import Context, Controller, TaskTerm
from .pos_align import axis_vector

BIAS_SECONDS = 0.2      # stand still and average the wrist wrench before creeping
CONFIRM_TICKS = 3       # consecutive over-threshold ticks required (rejects transients)


class Force(Controller):
    """Guarded move: advance along `axis` at a slow speed until the wrist force along that axis
    changed by `value` newtons relative to the start of the stage (contact detected)."""

    name = "Force"

    def __init__(self, axis: str, value: float, priority: int = 1, stage: int = 0):
        self.axis, self.value = axis, float(value)
        self.priority, self.stage = priority, stage
        self._reset()

    def _reset(self):
        self._acc: list[np.ndarray] = []
        self._bias: np.ndarray | None = None
        self._hits = 0
        self._contact = False

    def on_stage_start(self, ctx: Context) -> None:
        self._reset()

    def _delta(self, ctx: Context) -> float:
        n = axis_vector(ctx, self.axis)
        return abs(float(n @ (ctx.state.wrench[:3] - self._bias)))

    def _update(self, ctx: Context) -> None:
        if self._contact:
            return
        if ctx.t_stage < BIAS_SECONDS:
            self._acc.append(ctx.state.wrench[:3].copy())
            return
        if self._bias is None:
            self._bias = np.mean(self._acc, axis=0) if self._acc else ctx.state.wrench[:3].copy()
        self._hits = self._hits + 1 if self._delta(ctx) >= self.value else 0
        self._contact = self._hits >= CONFIRM_TICKS

    def term(self, ctx: Context) -> TaskTerm | None:
        self._update(ctx)
        if self._contact or self._bias is None:
            return None
        n = axis_vector(ctx, self.axis)
        jp, _ = ctx.robot.jacobian(ctx.state.tcp_pos)
        speed = ctx.cfg["execution"]["force_approach_speed"]
        return TaskTerm(J=(n @ jp)[None, :], e=np.array([1.0]), gain=speed, v_max=speed)

    def finished(self, ctx: Context) -> bool:
        return self._contact

    def describe(self) -> str:
        return f"Force(axis={self.axis}, contact>={self.value:.1f} N)"
