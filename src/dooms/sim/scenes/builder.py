"""Build the MuJoCo model (Franka Panda from Menagerie + task objects + cameras) via MjSpec."""
from __future__ import annotations

from pathlib import Path

import mujoco
import numpy as np

from ...task import TaskSpec
from ..camera_rig import lookat_quat

PANDA_XML = Path(__file__).parent / "assets" / "franka_emika_panda" / "panda.xml"
G = mujoco.mjtGeom

# object geometry constants (kept here so scene + docs agree)
BOTTLE_R, BOTTLE_HALF_H = 0.022, 0.07
CAP_R, CAP_HALF_H = 0.012, 0.016
CAP_TOP_Z = BOTTLE_HALF_H + 2 * CAP_HALF_H          # cap top, relative to the bottle body centre
TRAY_FLOOR_TOP = 0.012
TRAY_HALF = 0.09
TRAY_WALL_T, TRAY_WALL_HALF_H = 0.008, 0.025
TCP_OFFSET = 0.1025                                  # hand z -> pad centre


def _rgba(c, a=1.0):
    return [float(c[0]), float(c[1]), float(c[2]), a]


def build_spec(task: TaskSpec, cfg: dict) -> mujoco.MjSpec:
    spec = mujoco.MjSpec.from_file(str(PANDA_XML))
    spec.option.timestep = cfg["sim"]["timestep"]
    spec.visual.headlight.ambient = [0.45, 0.45, 0.45]
    spec.visual.headlight.diffuse = [0.5, 0.5, 0.5]
    wb = spec.worldbody

    # stiffer gripper: ~5x the Menagerie default squeeze (still opens to the same 0.08 m)
    grip = spec.actuator("actuator8")
    gain, bias = np.array(grip.gainprm), np.array(grip.biasprm)
    gain[0] *= 5
    bias[1] *= 5
    bias[2] *= 3
    grip.gainprm, grip.biasprm = gain, bias

    wb.add_light(pos=[0.5, 0.0, 2.0], dir=[0, 0, -1], diffuse=[0.4, 0.4, 0.4], castshadow=False)
    wb.add_geom(name="floor", type=G.mjGEOM_PLANE, size=[3, 3, 0.05], pos=[0, 0, -0.04], rgba=[0.12, 0.13, 0.15, 1])
    wb.add_geom(name="table", type=G.mjGEOM_BOX, size=[0.6, 0.65, 0.02], pos=[0.45, 0, -0.02],
                rgba=[0.62, 0.62, 0.6, 1], friction=[0.5, 0.005, 0.0001])

    for o in task.objects:
        if o.type == "bottle":
            _add_bottle(wb, o)
        elif o.type == "tray":
            _add_tray(wb, o)
        elif o.type == "cube":
            _add_cube(wb, o)

    hand = spec.body("hand")
    hand.add_site(name="tcp", pos=[0, 0, TCP_OFFSET], size=[0.004, 0, 0], group=4)
    hand.add_site(name="ft", pos=[0, 0, 0], size=[0.004, 0, 0], group=4)
    spec.add_sensor(name="wrist_force", type=mujoco.mjtSensor.mjSENS_FORCE,
                    objtype=mujoco.mjtObj.mjOBJ_SITE, objname="ft")
    spec.add_sensor(name="wrist_torque", type=mujoco.mjtSensor.mjSENS_TORQUE,
                    objtype=mujoco.mjtObj.mjOBJ_SITE, objname="ft")

    sc = cfg["sim"]["cameras"]["scene"]
    wb.add_camera(name="scene_cam", pos=sc["pos"], quat=lookat_quat(sc["pos"], sc["lookat"]), fovy=sc["fovy"])
    wc = cfg["sim"]["cameras"]["wrist"]
    hand.add_camera(name="wrist_cam", pos=[0.0, 0.0, 0.06], quat=[0, 1, 0, 0], fovy=wc["fovy"])
    return spec


def _add_bottle(wb, o):
    b = wb.add_body(name=o.name, pos=[0.5, 0.15, BOTTLE_HALF_H + 0.002])
    b.add_freejoint(name=f"{o.name}_free")
    fr = [1.5, 0.01, 0.001]
    b.add_geom(name=f"{o.name}_body", type=G.mjGEOM_CYLINDER, size=[BOTTLE_R, BOTTLE_HALF_H, 0],
               rgba=_rgba(o.color), mass=0.04, friction=[0.4, 0.01, 0.001], condim=4)   # plastic on a table slides

    b.add_geom(name=f"{o.name}_cap_geom", type=G.mjGEOM_CYLINDER, size=[CAP_R, CAP_HALF_H, 0],
               pos=[0, 0, BOTTLE_HALF_H + CAP_HALF_H], rgba=[0.1, 0.25, 0.85, 1], mass=0.005, friction=fr, condim=4)
    b.add_site(name="bottle_cap", pos=[0, 0, CAP_TOP_Z], size=[0.003, 0, 0], group=4)


def _add_tray(wb, o):
    b = wb.add_body(name=o.name, pos=[0.5, -0.2, 0.001])
    b.add_freejoint(name=f"{o.name}_free")                 # the box can be pushed around (about 0.65 kg)
    col = _rgba(o.color)
    h = TRAY_HALF
    b.add_geom(name=f"{o.name}_floor", type=G.mjGEOM_BOX, size=[h, h, TRAY_FLOOR_TOP / 2], mass=0.25,
               pos=[0, 0, TRAY_FLOOR_TOP / 2], rgba=col, friction=[0.5, 0.005, 0.0001])
    wz = TRAY_FLOOR_TOP + TRAY_WALL_HALF_H
    for i, (sx, sy, px, py) in enumerate([
        (h, TRAY_WALL_T, 0, h - TRAY_WALL_T), (h, TRAY_WALL_T, 0, -(h - TRAY_WALL_T)),
        (TRAY_WALL_T, h, h - TRAY_WALL_T, 0), (TRAY_WALL_T, h, -(h - TRAY_WALL_T), 0)]):
        b.add_geom(name=f"{o.name}_wall{i}", type=G.mjGEOM_BOX, size=[sx, sy, TRAY_WALL_HALF_H], mass=0.1,
                   pos=[px, py, wz], rgba=col, friction=[0.5, 0.005, 0.0001])
    b.add_site(name="box_inside", pos=[0, 0, TRAY_FLOOR_TOP], size=[0.003, 0, 0], group=4)


def _add_cube(wb, o):
    hs = o.size / 2
    b = wb.add_body(name=o.name, pos=[0.5, 0.15, hs + 0.002])
    b.add_freejoint(name=f"{o.name}_free")
    b.add_geom(name=f"{o.name}_geom", type=G.mjGEOM_BOX, size=[hs, hs, hs], rgba=_rgba(o.color),
               mass=0.05, friction=[1.5, 0.01, 0.001], condim=4)
    b.add_site(name=f"{o.name}_top", pos=[0, 0, hs], size=[0.003, 0, 0], group=4)
