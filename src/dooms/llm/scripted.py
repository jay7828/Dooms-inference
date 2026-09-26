"""A scripted stand-in for Bedrock: returns a hand-written reference plan and (optionally noisy) pixel points.

Used for tests and for `--llm scripted` dry runs, so the whole stack can be exercised without AWS keys.
"""
from __future__ import annotations

import re

import numpy as np

from ..controllers.library import referenced_keypoints
from ..task import TaskSpec
from .base import CallRecord, MockLLM
from .schemas import (SkillChoice, SkillPlan, ControllerSpec, Decomposition, KeypointRequest, ParamSpec, ParameterGroundings, ParamValue,
                      PixelPoint, PixelPoints, SkillRecipe, SkillRecipes, Subtask)

CROP, ZOOM = 96, 5

# keypoints the planner defines itself (they are NOT in the scene vocabulary)
DEFINED = {
    "table_free_spot": "an empty spot of bare table, clear of all objects and the box",
    "bottle_body_center": "the middle of the lying bottle's body, on its top surface",
    "bottle_cap_end": "the top of the cap at the far end of the lying bottle",
}


def _keypoint_for(task: TaskSpec, obj: str) -> str:
    for k in task.keypoints:
        if k.startswith(obj):
            return k
    raise KeyError(obj)


