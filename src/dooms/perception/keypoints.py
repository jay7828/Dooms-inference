"""2D pixel -> grounded 3D keypoint (position, surface normal, in-plane edge axis)."""
from __future__ import annotations

import cv2
import numpy as np

from ..controllers.base import Keypoint
from .backproject import depth_at, fit_surface, pixel_ray, pixel_to_world, points_world
from .camera import RGBDObservation


def _top_face_axis(obs: RGBDObservation, u: float, v: float, n: np.ndarray, c: np.ndarray, radius: int = 16):
    """Edge direction of the (roughly horizontal) face containing pixel (u,v): min-area rectangle of plane inliers."""
    if abs(n[2]) < 0.8:
        return None, 180.0
    h, w = obs.depth.shape
    ui, vi = int(round(u)), int(round(v))
    vs, us = np.mgrid[max(0, vi - radius): min(h, vi + radius + 1), max(0, ui - radius): min(w, ui + radius + 1)]
    us, vs = us.ravel(), vs.ravel()
    ok = obs.depth[vs, us] > 0
    us, vs = us[ok], vs[ok]
    pts = points_world(obs, us, vs)
    inl = np.abs((pts - c) @ n) < 0.003
    if inl.sum() < 30:
        return None, 180.0
    px = np.stack([us[inl], vs[inl]], axis=1).astype(np.float32)
    x0, x1, y0, y1 = px[:, 0].min(), px[:, 0].max(), px[:, 1].min(), px[:, 1].max()
    if x0 <= us.min() + 1 or x1 >= us.max() - 1 or y0 <= vs.min() + 1 or y1 >= vs.max() - 1:
        return None, 180.0          # face runs off the window: an open surface has no edge direction
    rect = cv2.minAreaRect(px)
    (rw, rh) = rect[1]
    if rw * rh < 1e-6 or len(px) / (rw * rh) < 0.85:
        return None, 180.0          # irregular face: no meaningful edge direction
    _, radius = cv2.minEnclosingCircle(px)
    if radius > 0 and len(px) / (np.pi * radius ** 2) > 0.80:
        return None, 180.0          # circular face (a disc fills its enclosing circle, a square only ~64%)
    corners = cv2.boxPoints(rect)
    world = []
    for cu, cv_ in corners:
        o, r = pixel_ray(obs.camera, float(cu), float(cv_))
        world.append(o + r * (float(n @ (c - o)) / float(n @ r)))
    e1, e2 = world[1] - world[0], world[2] - world[1]
    l1, l2 = np.linalg.norm(e1), np.linalg.norm(e2)
    if min(l1, l2) < 1e-4:
        return None, 180.0
    long_e = e1 if l1 >= l2 else e2
    axis = long_e.copy()
    axis[2] = 0.0
    if np.linalg.norm(axis) < 1e-6:
        return None, 180.0
    return axis / np.linalg.norm(axis), (90.0 if max(l1, l2) / min(l1, l2) < 1.2 else 180.0)


def lift_pixel(obs: RGBDObservation, name: str, u: float, v: float) -> Keypoint:
    h, w = obs.depth.shape
    u, v = float(np.clip(u, 0, w - 1)), float(np.clip(v, 0, h - 1))
    d = depth_at(obs, u, v, win=3, q=20.0)          # foreground-biased depth
    pos = pixel_to_world(obs.camera, u, v, d)
    fit = fit_surface(obs, u, v, radius=4, d0=d)
    normal, axis, sym = None, None, 180.0
    if fit is not None:
        n, c, rms = fit
        normal = n
        origin, ray = pixel_ray(obs.camera, u, v)
        cosang = float(n @ -ray)
        if rms < 0.002 and cosang > 0.25:            # snap the point onto the fitted (planar) face
            pos = origin + ray * (float(n @ (c - origin)) / float(n @ ray))
            axis, sym = _top_face_axis(obs, u, v, n, c)
    if normal is None:
        normal = np.array([0.0, 0.0, 1.0])
    return Keypoint(name, pos, normal, axis, sym)
