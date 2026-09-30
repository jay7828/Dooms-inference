"""Default MuJoCo collision proxy for a scanned mesh: one axis-aligned box around its bounding volume.

Good enough to drop into a scene right away; for a table with open space under the top, replace with a
box for the top slab + a box/cylinder per leg (this only gives you a starting size/pos to work from).
"""
from __future__ import annotations

from pathlib import Path


def bounding_box_geom(mesh_path: str | Path) -> dict:
    import trimesh

    mesh = trimesh.load(str(mesh_path), force="mesh")
    extents = mesh.bounding_box.extents / 2.0
    center = mesh.bounding_box.centroid
    return {"type": "box", "size": [round(float(x), 4) for x in extents],
            "pos": [round(float(x), 4) for x in center]}
