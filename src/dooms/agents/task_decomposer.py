from __future__ import annotations

from ..llm.base import Image
from ..llm.schemas import Decomposition
from ..perception.camera import RGBDObservation
from ..perception.viz import draw_world_axes, encode_png
from .base import Agent


class TaskDecomposer(Agent):
    name = "task_decomposer"
    schema = Decomposition

    def run(self, instruction: str, obs: RGBDObservation, scene_context: str,
            failure_context: str | None = None) -> Decomposition:
        text = f"Instruction: {instruction}\n\nScene facts: {scene_context}\n"
        if failure_context:
            text += f"\nFAILURE CONTEXT: {failure_context}\n"

        def check(d: Decomposition):
            if not d.feasible:
                if len(d.reason.strip()) < 10:
                    raise ValueError("if the task is infeasible, explain why in `reason`")
                return
            if not 2 <= len(d.subtasks) <= 12:
                raise ValueError("expected between 2 and 12 subtasks")
            for i, s in enumerate(d.subtasks, 1):
                s.id = i

        return self.call([text, Image(encode_png(draw_world_axes(obs.rgb, obs.camera)))], validate=check, label="decompose")
