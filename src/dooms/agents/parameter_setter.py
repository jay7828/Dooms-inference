from __future__ import annotations

import json

from ..llm.base import Image
from ..llm.schemas import Decomposition, ParameterGroundings, SkillRecipes
from ..perception.camera import RGBDObservation
from ..perception.viz import draw_world_axes, encode_png
from .base import Agent

LIMITS = {"m": (-1.0, 1.0), "deg": (-360.0, 360.0), "N": (0.5, 30.0)}


class ParameterSetter(Agent):
    name = "parameter_setter"
    schema = ParameterGroundings

    def run(self, instruction: str, subtasks: Decomposition, recipes: SkillRecipes, obs: RGBDObservation,
            scene_context: str, failure_context: str | None = None,
            hints: dict[int, dict[str, float]] | None = None) -> ParameterGroundings:
        names = {s.id: s.name for s in subtasks.subtasks}
        lines = []
        for r in recipes.recipes:
            lines.append(f"Subtask {r.subtask_id}: {names[r.subtask_id]}")
            for c in r.controllers:
                lines.append(f"  stage {c.stage} p{c.priority}: " + json.dumps(c.model_dump(exclude_none=True)))
            for p in r.params:
                lines.append(f"  PARAM {p.name} [{p.unit}]: {p.description}")
            if hints and hints.get(r.subtask_id):
                lines.append("  values that worked when this stored skill succeeded before (a starting point - adapt to "
                             "THIS scene): " + ", ".join(f"{k}={v:g}" for k, v in hints[r.subtask_id].items()))
        text = (f"Instruction: {instruction}\n\nScene facts: {scene_context}\n\nSkill recipes:\n" + "\n".join(lines))
        if failure_context:
            text += f"\n\nFAILURE CONTEXT: {failure_context}"
        return self.call([text, Image(encode_png(draw_world_axes(obs.rgb, obs.camera)))],
                         validate=lambda g: self._check(g, recipes), label="parameters")

    @staticmethod
    def _check(g: ParameterGroundings, recipes: SkillRecipes):
        have = {(v.subtask_id, v.name): v.value for v in g.values}
        for r in recipes.recipes:
            for p in r.params:
                if (r.subtask_id, p.name) not in have:
                    raise ValueError(f"missing value for subtask {r.subtask_id} parameter {p.name}")
                lo, hi = LIMITS[p.unit]
                if not lo <= have[(r.subtask_id, p.name)] <= hi:
                    raise ValueError(f"subtask {r.subtask_id} {p.name}={have[(r.subtask_id, p.name)]} is outside "
                                     f"the plausible range {lo}..{hi} {p.unit}")

    @staticmethod
    def values_for(g: ParameterGroundings, subtask_id: int) -> dict[str, float]:
        return {v.name: v.value for v in g.values if v.subtask_id == subtask_id}
