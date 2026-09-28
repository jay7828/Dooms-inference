"""Robot profiles: everything that differs between the arms the simulator can drive.

The pipeline, agents and controllers are arm-agnostic; they only see a `RobotInterface`, the numbers below (gripper
opening, force sensing, scene scale) and the prompt text. Add a new arm by adding a profile here and a builder in
`sim/scenes/builder.py`.
"""
from __future__ import annotations

from dataclasses import dataclass, field, replace
from pathlib import Path

import numpy as np

from . import ROOT

PROMPT_DIR = Path(__file__).resolve().parent / "llm" / "prompts"


@dataclass(frozen=True)
class Dims:
    """Object geometry (metres). Half-sizes follow MuJoCo's convention."""
    bottle_r: float = 0.022
    bottle_half_h: float = 0.07
    cap_r: float = 0.012
    cap_half_h: float = 0.016
    tray_half: float = 0.09
    tray_floor: float = 0.012
    tray_wall_t: float = 0.008
    tray_wall_half_h: float = 0.025
    cube: float = 0.04

    @property
    def bottle_len(self) -> float:
        return 2 * (self.bottle_half_h + self.cap_half_h)

    @property
    def cap_top_z(self) -> float:          # cap top, relative to the bottle body centre
        return self.bottle_half_h + 2 * self.cap_half_h


@dataclass(frozen=True)
class RobotProfile:
    id: str
    label: str
    dof: int
    max_width: float                  # widest gripper opening (m)
    grasp_min_width: float            # a closed gripper narrower than this holds nothing (m)
    force_sensor: bool                # wrist force/torque available (guarded moves work)
    dims: Dims
    scenes: tuple[str, ...]           # scenes this arm supports
    table_center: tuple[float, float]
    table_half: tuple[float, float]
    # task object placement is authored for the Franka (base at the origin, workspace x 0.32-0.58, y +-0.3);
    # other arms remap it: x' = x0 + (x - 0.45) * kx, y' = y * ky
    remap: tuple[float, float, float] | None = None
    max_radius: float | None = None      # objects are kept within this distance of the base (reach limit at working height)
    min_separation: float | None = None
    scene_cam: dict = field(default_factory=dict)
    view: dict = field(default_factory=dict)         # default 3D viewer camera {pos, target}
    finger: dict = field(default_factory=dict)       # clearance footprint: center / length / width (m)
    exec: dict = field(default_factory=dict)         # overrides of cfg["execution"]
    pipeline: dict = field(default_factory=dict)     # overrides of cfg["pipeline"]
    scripted: dict = field(default_factory=dict)     # heights / offsets used by the scripted reference planner
    spec_file: str = "robot_spec.md"

    def spec_text(self) -> str:
        return (PROMPT_DIR / self.spec_file).read_text()

    def supports(self, scene: str) -> bool:
        return scene in self.scenes

    def summary(self) -> dict:
        return {"id": self.id, "label": self.label, "dof": self.dof, "scenes": list(self.scenes),
                "force_sensor": self.force_sensor, "max_width": self.max_width}


FRANKA = RobotProfile(
    id="franka", label="Franka Panda", dof=7, max_width=0.08, grasp_min_width=0.008, force_sensor=True,
    dims=Dims(),
    scenes=("sandbox", "sandbox_fallen", "sandbox_blocked", "put_bottle_in_box", "put_cube_in_box", "stack_cubes"),
    table_center=(0.45, 0.0), table_half=(0.6, 0.65),
    scene_cam={"pos": [0.95, -0.55, 0.80], "lookat": [0.45, 0.0, 0.06], "fovy": 55},
    view={"pos": [1.62, -1.15, 1.2], "target": [0.42, 0.02, 0.1]},
    finger={"center": 0.052, "length": 0.030, "width": 0.034, "max_z": 0.15},
)