def reference_plan(task: TaskSpec, pair: tuple[str, str] | None = None, lying: bool = False):
    obj, dest = pair or (task.success[0].object, task.success[0].target)
    lying = lying and obj == "bottle"
    K = f"{obj}_body_center" if lying else _keypoint_for(task, obj)
    KE = f"{obj}_cap_end"
    D = "box_inside" if dest == "box" else ("table_free_spot" if dest == "table" else _keypoint_for(task, dest))
    nice = obj.replace("_", " ")
    if lying and dest == "box":
        return (Decomposition(observations=f"The {nice} is lying on its side (about 0.17 m long).", feasible=False,
                              reason=f"The {nice} is lying down and is longer than the box's inner width (0.148 m); a top-down "
                                     "parallel gripper cannot stand it up or fit it inside. It can only be moved on the table.",
                              subtasks=[]), None, None)
    subtasks = [Subtask(id=i, name=n, description=n) for i, n in enumerate([
        f"Approach {nice} for pre-grasp" if not lying else f"Approach the lying {nice} from above",
        f"Grasp the {nice}" if not lying else f"Grasp the lying {nice} across its body", f"Lift the {nice} up",
        f"Move over the {dest.replace('_', ' ')}", f"Place down the {nice}", "Release and retract"], 1)]

    def C(**kw):
        return ControllerSpec(**kw)

    def xyz(i, src, tgt, names, stage=0):
        return [C(type="PosAlign", source=src, target=tgt, axis=a, param=names[a], priority=1, stage=stage)
                for a in "xyz" if a in names]

    P = lambda n, d, u: ParamSpec(name=n, description=d, unit=u)
    is_cube = obj.startswith("cube")
    grasp_yaw = is_cube or lying                       # boxy or lying objects: fingers across the width
    yaw_target = f"{K}__to__{KE}" if lying else f"{K}_axis"
    dest_cube = D.startswith("cube")
    dyaw = ([C(type="YawAlign", source="eef_y", target=f"{D}_axis", param="o_yaw", priority=2)] if dest_cube else [])
    dyp = [P("o_yaw", "finger direction vs destination edge", "deg")] if dest_cube else []
    down_d = C(type="AxisAlign", source="eef_z", target=f"{D}_normal", param="o_theta", priority=2)
    yaw = ([C(type="YawAlign", source="eef_y", target=yaw_target, param="o_yaw", priority=2)] if grasp_yaw else [])
    yp = [P("o_yaw", "finger direction vs object edge / long axis", "deg")] if grasp_yaw else []
    recipes = [
        SkillRecipe(subtask_id=1, keypoints=[], params=[P("o_x", "x offset", "m"), P("o_y", "y offset", "m"),
                                                      P("o_z", "hover height above the grasp point", "m"),
                                                      P("o_theta", "angle between gripper axis and surface normal", "deg")] + yp,
                    controllers=xyz(1, "eef_tcp", K, {"x": "o_x", "y": "o_y", "z": "o_z"}) +
                                [C(type="AxisAlign", source="eef_z", target=f"{K}_normal", param="o_theta", priority=2)] + yaw),
        SkillRecipe(subtask_id=2, keypoints=[], params=[P("o_x", "x offset", "m"), P("o_y", "y offset", "m"),
                                                      P("o_d", "signed z offset of the fingertips from the keypoint (negative = below)", "m"),
                                                      P("o_theta", "gripper vs normal angle", "deg")] + yp,
                    controllers=xyz(2, "eef_tcp", K, {"x": "o_x", "y": "o_y", "z": "o_d"}) +
                                [C(type="AxisAlign", source="eef_z", target=f"{K}_normal", param="o_theta", priority=2)] + yaw +
                                [C(type="Gripper", action="close", stage=1)]),
        SkillRecipe(subtask_id=3, keypoints=[], params=[P("o_x", "x offset", "m"), P("o_y", "y offset", "m"),
                                                      P("o_z", "lift height", "m"), P("o_theta", "angle", "deg")],
                    controllers=xyz(3, K, K, {"x": "o_x", "y": "o_y", "z": "o_z"}) +
                                [C(type="AxisAlign", source="eef_z", target=f"{K}_normal", param="o_theta", priority=2)]),
        SkillRecipe(subtask_id=4, keypoints=[], params=[P("o_x", "x offset", "m"), P("o_y", "y offset", "m"),
                                                      P("o_z", "hover height of the held keypoint over the destination", "m"),
                                                      P("o_theta", "angle", "deg")] + dyp,
                    controllers=xyz(4, K, D, {"x": "o_x", "y": "o_y", "z": "o_z"}) + [down_d] + dyaw),
        SkillRecipe(subtask_id=5, keypoints=[], params=[P("o_x", "x offset", "m"), P("o_y", "y offset", "m"),
                                                      P("f", "contact force", "N"), P("o_theta", "angle", "deg")] + dyp,
                    controllers=xyz(5, K, D, {"x": "o_x", "y": "o_y"}) + [C(type="Force", axis="-z", param="f"), down_d] + dyaw),
        SkillRecipe(subtask_id=6, keypoints=[], params=[P("o_z", "retract height", "m")],
                    controllers=[C(type="Gripper", action="open", stage=0),
                                 C(type="PosAlign", source="eef_tcp", target="eef_tcp", axis="z", param="o_z", stage=1)]),
    ]
    grasp = -0.014 if is_cube else (-0.02 if lying else -0.016)
    hover_dest = (0.20 if dest == "box" else 0.12) if is_cube else (0.30 if dest != "table" else 0.26)
    if lying:
        hover_dest = 0.16
    values = {
        1: {"o_x": 0, "o_y": 0, "o_z": 0.12, "o_theta": 180, **({"o_yaw": 90} if grasp_yaw else {})},
        2: {"o_x": 0, "o_y": 0, "o_d": grasp, "o_theta": 180, **({"o_yaw": 90} if grasp_yaw else {})},
        3: {"o_x": 0, "o_y": 0, "o_z": 0.15 if (is_cube or lying) else 0.20, "o_theta": 180},
        4: {"o_x": 0, "o_y": 0, "o_z": hover_dest, "o_theta": 180, **({"o_yaw": 90} if dest_cube else {})},
        5: {"o_x": 0, "o_y": 0, "f": 2.0, "o_theta": 180, **({"o_yaw": 90} if dest_cube else {})},
        6: {"o_z": 0.15},
    }
    params = ParameterGroundings(values=[ParamValue(subtask_id=s, name=n, value=float(v), rationale="reference")
                                         for s, d in values.items() for n, v in d.items()])
    for r in recipes:        # keypoints the planner defines itself are declared with a description
        r.keypoints = [KeypointRequest(name=n, description=DEFINED[n]) for n in referenced_keypoints(r.controllers)
                       if n in DEFINED]
    obs = (f"The {nice} is lying on its side on the table." if lying else f"The {nice} is standing / resting normally.")
    return Decomposition(observations=obs, subtasks=subtasks), SkillRecipes(recipes=recipes), params


