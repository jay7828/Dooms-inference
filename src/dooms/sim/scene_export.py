"""Export the renderable part of a MuJoCo model (+ current body poses) as JSON for the browser 3D viewer.

Geometry stays in each geom's local frame; the browser only needs per-body world poses each tick.
"""
from __future__ import annotations

import base64

import mujoco
import numpy as np

G = mujoco.mjtGeom
TYPE_NAMES = {G.mjGEOM_PLANE: "plane", G.mjGEOM_BOX: "box", G.mjGEOM_CYLINDER: "cylinder",
              G.mjGEOM_SPHERE: "sphere", G.mjGEOM_MESH: "mesh"}
VISIBLE_MAX_GROUP = 2          # groups 0-2 are visible in MuJoCo by default (Panda visuals are group 2)


def _b64(a: np.ndarray) -> str:
    return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()


def _mesh(model, mid: int) -> dict:
    v0, vn = model.mesh_vertadr[mid], model.mesh_vertnum[mid]
    f0, fn = model.mesh_faceadr[mid], model.mesh_facenum[mid]
    verts = model.mesh_vert[v0:v0 + vn].astype(np.float32)
    faces = model.mesh_face[f0:f0 + fn]
    # merge duplicate positions (MuJoCo splits vertices per normal/uv) so the browser can smooth-shade
    uniq, inv = np.unique(np.round(verts, 6), axis=0, return_inverse=True)
    faces = inv.reshape(-1)[faces.reshape(-1)].reshape(-1, 3)
    idx = faces.astype(np.uint16 if len(uniq) < 65535 else np.uint32)
    return {"v": _b64(uniq.astype(np.float32)), "f": _b64(idx), "f32": bool(idx.dtype == np.uint32)}


def export_scene(model: mujoco.MjModel, data: mujoco.MjData) -> dict:
    geoms, meshes = [], {}
    for g in range(model.ngeom):
        if model.geom_group[g] > VISIBLE_MAX_GROUP:
            continue
        t = TYPE_NAMES.get(int(model.geom_type[g]))
        if t is None:
            continue
        mat = int(model.geom_matid[g])
        rgba = model.mat_rgba[mat] if mat >= 0 else model.geom_rgba[g]
        if mat >= 0 and model.geom_rgba[g][3] < 1:
            rgba = model.geom_rgba[g]
        item = {"body": int(model.geom_bodyid[g]), "type": t, "size": model.geom_size[g].round(5).tolist(),
                "pos": model.geom_pos[g].round(5).tolist(), "quat": model.geom_quat[g].round(6).tolist(),
                "rgba": [round(float(x), 3) for x in rgba]}
        if t == "mesh":
            mid = int(model.geom_dataid[g])
            item["mesh"] = mid
            if mid not in meshes:
                meshes[mid] = _mesh(model, mid)
        geoms.append(item)
    return {"nbody": int(model.nbody), "geoms": geoms, "meshes": {str(k): v for k, v in meshes.items()},
            "poses": poses(data).tolist()}


def poses(data: mujoco.MjData) -> np.ndarray:
    """(nbody, 7) float32: x y z qw qx qy qz in world frame."""
    return np.hstack([data.xpos, data.xquat]).astype(np.float32)