# SO-ARM101 (Robot Studio / LeRobot): 5 joints + one moving jaw, position-controlled servos, no force sensing.
# Objects are scaled to its gripper (~6 cm opening) and its ~0.30 m reach; the arm can only reach a few centimetres
# above the table with the gripper pointing straight down, so heights are small.
SO101 = RobotProfile(
    id="so101", label="SO-ARM101", dof=5, max_width=0.055, grasp_min_width=0.011, force_sensor=False,
    dims=Dims(bottle_r=0.013, bottle_half_h=0.017, cap_r=0.007, cap_half_h=0.006,
              tray_half=0.055, tray_floor=0.006, tray_wall_t=0.005, tray_wall_half_h=0.009, cube=0.025),
    scenes=("sandbox", "put_bottle_in_box", "put_cube_in_box", "stack_cubes"),
    table_center=(0.2, 0.0), table_half=(0.42, 0.42),
    remap=(0.205, 0.5, 0.5), max_radius=0.27, min_separation=0.092,
    scene_cam={"pos": [0.48, -0.36, 0.34], "lookat": [0.17, 0.0, 0.01], "fovy": 55},
    view={"pos": [0.72, -0.58, 0.46], "target": [0.15, 0.0, 0.03], "scale": 0.45},
    finger={"center": 0.030, "length": 0.020, "width": 0.020, "max_z": 0.06},
    exec={"max_lin_speed": 0.12, "max_ang_speed": 1.0, "pos_tol": 0.0025, "force_approach_speed": 0.02},
    pipeline={"wrist_refine": False},
    spec_file="robot_spec_so101.md",
)

PROFILES: dict[str, RobotProfile] = {p.id: p for p in (FRANKA, SO101)}
DEFAULT_ROBOT = "franka"


def get_profile(robot: str | None) -> RobotProfile:
    try:
        return PROFILES[robot or DEFAULT_ROBOT]
    except KeyError:
        raise ValueError(f"unknown robot '{robot}' (choose from {sorted(PROFILES)})") from None


def adapt_task(task, profile: RobotProfile):
    """The task as this arm sees it: object placement remapped into its workspace, object sizes and the scene
    description rewritten for its scale. Franka tasks pass through unchanged."""
    if profile.remap is None:
        return task
    x0, kx, ky = profile.remap
    d = profile.dims
    objs = []
    for o in task.objects:
        xr = tuple(x0 + (v - 0.45) * kx for v in o.x_range)
        yr = tuple(v * ky for v in o.y_range)
        if profile.max_radius:                       # cap how far out an object can be placed (arm reach at working height)
            ymax = max(abs(v) for v in yr)
            x_hi = float(np.sqrt(max(profile.max_radius ** 2 - ymax ** 2, 0.0)))
            if xr[1] > x_hi:
                xr = (min(xr[0], x_hi), x_hi)
        up = {"x_range": xr, "y_range": yr}
        if o.type == "cube":
            up["size"] = d.cube
        objs.append(o.model_copy(update=up))
    ctx = _scene_context(task, profile)
    return task.model_copy(update={"objects": objs, "scene_context": ctx,
                                   "min_object_separation": profile.min_separation or task.min_object_separation})


def _scene_context(task, profile: RobotProfile) -> str:
    d = profile.dims
    cm = lambda v: f"{v * 100:.1f} cm"
    parts = ["Robot base is at the world origin, x forward, z up, table top at z=0."]
    what = []
    types = {o.type for o in task.objects}
    if "bottle" in types:
        what.append(f"a small bottle ({cm(d.bottle_len)} tall and {cm(2 * d.bottle_r)} wide, with a narrow cap on top "
                    f"{cm(2 * d.cap_half_h)} tall and {cm(2 * d.cap_r)} wide)")
    cubes = [o for o in task.objects if o.type == "cube"]
    if cubes:
        names = " and ".join(o.name.replace("cube_", "") + " cube" for o in cubes) if len(cubes) > 1 else \
            f"a {cubes[0].name.replace('cube_', '')} cube" if cubes[0].name != "cube" else "a cube"
        what.append(f"{names} ({cm(d.cube)} on each side)")
    if "tray" in types:
        what.append(f'an open tray called "the box" ({cm(2 * d.tray_half)} x {cm(2 * d.tray_half)}, '
                    f"{cm(d.tray_floor + 2 * d.tray_wall_half_h)} tall walls, light enough to slide when pushed)")
    if what:
        parts.append("Objects on the table: " + ", ".join(what) + ".")
    parts.append(f"The gripper opens to at most {profile.max_width * 100:.1f} cm.")
    return " ".join(parts)


def apply_profile(cfg: dict, profile: RobotProfile) -> dict:
    """cfg with this arm's execution / pipeline overrides merged in and the robot id recorded."""
    from .config import deep_update
    return deep_update(cfg, {"robot": profile.id, "execution": dict(profile.exec), "pipeline": dict(profile.pipeline)})