def merge_plan(dec, rec, par):
    """Collapse the 6 reference subtasks into ONE subtask with sequential stages (what a planner without
    a decomposer has to produce). Parameter names are made unique per original subtask."""
    if not dec.feasible:
        return dec, rec, par
    controllers, params, values, offset, kps = [], [], [], 0, {}
    for r in rec.recipes:
        n_stages = 1 + max(c.stage for c in r.controllers)
        for c in r.controllers:
            c = c.model_copy(update={"stage": c.stage + offset,
                                     "param": f"{c.param}_{r.subtask_id}" if c.param else None})
            controllers.append(c)
        params += [p.model_copy(update={"name": f"{p.name}_{r.subtask_id}"}) for r in [r] for p in r.params]
        values += [v.model_copy(update={"subtask_id": 1, "name": f"{v.name}_{r.subtask_id}"})
                   for v in par.values if v.subtask_id == r.subtask_id]
        kps.update({k.name: k for k in r.keypoints})
        offset += n_stages
    one = Decomposition(observations=dec.observations, subtasks=[dec.subtasks[0].model_copy(update={"name": "Complete the task"})])
    return one, SkillRecipes(recipes=[SkillRecipe(subtask_id=1, keypoints=list(kps.values()), controllers=controllers,
                                                  params=params)]), ParameterGroundings(values=values)


def _footprints(env, task, skip: set[str]):
    """(centre, half-extent) circles for the other objects; a lying bottle becomes a few circles along its axis."""
    out = []
    for o in task.objects:
        if o.name in skip:
            continue
        c = env.object_pos(o.name)[:2]
        if o.type == "tray":
            out.append((c, 0.13))
        elif o.type == "bottle":
            a = env.data.xmat[env.model.body(o.name).id].reshape(3, 3)[:, 2][:2]
            out += [(c + a * t, 0.035) for t in np.linspace(-0.08, 0.08, 5)] if env.bottle_lying(o.name) else [(c, 0.035)]
        else:
            out.append((c, 0.045))
    return out


