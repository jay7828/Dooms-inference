"""Episode keypoint memory.

Keypoints are grounded ONCE per plan from a clean initial image (the arm is out of the way), then tracked:
  * static scene keypoints keep their world position,
  * once the gripper closes on an object, keypoints within reach of the tcp become rigidly attached to it
    and follow the end-effector kinematically (no need to see them through the gripper),
  * on release they freeze at their last position.
"""
from __future__ import annotations

import numpy as np

from ..controllers.base import Keypoint
from ..sim.base import RobotState


class KeypointStore:
    def __init__(self):
        self.kps: dict[str, Keypoint] = {}
        self.held: dict[str, tuple[np.ndarray, np.ndarray]] = {}   # name -> (offset, normal) in tcp frame

    def clear(self) -> None:
        self.kps.clear()
        self.held.clear()

    def update(self, kps: dict[str, Keypoint]) -> None:
        self.kps.update(kps)

    def missing(self, names) -> list[str]:
        return [n for n in names if n not in self.kps]

    def _now(self, name: str, s: RobotState) -> Keypoint:
        if name in self.held:
            r, n = self.held[name]
            return Keypoint(name, s.tcp_pos + s.tcp_rot @ r, s.tcp_rot @ n)  # axis is not tracked while held
        return self.kps[name]

    def snapshot(self, names, s: RobotState) -> dict[str, Keypoint]:
        return {n: self._now(n, s) for n in names}

    def on_grasp(self, names, s: RobotState, radius: float = 0.06) -> list[str]:
        grabbed = []
        for n in names:
            kp = self._now(n, s)
            if n not in self.held and np.linalg.norm(kp.pos - s.tcp_pos) < radius:
                nrm = kp.normal if kp.normal is not None else np.array([0.0, 0.0, 1.0])
                self.held[n] = (s.tcp_rot.T @ (kp.pos - s.tcp_pos), s.tcp_rot.T @ nrm)
                grabbed.append(n)
        return grabbed

    def on_release(self, s: RobotState) -> None:
        for n in list(self.held):
            self.kps[n] = self._now(n, s)
            del self.held[n]
