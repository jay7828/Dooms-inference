"""Episode monitor: turns execution results into pass/fail signals + error context for replanning."""
from __future__ import annotations

from dataclasses import dataclass

from .execution.compiler import SubtaskScript
from .execution.runtime import SubtaskResult

GRASP_MIN_WIDTH = 0.008  # closed gripper narrower than this = nothing in the fingers


@dataclass
class Verdict:
    ok: bool
    reason: str = ""


class Monitor:
    def __init__(self):
        self.holding = False
        self.expect_grasp = True      # False in obstacle-clearing plans: the closed gripper is a pusher, not a grasp

    def reset(self):
        self.holding = False

    def check(self, script: SubtaskScript, res: SubtaskResult) -> Verdict:
        actions = [c.action for st in script.stages for c in st if c.name == "Gripper"]
        if not res.success:
            return Verdict(False, f"subtask '{res.name}' did not finish ({res.reason} after {res.sim_seconds:.1f}s)")
        if "close" in actions and not self.expect_grasp:
            return Verdict(True)
        if "close" in actions:
            if res.gripper_width < GRASP_MIN_WIDTH:
                return Verdict(False, f"grasp missed: gripper closed to {res.gripper_width * 1000:.1f} mm on nothing")
            self.holding = True
        elif "open" in actions:
            self.holding = False
        elif self.holding and res.gripper_width < GRASP_MIN_WIDTH:
            return Verdict(False, "the held object was dropped during the motion")
        return Verdict(True)
