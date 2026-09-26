"""Build the MuJoCo model (Franka Panda from Menagerie + task objects + cameras) via MjSpec."""
from __future__ import annotations

from pathlib import Path

import mujoco
import numpy as np

from ...robots import DEFAULT_ROBOT, Dims, RobotProfile, get_profile
from ...task import TaskSpec
from ..camera_rig import lookat_quat

ASSETS = Path(__file__).parent / "assets"
PANDA_XML = ASSETS / "franka_emika_panda" / "panda.xml"
SO101_XML = ASSETS / "robotstudio_so101" / "so101.xml"
G = mujoco.mjtGeom

# Franka object geometry (the default profile's Dims); other arms carry their own
_D = get_profile(DEFAULT_ROBOT).dims
BOTTLE_R, BOTTLE_HALF_H, CAP_R, CAP_HALF_H = _D.bottle_r, _D.bottle_half_h, _D.cap_r, _D.cap_half_h
CAP_TOP_Z, TRAY_FLOOR_TOP, TRAY_HALF = _D.cap_top_z, _D.tray_floor, _D.tray_half
TRAY_WALL_T, TRAY_WALL_HALF_H = _D.tray_wall_t, _D.tray_wall_half_h
TCP_OFFSET = 0.1025                                  # Franka hand z -> pad centre

# SO-ARM101 TCP in the `gripper` body frame: between the jaws, ~1 cm above the fingertips. The approach
# direction is -z of that frame and the jaw opens along +x (moving jaw), so the controllers' TCP frame is
# z = approach, y = opening direction, x = y cross z.
SO101_TCP_POS = (0.0, 0.0, -0.088)
SO101_TCP_AXES = np.array([[0.0, 1.0, 0.0], [1.0, 0.0, 0.0], [0.0, 0.0, -1.0]]).T     # columns: tcp x, y, z in gripper frame


def _rgba(c, a=1.0):
    return [float(c[0]), float(c[1]), float(c[2]), a]


def build_spec(task: TaskSpec, cfg: dict, profile: RobotProfile | None = None) -> mujoco.MjSpec:
    profile = profile or get_profile(DEFAULT_ROBOT)
    if profile.id == "so101":
        spec = mujoco.MjSpec.from_file(str(SO101_XML))
        spec.option.timestep = cfg["sim"]["timestep"]
        spec.option.integrator = mujoco.mjtIntegrator.mjINT_IMPLICITFAST
    else:
        spec = mujoco.MjSpec.from_file(str(PANDA_XML))
        spec.option.timestep = cfg["sim"]["timestep"]
    spec.visual.headlight.ambient = [0.45, 0.45, 0.45]
    spec.visual.headlight.diffuse = [0.5, 0.5, 0.5]
    wb = spec.worldbody
    tc, th = profile.table_center, profile.table_half

    wb.add_light(pos=[tc[0], 0.0, 2.0], dir=[0, 0, -1], diffuse=[0.4, 0.4, 0.4], castshadow=False)
    wb.add_geom(name="floor", type=G.mjGEOM_PLANE, size=[3, 3, 0.05], pos=[0, 0, -0.04], rgba=[0.12, 0.13, 0.15, 1])
    wb.add_geom(name="table", type=G.mjGEOM_BOX, size=[th[0], th[1], 0.02], pos=[tc[0], tc[1], -0.02],
                rgba=[0.62, 0.62, 0.6, 1], friction=[0.5, 0.005, 0.0001])

    for o in task.objects:
        if o.type == "bottle":
            _add_bottle(wb, o, profile.dims)
        elif o.type == "tray":
            _add_tray(wb, o, profile.dims)
        elif o.type == "cube":
            _add_cube(wb, o)

    if profile.id == "so101":
        hand = spec.body("gripper")
        quat = np.zeros(4)
        mujoco.mju_mat2Quat(quat, SO101_TCP_AXES.reshape(9))
        hand.add_site(name="tcp", pos=list(SO101_TCP_POS), quat=quat.tolist(), size=[0.004, 0, 0], group=4)
    else:
        # stiffer gripper: ~5x the Menagerie default squeeze (still opens to the same 0.08 m)
        grip = spec.actuator("actuator8")
        gain, bias = np.array(grip.gainprm), np.array(grip.biasprm)
        gain[0] *= 5
        bias[1] *= 5
        bias[2] *= 3
        grip.gainprm, grip.biasprm = gain, bias
        hand = spec.body("hand")
        hand.add_site(name="tcp", pos=[0, 0, TCP_OFFSET], size=[0.004, 0, 0], group=4)
        hand.add_site(name="ft", pos=[0, 0, 0], size=[0.004, 0, 0], group=4)
        spec.add_sensor(name="wrist_force", type=mujoco.mjtSensor.mjSENS_FORCE,
                        objtype=mujoco.mjtObj.mjOBJ_SITE, objname="ft")
        spec.add_sensor(name="wrist_torque", type=mujoco.mjtSensor.mjSENS_TORQUE,
                        objtype=mujoco.mjtObj.mjOBJ_SITE, objname="ft")

    sc = {**cfg["sim"]["cameras"]["scene"], **profile.scene_cam}
    wb.add_camera(name="scene_cam", pos=sc["pos"], quat=lookat_quat(sc["pos"], sc["lookat"]), fovy=sc["fovy"])
    if profile.id != "so101":                   # the SO-ARM101 model already carries its own wrist camera
        wc = cfg["sim"]["cameras"]["wrist"]
        hand.add_camera(name="wrist_cam", pos=[0.0, 0.0, 0.06], quat=[0, 1, 0, 0], fovy=wc["fovy"])
    return spec


def _add_bottle(wb, o, D: Dims = _D):
    BOTTLE_R, BOTTLE_HALF_H, CAP_R, CAP_HALF_H, CAP_TOP_Z = D.bottle_r, D.bottle_half_h, D.cap_r, D.cap_half_h, D.cap_top_z
    b = wb.add_body(name=o.name, pos=[0.5, 0.15, BOTTLE_HALF_H + 0.002])
    b.add_freejoint(name=f"{o.name}_free")
    fr = [1.5, 0.01, 0.001]
    b.add_geom(name=f"{o.name}_body", type=G.mjGEOM_CYLINDER, size=[BOTTLE_R, BOTTLE_HALF_H, 0],
               rgba=_rgba(o.color), mass=0.04, friction=[0.4, 0.01, 0.001], condim=4)   # plastic on a table slides

    b.add_geom(name=f"{o.name}_cap_geom", type=G.mjGEOM_CYLINDER, size=[CAP_R, CAP_HALF_H, 0],
               pos=[0, 0, BOTTLE_HALF_H + CAP_HALF_H], rgba=[0.1, 0.25, 0.85, 1], mass=0.005, friction=fr, condim=4)
    b.add_site(name="bottle_cap", pos=[0, 0, CAP_TOP_Z], size=[0.003, 0, 0], group=4)


def _add_tray(wb, o, D: Dims = _D):
    TRAY_FLOOR_TOP, TRAY_HALF, TRAY_WALL_T, TRAY_WALL_HALF_H = D.tray_floor, D.tray_half, D.tray_wall_t, D.tray_wall_half_h
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