def clear_reference_plan(task, env, pair):
    """Demo-planner answer to an OBSTACLE report: push the blocking object away, on a feasible side."""
    obj = pair[0] if pair else task.success[0].object
    tgt = env.gt_keypoint(f"{obj}_body_center" if (obj == "bottle" and env.bottle_lying()) else _keypoint_for(task, obj))[0][:2]
    cands = [o for o in task.objects if o.name != obj]
    blocker = min(cands, key=lambda o: np.linalg.norm(env.object_pos(o.name)[:2] - tgt))
    c = env.object_pos(blocker.name)[:2]
    half = 0.09 if blocker.type == "tray" else 0.02
    others = _footprints(env, task, {blocker.name})
    best = None
    for d in (np.array([1.0, 0]), np.array([-1.0, 0]), np.array([0, 1.0]), np.array([0, -1.0])):
        for L in (0.16, 0.22):
            S = c - d * (half + 0.035)
            path = [S + d * L * t for t in np.linspace(0, 1, 9)]
            if not all(0.30 <= p[0] <= 0.64 and abs(p[1]) <= 0.34 for p in path):
                continue
            if any(np.linalg.norm(p - oc) < r + 0.03 for p in path for oc, r in others):
                continue
            end = c + d * L
            score = np.linalg.norm(end - tgt) - 0.3 * L
            if best is None or score > best[0]:
                best = (score, d, L, S)
    if best is None:
        return Decomposition(observations="Something blocks the grasp but there is no free side to push it from.", feasible=False,
                             reason="An object blocks the gripper and it cannot be pushed away from any side.", subtasks=[]), None, None
    _, d, L, S = best
    name = f"{blocker.name}_push_start"
    env.push_hint = {name: np.array([S[0], S[1], 0.0])}
    nice = blocker.name.replace("_", " ")
    subtasks = [Subtask(id=i, name=n, description=n) for i, n in enumerate([
        f"Move above the push start point beside the {nice}", f"Lower the closed gripper beside the {nice}",
        f"Push the {nice} away from the {obj}", "Retract upward"], 1)]
    P = lambda n, dsc, u: ParamSpec(name=n, description=dsc, unit=u)
    C_ = lambda **kw: ControllerSpec(**kw)
    kp = [KeypointRequest(name=name, description=f"a bare-table point just outside the {nice}'s wall, on the side "
                                                 "opposite to the direction it should be pushed")]
    xy = lambda src, tgt: [C_(type="PosAlign", source=src, target=tgt, axis="x", param="o_x"),
                           C_(type="PosAlign", source=src, target=tgt, axis="y", param="o_y")]
    recipes = [
        SkillRecipe(subtask_id=1, keypoints=kp, params=[P("o_x", "x offset", "m"), P("o_y", "y offset", "m"), P("o_z", "hover height", "m"),
                                                        P("o_theta", "angle", "deg")],
                    controllers=xy("eef_tcp", name) + [C_(type="PosAlign", source="eef_tcp", target=name, axis="z", param="o_z"),
                                                       C_(type="AxisAlign", source="eef_z", target=f"{name}_normal", param="o_theta", priority=2),
                                                       C_(type="Gripper", action="close", stage=1)]),
        SkillRecipe(subtask_id=2, keypoints=kp, params=[P("o_x", "x offset", "m"), P("o_y", "y offset", "m"), P("o_z", "tcp height above the table", "m")],
                    controllers=xy("eef_tcp", name) + [C_(type="PosAlign", source="eef_tcp", target=name, axis="z", param="o_z")]),
        SkillRecipe(subtask_id=3, keypoints=[], params=[P("o_x", "x displacement", "m"), P("o_y", "y displacement", "m"), P("o_z", "z displacement", "m")],
                    controllers=xy("eef_tcp", "eef_tcp") + [C_(type="PosAlign", source="eef_tcp", target="eef_tcp", axis="z", param="o_z")]),
        SkillRecipe(subtask_id=4, keypoints=[], params=[P("o_z", "retract height", "m")],
                    controllers=[C_(type="PosAlign", source="eef_tcp", target="eef_tcp", axis="z", param="o_z")]),
    ]
    vals = {1: {"o_x": 0, "o_y": 0, "o_z": 0.10, "o_theta": 180}, 2: {"o_x": 0, "o_y": 0, "o_z": 0.03},
            3: {"o_x": float(d[0] * L), "o_y": float(d[1] * L), "o_z": 0.0}, 4: {"o_z": 0.12}}
    params = ParameterGroundings(values=[ParamValue(subtask_id=s, name=n, value=float(v), rationale="push plan")
                                         for s, dd in vals.items() for n, v in dd.items()])
    dec = Decomposition(observations=f"The {nice} is right beside the {obj}: the gripper's fingers would hit it. "
                                     f"I will push the {nice} {L * 100:.0f} cm along ({d[0]:+.0f}, {d[1]:+.0f}) first.",
                        clears_obstacle=True, subtasks=subtasks)
    return dec, SkillRecipes(recipes=recipes), params


PUSH_SKILLS = {1: "move_above_push_start", 2: "lower_closed_gripper", 3: "push_along_table", 4: "retract_up"}
PUSH_DESC = {
    "move_above_push_start": "Move the gripper above a start point on the table and close it into a pusher, pointing down.",
    "lower_closed_gripper": "Lower the closed gripper to a low height (beside an object) without moving sideways.",
    "push_along_table": "Slide the closed gripper horizontally by a set displacement to push whatever is in front of it.",
    "retract_up": "Lift the gripper straight up.",
}


