"""Pixel + depth -> 3D world points, and local surface normals."""
from __future__ import annotations

import numpy as np

from .camera import CameraParams, RGBDObservation


def pixel_to_world(cam: CameraParams, u: float, v: float, depth: float) -> np.ndarray:
    # MuJoCo camera: x right, y up, looking down -z
    p_cam = np.array([(u - cam.cx) / cam.fx * depth, -(v - cam.cy) / cam.fy * depth, -depth, 1.0])
    return (cam.T_world_cam @ p_cam)[:3]


def depth_at(obs: RGBDObservation, u: float, v: float, win: int = 2, q: float = 50.0) -> float:
    """Percentile (default median) of valid depth in a small window. q<50 favours the foreground surface."""
    h, w = obs.depth.shape
    ui, vi = int(round(u)), int(round(v))
    patch = obs.depth[max(0, vi - win): min(h, vi + win + 1), max(0, ui - win): min(w, ui + win + 1)]
    patch = patch[patch > 0]
    if patch.size == 0:
        raise ValueError(f"no valid depth near pixel ({u:.0f},{v:.0f})")
    return float(np.percentile(patch, q))


def points_world(obs: RGBDObservation, us: np.ndarray, vs: np.ndarray) -> np.ndarray:
    cam = obs.camera
    d = obs.depth[vs, us]
    p_cam = np.stack([(us - cam.cx) / cam.fx * d, -(vs - cam.cy) / cam.fy * d, -d, np.ones_like(d)], axis=0)
    return (cam.T_world_cam @ p_cam)[:3].T


def pixel_ray(cam: CameraParams, u: float, v: float) -> tuple[np.ndarray, np.ndarray]:
    """World-frame ray (origin, unit direction) through a pixel."""
    d_cam = np.array([(u - cam.cx) / cam.fx, -(v - cam.cy) / cam.fy, -1.0])
    d = cam.T_world_cam[:3, :3] @ d_cam
    return cam.T_world_cam[:3, 3].copy(), d / np.linalg.norm(d)


def fit_surface(obs: RGBDObservation, u: float, v: float, radius: int = 4, d0: float | None = None):
    """Robust plane fit around a pixel. Returns (normal toward camera, centroid, rms) or None."""
    h, w = obs.depth.shape
    ui, vi = int(round(u)), int(round(v))
    vs, us = np.mgrid[max(0, vi - radius): min(h, vi + radius + 1), max(0, ui - radius): min(w, ui + radius + 1)]
    us, vs = us.ravel(), vs.ravel()
    d = obs.depth[vs, us]
    ok = d > 0
    if ok.sum() < 8:
        return None
    if d0 is None:
        d0 = float(np.percentile(d[ok], 20))
    ok &= np.abs(d - d0) < 0.03           # drop background bleeding over object edges
    if ok.sum() < 8:
        return None
    pts = points_world(obs, us[ok], vs[ok])
    keep = np.ones(len(pts), bool)
    n = c = None
    for _ in range(4):
        if keep.sum() < 8:
            break
        c = pts[keep].mean(axis=0)
        _, _, vt = np.linalg.svd(pts[keep] - c)
        n = vt[-1]
        res = np.abs((pts - c) @ n)
        keep = res < max(0.003, 2.0 * np.median(res[keep]))
    if n is None:
        return None
    rms = float(np.sqrt(np.mean(((pts[keep] - c) @ n) ** 2)))
    if np.dot(n, obs.camera.T_world_cam[:3, 3] - c) < 0:
        n = -n
    return n / np.linalg.norm(n), c, rms


def surface_normal(obs: RGBDObservation, u: float, v: float, radius: int = 4) -> np.ndarray:
    fit = fit_surface(obs, u, v, radius)
    if fit is None:
        raise ValueError("not enough depth to fit a normal")
    return fit[0]
