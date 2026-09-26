"""Compile a grounded skill (recipe + numeric parameters) into an executable robot script."""
from __future__ import annotations

from dataclasses import dataclass

from ..controllers.base import Controller
from ..controllers.library import build_controller
from ..llm.schemas import SkillRecipe


@dataclass
class SubtaskScript:
    subtask_id: int
    name: str
    stages: list[list[Controller]]      # stage -> controllers (each with its priority)
    values: dict[str, float]

    def to_text(self) -> str:
        lines = [f"# subtask {self.subtask_id}: {self.name}"]
        for i, stage in enumerate(self.stages):
            lines.append(f"stage {i}:")
            for c in sorted(stage, key=lambda c: c.priority):
                lines.append(f"  [p{c.priority}] {c.describe()}")
        return "\n".join(lines)


def compile_subtask(recipe: SkillRecipe, name: str, values: dict[str, float]) -> SubtaskScript:
    missing = [c.param for c in recipe.controllers if c.param and c.param not in values]
    if missing:
        raise ValueError(f"subtask {recipe.subtask_id}: no value for parameters {sorted(set(missing))}")
    controllers = [build_controller(spec, values) for spec in recipe.controllers]
    n_stages = 1 + max((c.stage for c in controllers), default=0)
    stages = [[c for c in controllers if c.stage == s] for s in range(n_stages)]
    return SubtaskScript(recipe.subtask_id, name, [s for s in stages if s], dict(values))