def push_to_plan(rec, library_names) -> SkillPlan:
    choices = []
    for r in rec.recipes:
        name = PUSH_SKILLS[r.subtask_id]
        refs = referenced_keypoints(r.controllers)
        bindings = {"start": refs[0]} if refs else {}
        if name in library_names:
            choices.append(SkillChoice(subtask_id=r.subtask_id, skill_name=name, role_bindings=bindings, keypoints=r.keypoints))
        else:
            choices.append(SkillChoice(subtask_id=r.subtask_id, skill_name=name, role_bindings=bindings, keypoints=[],
                                       description=PUSH_DESC[name], recipe=r))
    return SkillPlan(choices=choices)


SKILL_NAMES = {1: "approach_above", 2: "grasp_from_above", 3: "lift_held", 4: "move_over", 5: "place_down_on_contact",
               6: "release_and_retract"}
SKILL_DESC = {
    "approach_above": "Move the gripper above a target point and point it straight down, aligned with the target's edges.",
    "grasp_from_above": "Lower the open gripper onto a target point from above and close the fingers on it.",
    "lift_held": "Lift the object held in the gripper straight up while keeping it level.",
    "move_over": "Carry the held object over a destination point and hover above it, aligned with its edges.",
    "place_down_on_contact": "Lower the held object onto the surface below until contact is felt.",
    "release_and_retract": "Open the gripper to let go, then move straight up away from the object.",
    "approach_above_aligned": "Move the gripper above a boxy target and point it down with the fingers aligned to the target's edges.",
    "grasp_from_above_aligned": "Lower onto a boxy target from above with the fingers aligned to its faces and close the gripper.",
    "move_over_aligned": "Carry the held object over a boxy destination and hover above it, edges aligned.",
    "place_down_on_contact_aligned": "Lower the held object onto a boxy destination, edges aligned, until contact is felt.",
    "approach_above_long_axis": "Move the gripper above a lying elongated object with the fingers turned across its long axis.",
    "grasp_from_above_long_axis": "Lower onto a lying elongated object from above across its width and close the fingers.",
}


def to_plan(rec, task, pair, lying, library_names) -> SkillPlan:
    """Express the reference recipes as skill choices: reuse a stored skill when its name is in the library."""
    obj, dest = pair or (task.success[0].object, task.success[0].target)
    K = f"{obj}_body_center" if (lying and obj == "bottle") else _keypoint_for(task, obj)
    D = "box_inside" if dest == "box" else ("table_free_spot" if dest == "table" else _keypoint_for(task, dest))
    roles = {"obj": K, "dest": D, "obj_end": f"{obj}_cap_end"}
    choices = []
    for r in rec.recipes:
        aligned = any(c.type == "YawAlign" for c in r.controllers)
        name = SKILL_NAMES[r.subtask_id] + ("_long_axis" if lying and r.subtask_id in (1, 2) else "_aligned" if aligned else "")
        refs = referenced_keypoints(r.controllers)
        bindings = {role: kp for role, kp in roles.items() if kp in refs}
        defined = [k for k in r.keypoints if k.name in DEFINED]
        if name in library_names:
            choices.append(SkillChoice(subtask_id=r.subtask_id, skill_name=name, role_bindings=bindings, keypoints=defined))
        else:
            choices.append(SkillChoice(subtask_id=r.subtask_id, skill_name=name, role_bindings=bindings, keypoints=[],
                                       description=SKILL_DESC[name], recipe=r))
    return SkillPlan(choices=choices)


def merged_to_plan(rec) -> SkillPlan:
    r = rec.recipes[0]
    refs = referenced_keypoints(r.controllers)
    return SkillPlan(choices=[SkillChoice(subtask_id=1, skill_name=f"do_the_whole_task_{abs(hash(tuple(refs))) % 9999}",
                                          role_bindings={k: k for k in refs}, description="One-off plan for the whole task.",
                                          recipe=r)])


