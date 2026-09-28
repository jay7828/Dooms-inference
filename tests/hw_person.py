"""A scripted person for the virtual SO-101 rig: does what the setup guide asks a human to do, with human-sized errors
(a few degrees when posing the arm by hand, a pixel or two when clicking), so the whole real-robot path can be tested."""
from __future__ import annotations

import numpy as np

from dooms.hardware.so101 import DIRECTION_STEPS, JOINTS, MODEL_HI, MODEL_LO, REF_Q
from dooms.hardware.virtual import TAPE_MARKS


class Person:
    def __init__(self, session, seed: int = 0, pose_error_deg: float = 3.0, click_error_px: float = 1.5,
                 touch_error_mm: float = 1.5):
        self.s = session
        self.rng = np.random.default_rng(seed)
        self.pose_err = np.radians(pose_error_deg)
        self.click_err = click_error_px
        self.touch_err = touch_error_mm / 1000

    def wait(self, seconds: float = 0.6, ticks: int = 6) -> None:
        for _ in range(ticks):
            self.s.clock.sleep(seconds / ticks)
            self.s.tick()

    def hand(self, joint: str, q: float) -> None:
        self.s.rig.set_hand(joint, q)

    def pose(self, q6, seconds: float = 1.5) -> None:
        for j, q in zip(JOINTS, q6):
            self.hand(j, q)
        self.wait(seconds, 12)

    def calibrate_arm(self) -> None:
        s = self.s
        s.calib_start()
        ref = REF_Q + self.rng.normal(0, self.pose_err / 2, 6).clip(-self.pose_err, self.pose_err)
        ref[5] = REF_Q[5]                                   # a closed gripper is closed
        self.pose(ref)
        s.calib_reference()
        for joint, _, expected in DIRECTION_STEPS:
            i = JOINTS.index(joint)
            q = ref.copy()
            q[i] += expected * 0.45
            self.pose(q)
            self.pose(ref)
        for i, j in enumerate(JOINTS):                      # sweep every joint end to end
            for q in (MODEL_LO[i] + 0.02, MODEL_HI[i] - 0.02, ref[i]):
                p = ref.copy()
                p[i] = q
                self.pose(p, 4.5)
        s.calib_finish()

    def calibrate_camera(self, marks=None) -> dict:
        s = self.s
        s.camcal_start()
        for k in (marks if marks is not None else range(len(TAPE_MARKS))):
            self.pose(REF_Q, 3.0)                           # lift the arm clear before swinging to the next mark
            x, y = TAPE_MARKS[k]
            if s.hw.torque_on:
                s.set_torque(False)
            ex, ey = self.rng.normal(0, self.touch_err, 2)
            s.rig.place_tip([x + ex, y + ey, 0.003])        # the jaw tips on the tape, by hand
            self.wait(4.0, 20)
            u, v = s.rig.project([x, y, 0.0])
            s.camcal_add(u + self.rng.normal(0, self.click_err), v + self.rng.normal(0, self.click_err))
        st = s.camcal_solve()
        return st["wizard"]["result"]

    def setup_everything(self, seed: int = 0) -> None:
        self.calibrate_arm()
        self.s.open_camera("virtual")
        res = self.calibrate_camera()
        assert res["grade"] != "bad", res
        self.s.camcal_save()
        self.s.virtual_arrange(seed)                        # calibrate on a cleared table, then set the objects out
        self.s.set_torque(True)
