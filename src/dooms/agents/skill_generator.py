from __future__ import annotations

import re

from ..controllers.library import controller_doc, keypoints_in, referenced_keypoints
from ..llm.schemas import Decomposition, KeypointRequest, ParamSpec, SkillPlan, SkillRecipe, SkillRecipes
from ..skills import NAME_RE, SkillLibrary, instantiate
from .base import Agent

EEF_VECTORS = {"eef_x", "eef_y", "eef_z", "eef_x_axis", "eef_y_axis", "eef_z_axis", "world_x", "world_y", "world_z"}
UNIT = {"PosAlign": "m", "AxisAlign": "deg", "YawAlign": "deg", "Force": "N", "Gripper": "m"}


class SkillGenerator(Agent):
    """Chooses, per subtask, a STORED skill to reuse or defines a new one; returns concrete recipes."""

    name = "skill_generator"
    schema = SkillPlan

    def run(self, instruction: str, subtasks: Decomposition, vocab: dict[str, str], library: SkillLibrary | None = None,
            failure_context: str | None = None) -> tuple[SkillRecipes, list[dict]]:
        st = "\n".join(f"{s.id}. {s.name} - {s.description}" for s in subtasks.subtasks)
        kp = "\n".join(f"- {k}: {v}" for k, v in vocab.items())
        lib_text = library.listing() if library is not None else "STORED SKILLS: none (library disabled). Create new skills."
        text = (f"Instruction: {instruction}\n\nSubtasks:\n{st}\n\nScene keypoint vocabulary "
                f"(known keypoints you can use directly; each also has a <name>_normal surface-normal vector). You may also "
                f"DEFINE new keypoints for places/things not listed:\n{kp}\n\n{lib_text}\n\n"
                f"{controller_doc(self.robot.max_width, self.robot.force_sensor)}")
        if failure_context:
            text += f"\nFAILURE CONTEXT: {failure_context}\n"
        force = self.robot.force_sensor
        plan = self.call([text], validate=lambda p: self.assemble(p, subtasks, vocab, library, force) and None,
                         label="recipes", attempts=3)
        return self.assemble(plan, subtasks, vocab, library, force)

    @classmethod
    def assemble(cls, plan: SkillPlan, subtasks: Decomposition, vocab: dict[str, str],
                 library: SkillLibrary | None, allow_force: bool = True) -> tuple[SkillRecipes, list[dict]]:
        """Turn the agent's choices into concrete recipes (instantiating stored skills), validating everything."""
        if [c.subtask_id for c in plan.choices] != [s.id for s in subtasks.subtasks]:
            raise ValueError("need exactly one choice per subtask, in order, with matching subtask_id")
        recipes, infos = [], []
        # a keypoint defined in ANY choice is valid for the whole plan (the agent often defines it once)
        plan_defined = {k.name: k for c in plan.choices for k in c.keypoints if k.name not in vocab}
        for ch in plan.choices:
            sid = ch.subtask_id
            defined = list(plan_defined.values())
            if ch.recipe is None:                                     # ---- reuse a stored skill
                sk = library.get(ch.skill_name) if library is not None else None
                if sk is None:
                    raise ValueError(f"subtask {sid}: '{ch.skill_name}' is not a stored skill "
                                     f"({library.names() if library else 'library disabled'}). Reuse one of those, or CREATE "
                                     "a new skill by providing `recipe` (and a new name).")
                missing = [r for r in sk.roles if r not in ch.role_bindings]
                if missing:
                    raise ValueError(f"subtask {sid}: skill '{sk.name}' needs role_bindings for {missing}")
                recipe = SkillRecipe(subtask_id=sid, keypoints=defined, controllers=instantiate(sk, ch.role_bindings),
                                     params=[p.model_copy() for p in sk.params])
            else:                                                     # ---- create a new skill
                if library is not None and ch.skill_name in library.names():     # keep both: the new one becomes a variant
                    n = 2
                    while f"{ch.skill_name}_v{n}" in library.names():
                        n += 1
                    ch = ch.model_copy(update={"skill_name": f"{ch.skill_name}_v{n}"})
                if not NAME_RE.match(ch.skill_name):
                    raise ValueError(f"subtask {sid}: skill names are lowercase snake_case (3-48 chars)")
                if len(ch.description.strip()) < 15:
                    raise ValueError(f"subtask {sid}: a new skill needs a general one-sentence `description`")
                recipe = ch.recipe.model_copy(update={"subtask_id": sid, "keypoints": list(ch.recipe.keypoints) + defined})
                unbound = [k for k in referenced_keypoints(recipe.controllers) if k not in ch.role_bindings.values()]
                if unbound:
                    raise ValueError(f"subtask {sid}: put every object keypoint used by the new skill into role_bindings "
                                     f"(role name -> keypoint); missing: {unbound}")
            recipes.append(recipe)
            infos.append({"subtask_id": sid, "skill_name": ch.skill_name, "reused": ch.recipe is None,
                          "role_bindings": dict(ch.role_bindings), "description": ch.description})
        out = SkillRecipes(recipes=recipes)
        cls._check(out, subtasks, vocab, allow_force)
        for info, rec in zip(infos, out.recipes):
            info["recipe"] = rec.model_copy(deep=True)
        return out, infos

    NAME_RE = re.compile(r"^[a-z][a-z0-9_]{1,40}$")

    @classmethod
    def _check(cls, r: SkillRecipes, subtasks: Decomposition, vocab: dict[str, str], allow_force: bool = True):
        if [x.subtask_id for x in r.recipes] != [s.id for s in subtasks.subtasks]:
            raise ValueError("need exactly one recipe per subtask, in order, with matching subtask_id")
        for rec in r.recipes:
            defined = {k.name: k.description.strip() for k in rec.keypoints if k.name not in vocab}
            for name, desc in defined.items():
                if not cls.NAME_RE.match(name) or name.endswith(("_normal", "_norm", "_axis")):
                    raise ValueError(f"subtask {rec.subtask_id}: '{name}' is not a valid new keypoint name "
                                     "(lowercase snake_case, must not end with _normal/_axis)")
                if len(desc) < 8:
                    raise ValueError(f"subtask {rec.subtask_id}: new keypoint '{name}' needs a precise description "
                                     "of what the vision system should point at")
            for c in rec.controllers:
                if c.type == "Force" and not allow_force:
                    raise ValueError(f"subtask {rec.subtask_id}: this robot has NO force sensor, so the Force controller is not "
                                     "available. Lower onto the surface with PosAlign and a small z offset instead "
                                     "(e.g. hold the object's keypoint at its own height + 0.003 m above the surface).")
                if c.type in ("PosAlign", "AxisAlign", "YawAlign") and not (c.source and c.target):
                    raise ValueError(f"subtask {rec.subtask_id}: {c.type} needs source and target")
                if c.type == "PosAlign" and (c.axis or "z") not in ("x", "y", "z"):
                    raise ValueError(f"subtask {rec.subtask_id}: PosAlign axis must be x, y or z")
                if c.type == "Force" and (c.axis or "").lstrip("-+") not in ("x", "y", "z"):
                    raise ValueError(f"subtask {rec.subtask_id}: Force axis must be one of x,y,z,-x,-y,-z")
                if c.type == "Gripper" and c.action is None:
                    raise ValueError(f"subtask {rec.subtask_id}: Gripper needs action open|close|width")
                if c.type == "Gripper" and c.action == "width" and not c.param:
                    raise ValueError(f"subtask {rec.subtask_id}: Gripper width needs a param")
                if c.type in ("PosAlign", "AxisAlign", "YawAlign", "Force") and not c.param:
                    raise ValueError(f"subtask {rec.subtask_id}: {c.type} needs a symbolic param")
                for n in (c.source, c.target):
                    for k in keypoints_in(n):
                        if k not in vocab and k not in defined:
                            raise ValueError(
                                f"subtask {rec.subtask_id}: unknown keypoint '{k}'. Use one of {sorted(vocab)} (plus eef_tcp, "
                                "eef_z), or DEFINE a new one: add {\"name\": \"...\", \"description\": \"...\"} to the `keypoints` list "
                                "of one of your choices (a definition anywhere in the plan counts for all subtasks; "
                                "it works for reused skills too) with a precise description of what to point at, e.g. "
                                "'an empty spot on the table to the right of the box'.")
                    if c.type == "YawAlign" and n not in ("eef_y", "eef_y_axis") and not (n or "").endswith("_axis") and "__to__" not in (n or ""):
                        raise ValueError(f"subtask {rec.subtask_id}: YawAlign source must be eef_y and target <keypoint>_axis")
                    if c.type == "AxisAlign" and n not in EEF_VECTORS and not (n or "").endswith(("_normal", "_norm")) and "__to__" not in (n or ""):
                        raise ValueError(f"subtask {rec.subtask_id}: AxisAlign vectors must be eef_z or <keypoint>_normal")
            motion = ("PosAlign", "AxisAlign", "YawAlign", "Force")
            for g in (c for c in rec.controllers if c.type == "Gripper" and c.action == "close"):
                if any(c.type in motion and c.stage == g.stage for c in rec.controllers):
                    raise ValueError(f"subtask {rec.subtask_id}: Gripper(close) is in the same stage as motion controllers, so the "
                                     "fingers would close during the motion. Put the motion in stage 0 and Gripper(close) in stage 1.")
            for c in rec.controllers:
                if c.type == "PosAlign" and c.source == "eef_tcp" and c.target == "eef_tcp" and c.axis == "z" and c.stage == 0 \
                        and any(g.action == "open" and g.stage == 0 for g in rec.controllers if g.type == "Gripper"):
                    raise ValueError(f"subtask {rec.subtask_id}: retracting in the same stage as Gripper(open) would drag the object "
                                     "along. Open in stage 0, retract in stage 1.")
            # repair: request exactly the object keypoints the controllers reference; declare undeclared params
            rec.keypoints = [KeypointRequest(name=k, description=vocab.get(k) or defined[k])
                             for k in referenced_keypoints(rec.controllers)]
            declared = {p.name for p in rec.params}
            for c in rec.controllers:
                if c.param and c.param not in declared:
                    rec.params.append(ParamSpec(name=c.param, description=f"{c.type} parameter", unit=UNIT[c.type]))
                    declared.add(c.param)
