"""Controller library: registry, and the description handed to the Skill Generator agent."""
from __future__ import annotations

import numpy as np

from .axis_align import AxisAlign
from .base import Controller
from .force import Force
from .gripper import Gripper
from .pos_align import PosAlign
from .yaw_align import YawAlign

CONTROLLER_LIBRARY_DOC = """\
Controller library (all controllers run simultaneously inside a stage; stages run in order).

PosAlign(source, target, axis, offset)
  Moves the point `source` so that, along task axis `axis`, it sits `offset` metres from `target`
  (n . p_source = n . p_target + offset). `axis` is one of x, y, z (world axes; z is up).
  `source` is the point the robot moves: either eef_tcp (the gripper's fingertip centre) or an object
  keypoint that is currently held in the gripper. `target` is a static point: an object keypoint, or
  eef_tcp (= where the gripper is at the start of the stage, useful for relative moves).
  To reach a 3D position you use three PosAlign controllers (x, y, z).
  offset parameter names: o_x, o_y, o_z (metres). Positive offset = source ABOVE / beyond target.

AxisAlign(source, target, angle)
  Rotates so that the angle between the direction vectors `source` and `target` equals `angle`
  (degrees). Vectors: eef_z (direction the gripper points; the fingers point along +eef_z),
  or <keypoint>_normal (surface normal of a grounded keypoint, pointing away from the surface),
  or <A>__to__<B> (the direction from keypoint A to keypoint B, e.g. bottle_body_center__to__bottle_cap_end = the
  long axis of a bottle lying on the table; both keypoints get grounded).
  angle 180 makes them anti-parallel. To point the gripper STRAIGHT DOWN use AxisAlign(eef_z, world_z, 180): this is the
  robust choice (world_z is the exact up vector). Use <keypoint>_normal only for a genuinely tilted flat surface; the
  measured normal of a curved surface (a cylinder lying down, a ball) is unreliable. Parameter name: o_theta (degrees).

YawAlign(source, target, angle)
  Turns the gripper about the vertical so that the direction `source` (eef_y = the direction along which the
  fingers open and close) makes `angle` degrees with the horizontal edge direction `target` = <keypoint>_axis
  of that keypoint's top face, or `target` = <A>__to__<B> (any two keypoints; only its horizontal direction
  counts). angle 90 = fingers close across the edge = grasp the flat sides of a box-like
  object. Square faces are treated as 90 degree symmetric. Needed for boxy objects (cubes); NOT needed for
  round ones (bottles). Parameter name: o_yaw (degrees). Use priority 2 together with AxisAlign.

Force(axis, value)
  Guarded move: creeps along `axis` (x, y, z, or negative like -z) until a contact force of `value`
  newtons is felt at the wrist. Use it to lower something until it touches a surface.
  Parameter name: f (newtons, typically 2-5).

Gripper(action)
  action = open | close | width. `open` releases, `close` grasps whatever is between the fingers,
  `width` sets an explicit opening in metres (parameter name g). Max opening {max_width} m.

Relative moves: PosAlign(eef_tcp, eef_tcp, axis, offset) moves the gripper by `offset` along `axis` from where it is
when the stage starts (lift, retract, sideways push). With the gripper closed this is how an object is pushed.

Priorities: controllers with a smaller `priority` number take precedence (null-space projection);
use the same number for controllers that should be equally important (typically all PosAlign of a
stage share priority 1; orientation AxisAlign gets priority 2 unless orientation is critical).
Stages: `stage` 0,1,2... run one after another; a stage ends when all its controllers converged.
Use a later stage when one action must finish before another starts (e.g. open the gripper THEN retract).
"""


_FORCE_DOC_START = "Force(axis, value)"
_GRIPPER_DOC_START = "Gripper(action)"


def controller_doc(max_width: float = 0.08, force_sensor: bool = True) -> str:
    """CONTROLLER_LIBRARY_DOC for one robot: its gripper opening, and without the Force controller if it has no sensor."""
    doc = CONTROLLER_LIBRARY_DOC
    if not force_sensor:
        a, b = doc.index(_FORCE_DOC_START), doc.index(_GRIPPER_DOC_START)
        doc = doc[:a] + ("Force: NOT AVAILABLE on this robot (no force sensor). Lower onto surfaces with a small PosAlign "
                         "z offset instead.\n\n") + doc[b:]
    return doc.replace("{max_width}", f"{max_width:g}")


def build_controller(spec, values: dict[str, float]) -> Controller:
    """Instantiate a controller from a ControllerSpec-like object and resolved numeric parameters."""
    t = spec.type

    def val(default=None):
        if spec.param is None:
            if default is None:
                raise ValueError(f"{t} needs a parameter")
            return default
        return values[spec.param]

    if t == "PosAlign":
        return PosAlign(spec.source, spec.target, spec.axis or "z", val(0.0), spec.priority, spec.stage)
    if t == "AxisAlign":
        return AxisAlign(spec.source, spec.target, np.deg2rad(val(180.0)), spec.priority, spec.stage)
    if t == "YawAlign":
        return YawAlign(spec.source, spec.target, np.deg2rad(val(90.0)), spec.priority, spec.stage)
    if t == "Force":
        return Force(spec.axis or "-z", val(3.0), spec.priority, spec.stage)
    if t == "Gripper":
        width = values.get(spec.param) if spec.param else None
        return Gripper(spec.action or "open", width, spec.priority, spec.stage)
    raise ValueError(f"unknown controller type {t}")


NON_KEYPOINT_NAMES = {"eef_tcp", "eef_x", "eef_y", "eef_z", "eef_x_axis", "eef_y_axis", "eef_z_axis",
                      "world_x", "world_y", "world_z", "x", "y", "z"}
VECTOR_SUFFIXES = ("_normal", "_norm", "_axis")


def keypoint_of(name: str | None) -> str | None:
    """Object keypoint a symbolic point/vector name refers to (None for built-in eef/world names)."""
    if not name or name in NON_KEYPOINT_NAMES:
        return None
    for suf in VECTOR_SUFFIXES:
        if name.endswith(suf):
            return name[: -len(suf)]
    return name


TO = "__to__"


def keypoints_in(name: str | None) -> list[str]:
    """Object keypoints a point/vector name depends on. `A__to__B` (direction from keypoint A to keypoint B)
    depends on both."""
    if not name or name in NON_KEYPOINT_NAMES:
        return []
    if TO in name:
        a, b = name.split(TO, 1)
        return [k for k in (keypoint_of(a), keypoint_of(b)) if k]
    k = keypoint_of(name)
    return [k] if k else []


def referenced_keypoints(controllers) -> list[str]:
    seen: list[str] = []
    for c in controllers:
        for n in (c.source, c.target):
            for k in keypoints_in(n):
                if k not in seen:
                    seen.append(k)
    return seen
