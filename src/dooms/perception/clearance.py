"""Reach clearance: would the open gripper fit around a grasp target? Measured from the depth image.

The scene depth is turned into a top-down height map; connected blobs above the table are "objects". The blob under
the grasp point is the target itself; any OTHER blob inside the two finger footprints (one on each side of the
target, along the finger-opening direction) would collide with a finger when the gripper descends.
"""
from __future__ import annotations

import numpy as np
from scipy import ndimage

from .backproject import points_world
from .camera import RGBDObservation

FINGER_CENTER = 0.052      # distance of each finger's body from the grasp point along the opening direction (m)
FINGER_LEN = 0.030         # finger footprint size along the opening direction
FINGER_WID = 0.034         # ... and across it
MIN_HEIGHT = 0.008         # anything taller than this above the table is in the way of the fingertips


def _height_map(obs: RGBDObservation, cx: float, cy: float, half: float, res: float, max_z: float = 0.15):
    h, w = obs.depth.shape
    vs, us = np.mgrid[0:h, 0:w]
    us, vs = us.ravel(), vs.ravel()
    ok = obs.depth[vs, us] > 0
    pts = points_world(obs, us[ok], vs[ok])
    keep = (np.abs(pts[:, 0] - cx) < half) & (np.abs(pts[:, 1] - cy) < half) & (pts[:, 2] > -0.05) & (pts[:, 2] < max_z)   # ignore the arm above the workspace
    pts = pts[keep]
    if len(pts) < 200:
        return None
    hist, edges = np.histogram(pts[:, 2], bins=np.arange(-0.05, 0.12, 0.002))
    z_table = float(edges[np.argmax(hist)] + 0.001)          # the table is the most common height
    n = int(2 * half / res)
    ix = np.clip(((pts[:, 0] - (cx - half)) / res).astype(int), 0, n - 1)
    iy = np.clip(((pts[:, 1] - (cy - half)) / res).astype(int), 0, n - 1)
    hm = np.full((n, n), -np.inf)
    np.maximum.at(hm, (iy, ix), pts[:, 2])
    return hm, z_table


def analyze_reach(obs: RGBDObservation, target_xy, finger_dir, half: float = 0.30, res: float = 0.005,
                  finger: dict | None = None) -> dict:
    """finger_dir: horizontal unit vector (x, y) along which the fingers open."""
    tx, ty = float(target_xy[0]), float(target_xy[1])
    f = finger or {}
    FINGER_CENTER, FINGER_LEN, FINGER_WID = f.get("center", 0.052), f.get("length", 0.030), f.get("width", 0.034)
    built = _height_map(obs, tx, ty, half, res, f.get("max_z", 0.15))
    if built is None:
        return {"analyzable": False}
    hm, z_table = built
    occ = np.isfinite(hm) & (hm > z_table + MIN_HEIGHT)
    labels, _ = ndimage.label(occ, structure=np.ones((3, 3)))
    n = hm.shape[0]

    def cell(x, y):
        return int(round((y - (ty - half)) / res)), int(round((x - (tx - half)) / res))

    # the blob under (or right next to) the target point is the target object itself
    cy0, cx0 = cell(tx, ty)
    win = labels[max(0, cy0 - 2): cy0 + 3, max(0, cx0 - 2): cx0 + 3]
    if not win.any():                       # nothing seen at the target itself (hidden behind something / not there)
        return {"analyzable": False, "reason": "the grasp point is not visible in the depth image"}
    target_label = int(np.bincount(win[win > 0]).argmax())
    u = np.asarray(finger_dir, float)
    u = u / np.linalg.norm(u)
    perp = np.array([-u[1], u[0]])

    sides = []
    for s in (+1.0, -1.0):
        hit = {}
        for a in np.linspace(-FINGER_LEN / 2, FINGER_LEN / 2, 8):
            for b in np.linspace(-FINGER_WID / 2, FINGER_WID / 2, 9):
                p = np.array([tx, ty]) + s * u * (FINGER_CENTER + a) + perp * b
                iy, ix = cell(*p)
                if 0 <= iy < n and 0 <= ix < n:
                    lab = int(labels[iy, ix])
                    if lab > 0 and lab != target_label:
                        hit[lab] = hit.get(lab, 0) + 1
        if hit:
            lab = max(hit, key=hit.get)
            ys, xs = np.nonzero(labels == lab)
            wx, wy = (tx - half) + xs * res, (ty - half) + ys * res
            dist = float(np.min(np.hypot(wx - tx, wy - ty)))
            sides.append({"side": s, "distance": dist, "centroid": (float(wx.mean()), float(wy.mean())),
                          "size": (float(np.ptp(wx)), float(np.ptp(wy))),
                          "height": float(hm[ys, xs].max() - z_table)})
    return {"analyzable": True, "blocked": bool(sides), "sides": sides, "finger_dir": (float(u[0]), float(u[1])),
            "target": (tx, ty)}


def describe(res: dict, name: str, nearby: dict[str, np.ndarray]) -> str:
    """Plain-language description for the Task Decomposer (world coordinates, +x away from the robot, +y left)."""
    ux, uy = res["finger_dir"]
    tx, ty = res["target"]
    parts = [f"Clearance check for grasping '{name}' at world (x={tx:.2f}, y={ty:.2f}): the gripper's fingers open along "
             f"the direction ({ux:+.2f}, {uy:+.2f}) and need about 6 cm of free table space on BOTH sides of the grasp point."]
    for sd in res["sides"]:
        cx, cy = sd["centroid"]
        near = min(nearby.items(), key=lambda kv: np.hypot(kv[1][0] - cx, kv[1][1] - cy), default=None)
        label = f" (the object around keypoint '{near[0]}')" if near and np.hypot(near[1][0] - cx, near[1][1] - cy) < 0.15 else ""
        direction = np.array([ux, uy]) * sd["side"]
        parts.append(f"BLOCKED on the side toward ({direction[0]:+.2f}, {direction[1]:+.2f}): an object{label} centred at "
                     f"(x={cx:.2f}, y={cy:.2f}), about {sd['size'][0] * 100:.0f} x {sd['size'][1] * 100:.0f} cm and "
                     f"{sd['height'] * 100:.0f} cm tall, comes within {sd['distance'] * 100:.0f} cm of the grasp point, so a finger "
                     "would hit it when the gripper descends.")
    return " ".join(parts)