class ScriptedLLM(MockLLM):
    def __init__(self, task: TaskSpec, env=None, pixel_noise: tuple[float, float] = (0.0, 0.0), seed: int = 0,
                 pair: tuple[str, str] | None = None):
        self.task, self.env, self.pair = task, env, pair
        self.noise = pixel_noise
        self.rng = np.random.default_rng(seed)
        self._coarse: dict[str, tuple[float, float]] = {}
        self._src: dict[str, tuple[str, int, int]] = {}
        self._plans = None
        single = lambda text: "\n2. " not in text and "Subtask 2:" not in text

        def plans():        # built lazily, from the scene as it is when planning starts (after any reset)
            if self._plans is None:
                lying = bool(self.env is not None and any(o.type == "bottle" and o.lying for o in task.objects)
                             and self.env.bottle_lying())
                dec, rec, par = reference_plan(task, pair, lying)
                self._plans = ((dec, rec, par), merge_plan(dec, rec, par), lying)
            return self._plans

        def skills(c, s):
            if self._mode == "clear":
                return push_to_plan(self._clear[1], set(re.findall(r"^- (\w+)\(roles:", c[0], flags=re.M)))
            p = plans()
            if single(c[0]):
                return merged_to_plan(p[1][1])
            names = set(re.findall(r"^- (\w+)\(roles:", c[0], flags=re.M))
            return to_plan(p[0][1], task, pair, p[2], names)

        self._mode = "task"
        self._clear = None

        def decompose(c, s):
            if "OBSTACLE" in c[0] and self.env is not None:      # the pipeline reported a blocked grasp
                self._mode = "clear"
                self._clear = clear_reference_plan(task, self.env, pair)
                return self._clear[0]
            self._mode = "task"
            return plans()[0][0]

        def parameters(c, s):
            if self._mode == "clear":
                return self._clear[2]
            return plans()[1][2] if single(c[0]) else plans()[0][2]

        super().__init__({"task_decomposer": decompose,
                          "skill_generator": skills,
                          "parameter_setter": parameters,
                          "vision_grounder": self._ground})

    def _project(self, name: str, cam_name: str = "scene"):
        obs = self.env.render(cam_name)
        p, _ = self.env.visible_keypoint(name)
        cam = obs.camera
        pc = np.linalg.inv(cam.T_world_cam) @ np.append(p, 1.0)
        d = -pc[2]
        return pc[0] / d * cam.fx + cam.cx, -pc[1] / d * cam.fy + cam.cy

    def _ground(self, content, schema):
        text = content[0]
        names = re.findall(r"^- (\w+):", text, flags=re.M)
        zoomed = "zoomed crop" in text
        size = re.search(r"Image size: (\d+) x (\d+)", text)
        pts = []
        for n in names:
            if not zoomed:                                   # coarse pass on the full image: scene or wrist camera
                w, h = int(size.group(1)), int(size.group(2))
                self._src[n] = ("wrist" if (w, h) == (320, 240) else "scene", w, h)
            cam, w, h = self._src[n]
            gu, gv = self._project(n, cam)
            if not zoomed:
                u, v = gu + self.rng.normal(0, self.noise[0]), gv + self.rng.normal(0, self.noise[0])
                self._coarse[n] = (u, v)
            else:
                cu, cv = self._coarse[n]
                x0 = int(np.clip(round(cu) - CROP // 2, 0, w - CROP))
                y0 = int(np.clip(round(cv) - CROP // 2, 0, h - CROP))
                u = (gu + self.rng.normal(0, self.noise[1]) - x0) * ZOOM
                v = (gv + self.rng.normal(0, self.noise[1]) - y0) * ZOOM
            pts.append(PixelPoint(name=n, u=float(u), v=float(v)))
        return PixelPoints(points=pts)
