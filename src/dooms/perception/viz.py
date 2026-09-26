"""Debug overlays: pixel grids for the VLM and grounded-point drawings."""
from __future__ import annotations

import cv2
import numpy as np


def draw_grid(rgb: np.ndarray, step: int = 80, origin: tuple[int, int] = (0, 0)) -> np.ndarray:
    """Overlay labelled grid lines. Labels are in the *original* image frame (origin = crop offset)."""
    img = np.ascontiguousarray(rgb.copy())
    h, w = img.shape[:2]
    ox, oy = origin
    first_x = (-ox) % step
    first_y = (-oy) % step
    for x in range(first_x, w, step):
        cv2.line(img, (x, 0), (x, h - 1), (255, 255, 0), 1, cv2.LINE_AA)
        cv2.putText(img, str(x + ox), (x + 2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1, cv2.LINE_AA)
    for y in range(first_y, h, step):
        cv2.line(img, (0, y), (w - 1, y), (0, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(img, str(y + oy), (2, y - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1, cv2.LINE_AA)
    return img


def _proj(cam, p):
    pc = np.linalg.inv(cam.T_world_cam) @ np.append(np.asarray(p, float), 1.0)
    d = -pc[2]
    return int(round(pc[0] / d * cam.fx + cam.cx)), int(round(-pc[1] / d * cam.fy + cam.cy))


def draw_world_axes(rgb: np.ndarray, cam, origin=(0.30, -0.33, 0.0), length: float = 0.20) -> np.ndarray:
    """Overlay the robot's world axes on the image so an agent can turn 'that way' into +x / +y directions.
    x points away from the robot base, y to the robot's left, z up. The robot base is marked too."""
    img = np.ascontiguousarray(rgb.copy())
    o = np.asarray(origin, float)
    p0 = _proj(cam, o)
    for vec, col, name in (((1, 0, 0), (255, 80, 80), "+x"), ((0, 1, 0), (80, 255, 120), "+y")):
        p1 = _proj(cam, o + length * np.asarray(vec, float))
        cv2.arrowedLine(img, p0, p1, col, 3, cv2.LINE_AA, tipLength=0.25)
        cv2.putText(img, name, (p1[0] + 6, p1[1] + 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, col, 2, cv2.LINE_AA)
    b = _proj(cam, (0.0, 0.0, 0.0))
    cv2.circle(img, b, 6, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(img, "robot base", (b[0] + 8, b[1] - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(img, "+x away from robot | +y robot's left | +z up", (8, img.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX,
                0.45, (255, 255, 255), 1, cv2.LINE_AA)
    return img


def draw_points(rgb: np.ndarray, points: dict[str, tuple[float, float]]) -> np.ndarray:
    img = np.ascontiguousarray(rgb.copy())
    for name, (u, v) in points.items():
        c = (int(round(u)), int(round(v)))
        cv2.circle(img, c, 5, (255, 60, 60), 2, cv2.LINE_AA)
        cv2.putText(img, name, (c[0] + 7, c[1] - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 60, 60), 1, cv2.LINE_AA)
    return img


def encode_jpeg(rgb: np.ndarray, quality: int = 80) -> bytes:
    ok, buf = cv2.imencode(".jpg", cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("jpeg encode failed")
    return buf.tobytes()


def encode_png(rgb: np.ndarray) -> bytes:
    ok, buf = cv2.imencode(".png", cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    if not ok:
        raise RuntimeError("png encode failed")
    return buf.tobytes()
