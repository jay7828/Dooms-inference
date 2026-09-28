"""Where is the camera? Solve its pose (and focal length) from points the arm touched and the person clicked.

Each correspondence is (world point = the closed jaw tips touching a tape mark, pixel = where that mark is in the
image). Webcams and phones do not publish their focal length, so it is estimated too: a sweep over plausible fields of
view seeds OpenCV's PnP, then all 7 unknowns (rotation, translation, focal) are refined together.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import cv2
import numpy as np
from scipy.optimize import least_squares

from ..perception.camera import CameraParams

GL_FROM_CV = np.diag([1.0, -1.0, -1.0])       # camera axes: OpenCV (y down, z forward) -> OpenGL/MuJoCo (y up, z back)


class CalibrationError(ValueError):
    pass


@dataclass
class CameraCalibration:
    source: str
    width: int
    height: int
    f: float                     # focal length in pixels (square pixels)
    rvec: list[float]            # OpenCV world -> camera rotation (Rodrigues)
    tvec: list[float]
    rms_px: float
    max_px: float
    n_points: int
    created: float = 0.0

    def _Rt(self):
        R, _ = cv2.Rodrigues(np.asarray(self.rvec, float))
        return R, np.asarray(self.tvec, float)

    def params(self, width: int | None = None, height: int | None = None, name: str = "scene") -> CameraParams:
        """Camera model for images of any size (the calibration scales with the resolution)."""
        w, h = width or self.width, height or self.height
        k = w / self.width
        R, t = self._Rt()
        T = np.eye(4)
        T[:3, :3] = R.T @ GL_FROM_CV
        T[:3, 3] = -R.T @ t
        return CameraParams(name, w, h, self.f * k, self.f * k, (w - 1) / 2, (h - 1) / 2, T)

    def project(self, pts) -> np.ndarray:
        R, t = self._Rt()
        P = np.asarray(pts, float).reshape(-1, 3)
        c = P @ R.T + t
        return np.stack([self.f * c[:, 0] / c[:, 2] + (self.width - 1) / 2,
                         self.f * c[:, 1] / c[:, 2] + (self.height - 1) / 2], axis=1)

    def pixel_to_table(self, u: float, v: float, z: float = 0.0) -> np.ndarray:
        """World point where the pixel's ray meets the horizontal plane at height z."""
        from ..perception.backproject import pixel_ray
        o, d = pixel_ray(self.params(), u, v)
        if abs(d[2]) < 1e-6 or (z - o[2]) / d[2] <= 0:
            raise CalibrationError("that pixel does not look at the table")
        return o + d * (z - o[2]) / d[2]

    @property
    def fov_deg(self) -> float:
        return float(np.degrees(2 * np.arctan(0.5 * self.width / self.f)))

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        d = asdict(self)
        d["created"] = time.time()
        path.write_text(json.dumps(d, indent=2))

    @staticmethod
    def load(path: Path) -> "CameraCalibration":
        return CameraCalibration(**json.loads(path.read_text()))


def solve(world, pixels, size: tuple[int, int], source: str = "") -> CameraCalibration:
    W = np.asarray(world, float).reshape(-1, 3)
    P = np.asarray(pixels, float).reshape(-1, 2)
    w, h = size
    if len(W) < 4:
        raise CalibrationError("at least 4 points are needed (6 recommended)")
    spread = np.linalg.svd(W[:, :2] - W[:, :2].mean(0), compute_uv=False)
    if spread[-1] < 0.02:
        raise CalibrationError("the points lie almost on a line: use marks spread over the table, left, right, near and far")
    cx, cy = (w - 1) / 2, (h - 1) / 2

    def pnp(f):
        K = np.array([[f, 0, cx], [0, f, cy], [0, 0, 1.0]])
        ok, rvec, tvec = cv2.solvePnP(W, P, K, None, flags=cv2.SOLVEPNP_SQPNP)
        if not ok:
            return None
        proj, _ = cv2.projectPoints(W, rvec, tvec, K, None)
        return float(np.sqrt(np.mean(np.sum((proj.reshape(-1, 2) - P) ** 2, axis=1)))), rvec.ravel(), tvec.ravel()

    best = None
    for fov in np.arange(30.0, 121.0, 1.5):                 # horizontal field of view sweep
        f = 0.5 * w / np.tan(np.radians(fov) / 2)
        r = pnp(f)
        if r and (best is None or r[0] < best[0]):
            best = (r[0], f, r[1], r[2])
    if best is None:
        raise CalibrationError("could not solve the camera pose; re-click the marks")
    _, f0, r0, t0 = best

    def residual(x):
        rvec, tvec, logf = x[:3], x[3:6], x[6]
        f = np.exp(logf)
        K = np.array([[f, 0, cx], [0, f, cy], [0, 0, 1.0]])
        proj, _ = cv2.projectPoints(W, rvec, tvec, K, None)
        return (proj.reshape(-1, 2) - P).ravel()

    x0 = np.concatenate([r0, t0, [np.log(f0)]])
    x = least_squares(residual, x0, method="lm" if len(W) >= 4 else "trf").x if len(W) * 2 >= 7 else x0
    err = residual(x).reshape(-1, 2)
    per_point = np.linalg.norm(err, axis=1)
    cal = CameraCalibration(source=source, width=w, height=h, f=float(np.exp(x[6])), rvec=x[:3].tolist(),
                            tvec=x[3:6].tolist(), rms_px=float(np.sqrt(np.mean(per_point ** 2))),
                            max_px=float(per_point.max()), n_points=len(W))
    R, _ = cv2.Rodrigues(x[:3])
    if (W @ R.T + x[3:6])[:, 2].min() <= 0:
        raise CalibrationError("solution puts the marks behind the camera; re-click the marks")
    return cal


def quality(cal: CameraCalibration) -> tuple[str, str]:
    """('good' | 'ok' | 'bad', explanation) from the reprojection error, scaled to a 640 px wide image."""
    e = cal.max_px * 640 / cal.width
    if cal.n_points < 5:
        return "ok", "Solved from only 4 points; add 1-2 more for a reliable result."
    if e < 4:
        return "good", f"Every mark reprojects within {cal.max_px:.1f} px."
    if e < 9:
        return "ok", f"Worst mark is {cal.max_px:.1f} px off; usable, re-click it for better accuracy."
    return "bad", f"A mark is {cal.max_px:.1f} px off: a click or a touch was wrong, or the camera moved. Redo that point."
