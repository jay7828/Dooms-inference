"""Camera placement helpers."""
from __future__ import annotations

import mujoco
import numpy as np


def lookat_rotation(pos, target, up=(0, 0, 1)) -> np.ndarray:
    """Camera-to-world rotation for a MuJoCo camera (x right, y up, looks down -z)."""
    pos, target, up = (np.asarray(v, dtype=float) for v in (pos, target, up))
    z = pos - target
    z /= np.linalg.norm(z)
    x = np.cross(up, z)
    x /= np.linalg.norm(x)
    y = np.cross(z, x)
    return np.stack([x, y, z], axis=1)


def lookat_quat(pos, target) -> np.ndarray:
    quat = np.zeros(4)
    mujoco.mju_mat2Quat(quat, lookat_rotation(pos, target).reshape(9))
    return quat
