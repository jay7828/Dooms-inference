from __future__ import annotations

from .base import Context, Controller, TaskTerm



class Gripper(Controller):
    """Open / close / set width. Finished once the fingers stop moving."""

    name = "Gripper"

    def __init__(self, action: str = "open", width: float | None = None, priority: int = 1, stage: int = 0):
        self.action = action
        self._given = width
        self.width = {"close": 0.0}.get(action, width)          # open / unset: the robot's full opening, set at stage start
        self.priority, self.stage = priority, stage
        self._prev_w: float | None = None
        self._still = 0

    def on_stage_start(self, ctx: Context) -> None:
        self._prev_w, self._still = None, 0
        if self.action == "open" or self.width is None:
            self.width = ctx.robot.max_width if self._given is None or self.action == "open" else self._given

    def gripper_command(self) -> float:
        return self.width

    def term(self, ctx: Context) -> TaskTerm | None:
        return None

    def finished(self, ctx: Context) -> bool:
        w = ctx.state.gripper_width
        if self._prev_w is not None and abs(w - self._prev_w) < 1e-4:
            self._still += 1
        else:
            self._still = 0
        self._prev_w = w
        return ctx.t_stage > 0.3 and self._still >= 8

    def describe(self) -> str:
        return f"Gripper({self.action}" + (f", width={self.width:.3f} m)" if self.width is not None else ")")
