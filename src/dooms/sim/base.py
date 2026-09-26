"""Simulator + robot-agnostic interfaces."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import numpy as np

from ..perception.camera import RGBDObservation


@dataclass
class RobotState:
    q: np.ndarray                 # arm joint positions
    dq: np.ndarray
    tcp_pos: np.ndarray           # (3,) world
    tcp_rot: np.ndarray           # (3,3) tcp frame in world; z axis points out of the gripper
    gripper_width: float          # metres between the finger pads
    wrench: np.ndarray            # (6,) force/torque at the wrist, world frame
    t: float = 0.0


class RobotInterface(ABC):
    """What the runtime needs from any arm: read state, kinematics, and four command kinds."""

    n_joints: int
    max_width: float = 0.08           # widest gripper opening (m)
    force_sensor: bool = True         # wrist force/torque available

    @abstractmethod
    def state(self) -> RobotState: ...

    @abstractmethod
    def jacobian(self, point_world: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """(3,n) linear and (3,n) angular Jacobians of the end-effector body at a world point."""

    @abstractmethod
    def joint_limits(self) -> tuple[np.ndarray, np.ndarray]: ...

    @abstractmethod
    def set_joint_targets(self, q: np.ndarray) -> None: ...

    @abstractmethod
    def set_gripper(self, width: float) -> None: ...

    @abstractmethod
    def step(self) -> None:
        """Advance one control period."""


class SimEnv(ABC):
    @abstractmethod
    def reset(self, seed: int) -> None: ...

    @abstractmethod
    def render(self, camera: str = "scene") -> RGBDObservation: ...

    @abstractmethod
    def gt_keypoint(self, name: str) -> tuple[np.ndarray, np.ndarray]:
        """Ground-truth (position, normal) of a named keypoint; used for oracle grounding + eval only."""

    @abstractmethod
    def object_pos(self, name: str) -> np.ndarray: ...
