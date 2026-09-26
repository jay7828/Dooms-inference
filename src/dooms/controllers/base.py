"""Task-axis controller base classes.

Every controller works in the same symbolic vocabulary the agents use:
  * points  : "eef_tcp" (live end-effector point) or a grounded keypoint (world-frame snapshot)
  * vectors : "eef_x|eef_y|eef_z" (live tcp axes) or "<keypoint>_normal" (grounded surface normal)
The *source* argument of PosAlign is the point the robot moves; if it is an object keypoint it is
assumed rigidly held by the gripper (its offset to the tcp is frozen when the stage starts).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import numpy as np

from ..sim.base import RobotInterface, RobotState


@dataclass
class Keypoint:
    name: str
    pos: np.ndarray                    # world frame
    normal: np.ndarray | None = None   # unit vector, world frame
    axis: np.ndarray | None = None     # in-plane edge direction of the feature's face (unit, world frame)
    axis_sym: float = 180.0            # rotational symmetry of `axis` in degrees (90 for square faces)


@dataclass
class TaskTerm:
    """One block of the stacked task: J dq = v with v = clip(gain * e, v_max)."""
    J: np.ndarray        # (m, n)
    e: np.ndarray        # (m,) desired - current
    gain: float
    v_max: float


@dataclass
class Context:
    robot: RobotInterface
    state: RobotState
    keypoints: dict[str, Keypoint]
    cfg: dict
    t_stage: float = 0.0               # seconds since this stage started
    dt: float = 0.02

    def vector(self, name: str) -> np.ndarray:
        s = self.state
        if name in ("eef_x", "eef_x_axis"):
            return s.tcp_rot[:, 0]
        if name in ("eef_y", "eef_y_axis"):
            return s.tcp_rot[:, 1]
        if name in ("eef_z", "eef_z_axis"):
            return s.tcp_rot[:, 2]
        if name in ("world_z", "z"):
            return np.array([0.0, 0.0, 1.0])
        if name in ("world_x", "x"):
            return np.array([1.0, 0.0, 0.0])
        if name in ("world_y", "y"):
            return np.array([0.0, 1.0, 0.0])
        if "__to__" in name:                       # direction between two grounded keypoints
            a, b = name.split("__to__", 1)
            ka, kb = self.keypoints.get(a), self.keypoints.get(b)
            if ka is None or kb is None:
                raise KeyError(f"vector '{name}': keypoint missing")
            v = kb.pos - ka.pos
            if np.linalg.norm(v) < 1e-6:
                raise KeyError(f"vector '{name}' has zero length")
            return v / np.linalg.norm(v)
        for suffix in ("_normal", "_norm"):
            if name.endswith(suffix):
                kp = self.keypoints.get(name[: -len(suffix)])
                if kp is not None and kp.normal is not None:
                    return kp.normal
        if name.endswith("_axis"):
            kp = self.keypoints.get(name[: -len("_axis")])
            if kp is not None and kp.axis is not None:
                return kp.axis
        raise KeyError(f"unknown vector '{name}'")


class Controller(ABC):
    name: str
    priority: int = 1
    stage: int = 0

    def on_stage_start(self, ctx: Context) -> None:
        """Freeze anything that must be a snapshot (e.g. the eef_tcp target, held-object offsets)."""

    @abstractmethod
    def term(self, ctx: Context) -> TaskTerm | None: ...

    @abstractmethod
    def finished(self, ctx: Context) -> bool: ...

    def gripper_command(self) -> float | None:
        return None

    def describe(self) -> str:
        return self.name
