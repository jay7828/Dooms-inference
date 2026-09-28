"""Camera model and RGB-D observation container."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import numpy as np


@dataclass
class CameraParams:
    name: str
    width: int
    height: int
    fx: float
    fy: float
    cx: float
    cy: float
    T_world_cam: np.ndarray  # 4x4, camera frame = MuJoCo/OpenGL (x right, y up, z backward)

    @property
    def K(self) -> np.ndarray:
        return np.array([[self.fx, 0, self.cx], [0, self.fy, self.cy], [0, 0, 1.0]])

    @staticmethod
    def from_fovy(name, width, height, fovy_deg, T_world_cam) -> "CameraParams":
        f = 0.5 * height / np.tan(np.deg2rad(fovy_deg) / 2)
        return CameraParams(name, width, height, f, f, (width - 1) / 2, (height - 1) / 2,
                            np.asarray(T_world_cam, dtype=float))


@dataclass
class RGBDObservation:
    rgb: np.ndarray    # (H, W, 3) uint8
    depth: np.ndarray | None  # (H, W) float32, metres along the camera z axis (0 = no return); None: RGB-only camera
    camera: CameraParams
    t: float = 0.0     # sim time
    # RGB-only cameras: height (m) of the surface a named keypoint lies on, used to lift pixels without depth
    height_of: Callable[[str], float] | None = None
    # ... and the side length (m) of a square top face there (None: not a boxy object), to recognise that face
    face_size_of: Callable[[str], float | None] | None = None
