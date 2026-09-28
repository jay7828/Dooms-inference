"""SO-ARM101 follower arm on a Feetech bus: connection, software joint calibration, safe commanding.

Calibration (all done with torque OFF, arm moved by hand):
  1. reference pose  - the "L" pose (upper arm up, forearm and gripper straight forward, gripper closed). Each servo's
                       offset register is rewritten so this pose reads mid-scale (2048); joints then never cross the
                       0/4095 wrap inside their range, which would make a servo take the long way round.
  2. directions      - move each joint the way the guide shows; the sign between servo counts and model angle is recorded.
  3. range           - move each joint through its full range; the limits are stored and written to the servos too.
Joint angle (model radians) = REF_Q + sign * (counts - zero) * 2*pi/4096.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

import numpy as np

from .feetech import RESOLUTION, STS3215_MODEL, BusError, FeetechBus, decode, describe_error

JOINTS = ["shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll", "gripper"]
IDS = {j: i + 1 for i, j in enumerate(JOINTS)}
ARM = JOINTS[:5]
# reference ("L") pose in model radians; the gripper is fully closed
REF_Q = np.array([0.0, 0.0, 0.0, 0.0, 0.0, -0.1745])
MODEL_LO = np.array([-1.91986, -1.74533, -1.69, -1.65806, -2.74385, -0.17453])
MODEL_HI = np.array([1.91986, 1.74533, 1.69, 1.65806, 2.84121, 1.74533])
COUNTS_PER_RAD = RESOLUTION / (2 * np.pi)
MID = RESOLUTION // 2

# Direction step: what the person is asked to do, and the sign of the model angle change that motion produces.
DIRECTION_STEPS = [
    ("shoulder_pan", "Swing the whole arm toward the robot's LEFT", -1),
    ("shoulder_lift", "Tilt the upper arm FORWARD, toward the table", +1),
    ("elbow_flex", "Lower the forearm DOWN toward the table", +1),
    ("wrist_flex", "Bend the gripper DOWN", +1),
    ("wrist_roll", "Twist the gripper so its top turns toward the robot's LEFT", +1),
    ("gripper", "OPEN the gripper", +1),
]
DIRECTION_MIN_COUNTS = 200            # ~18 degrees of motion before a direction is accepted


class HardwareError(RuntimeError):
    pass


class SafetyStop(RuntimeError):
    """The safety monitor stopped the motion (overload / collision, temperature, voltage, limits)."""


@dataclass
class JointCal:
    zero: int = MID          # counts at the reference pose
    sign: int = 1            # +1: counts increase with the model angle
    min: int = 0             # usable range in counts
    max: int = RESOLUTION - 1


@dataclass
class ArmCalibration:
    joints: dict[str, JointCal] = field(default_factory=lambda: {j: JointCal() for j in JOINTS})
    reference_done: bool = False
    directions_done: bool = False
    range_done: bool = False
    port: str = ""
    created: float = 0.0

    @property
    def complete(self) -> bool:
        return self.reference_done and self.directions_done and self.range_done

    def to_q(self, counts: dict[int, int]) -> np.ndarray:
        q = np.zeros(len(JOINTS))
        for i, j in enumerate(JOINTS):
            c = self.joints[j]
            delta = ((counts[IDS[j]] - c.zero + MID) % RESOLUTION) - MID      # unwrap around the reference
            q[i] = REF_Q[i] + c.sign * delta / COUNTS_PER_RAD
        return q

    def to_counts(self, q: np.ndarray) -> dict[int, int]:
        out = {}
        for i, j in enumerate(JOINTS):
            c = self.joints[j]
            raw = int(round(c.zero + c.sign * (q[i] - REF_Q[i]) * COUNTS_PER_RAD))
            out[IDS[j]] = int(np.clip(raw, c.min, c.max))
        return out

    def limits(self, margin: float = np.radians(3)) -> tuple[np.ndarray, np.ndarray]:
        """Joint limits in model radians: the calibrated range intersected with the model's, shrunk by a margin."""
        lo, hi = MODEL_LO.copy(), MODEL_HI.copy()
        for i, j in enumerate(JOINTS):
            c = self.joints[j]
            a = REF_Q[i] + c.sign * (c.min - c.zero) / COUNTS_PER_RAD
            b = REF_Q[i] + c.sign * (c.max - c.zero) / COUNTS_PER_RAD
            lo[i], hi[i] = max(lo[i], min(a, b)), min(hi[i], max(a, b))
        return lo + margin, hi - margin

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        d = asdict(self)
        d["created"] = time.time()
        path.write_text(json.dumps(d, indent=2))

    @staticmethod
    def load(path: Path) -> "ArmCalibration":
        d = json.loads(path.read_text())
        d["joints"] = {k: JointCal(**v) for k, v in d["joints"].items()}
        return ArmCalibration(**d)


@dataclass
class SafetyConfig:
    speed_pct: int = 40                 # of MAX_JOINT_SPEED
    torque_pct: int = 100               # servo torque limit (RAM register, resets on power-off); lower = weaker arm
    overload_pct: int = 85              # load above this while the joint cannot follow its command = collision
    overload_seconds: float = 0.4
    overload_lag: float = 0.10          # rad: how far a joint must be behind its command to count as blocked
    max_temperature: int = 65           # deg C
    min_voltage_ratio: float = 0.75     # of the voltage measured at connect
    dry_run: bool = False               # plan and preview in the 3D view; the arm does not move

    MAX_JOINT_SPEED = 2.5               # rad/s at 100 %

    @property
    def joint_speed(self) -> float:
        return self.MAX_JOINT_SPEED * max(5, min(100, self.speed_pct)) / 100


class SO101Hardware:
    """Servo-level access: scan, torque, positions, telemetry, calibration writes."""

    ids = [IDS[j] for j in JOINTS]

    def __init__(self, port, port_name: str = ""):
        self.bus = FeetechBus(port)
        self.port = port
        self.port_name = port_name
        self.torque_on = False
        self.base_voltage: float | None = None
        self.last_speed: dict[int, int] = {}

    @staticmethod
    def open(port_name: str, baud: int = 1_000_000) -> "SO101Hardware":
        import serial
        try:
            port = serial.Serial(port_name, baudrate=baud, timeout=0.004, write_timeout=0.05)
        except Exception as e:  # noqa: BLE001  (serial raises several types)
            raise HardwareError(f"could not open {port_name}: {e}") from e
        return SO101Hardware(port, port_name)

    def close(self) -> None:
        try:
            self.port.close()
        except Exception:  # noqa: BLE001
            pass

    # ------------------------------------------------------------------ discovery
    def scan(self) -> dict[str, dict]:
        """Which servos answer, and their model number. Raises when none of the six is present or one is wrong."""
        found: dict[str, dict] = {}
        for j in JOINTS:
            sid = IDS[j]
            if self.bus.ping(sid):
                try:
                    found[j] = {"id": sid, "model": self.bus.read(sid, "Model_Number")}
                except BusError:
                    found[j] = {"id": sid, "model": None}
        missing = [j for j in JOINTS if j not in found]
        if len(missing) == len(JOINTS):
            raise HardwareError("no servos answered. Check that the arm's power supply is on, the USB cable is in, "
                                "and that you picked the arm's port (the follower arm, not the leader).")
        if missing:
            raise HardwareError(f"servos not answering: {', '.join(f'{j} (ID {IDS[j]})' for j in missing)}. "
                                "Check the daisy-chain cable to those servos.")
        wrong = [j for j, f in found.items() if f["model"] not in (None, STS3215_MODEL)]
        if wrong:
            raise HardwareError(f"unexpected servo model on {', '.join(wrong)} (expected STS3215)")
        return found

    # ------------------------------------------------------------------ state
    def read_counts(self) -> dict[int, int]:
        return self.bus.sync_read_reg("Present_Position", self.ids)

    def read_motion(self) -> tuple[dict[int, int], dict[int, int]]:
        """Positions and loads in one transaction (registers 56..61; the speed in between is read too)."""
        raw = self.bus.sync_read("Present_Position", self.ids, size=6)
        pos = {sid: decode("Present_Position", d[0:2]) for sid, d in raw.items()}
        self.last_speed = {sid: decode("Present_Speed", d[2:4]) for sid, d in raw.items()}
        load = {sid: decode("Present_Load", d[4:6]) for sid, d in raw.items()}
        return pos, load

    def telemetry(self) -> dict:
        volt = self.bus.sync_read_reg("Present_Voltage", self.ids)
        temp = self.bus.sync_read_reg("Present_Temperature", self.ids)
        v = min(volt.values()) / 10.0
        if self.base_voltage is None:
            self.base_voltage = v
        errs = {j: describe_error(self.bus.errors.get(IDS[j], 0)) for j in JOINTS if self.bus.errors.get(IDS[j], 0)}
        return {"voltage": v, "temperature": max(temp.values()),
                "temperatures": {j: temp[IDS[j]] for j in JOINTS}, "errors": errs}

    # ------------------------------------------------------------------ commanding
    def configure(self, safety: SafetyConfig) -> None:
        """RAM settings (lost on power-off): torque limit and a gentle acceleration."""
        self.bus.sync_write("Torque_Limit", {sid: int(10 * safety.torque_pct) for sid in self.ids})
        self.bus.sync_write("Acceleration", {sid: 40 for sid in self.ids})

    def set_torque(self, on: bool) -> None:
        if on:
            # never enable torque with a stale goal: the arm would jump to it
            now = self.read_counts()
            self.bus.sync_write("Goal_Position", now)
        self.bus.sync_write("Torque_Enable", {sid: 1 if on else 0 for sid in self.ids})
        self.torque_on = on

    def write_goals(self, counts: dict[int, int]) -> None:
        self.bus.sync_write("Goal_Position", counts)

    def hold(self) -> None:
        """Stop where it is (goal = present) without dropping the arm."""
        if self.torque_on:
            self.bus.sync_write("Goal_Position", self.read_counts())

    # ------------------------------------------------------------------ calibration writes (EEPROM, torque off)
    def center_offsets(self) -> dict[int, int]:
        """Rewrite each servo's offset so the current pose reads mid-scale. Returns the new present positions."""
        if self.torque_on:
            self.set_torque(False)
        for sid in self.ids:
            self.bus.write_eeprom(sid, "Min_Position_Limit", 0)
            self.bus.write_eeprom(sid, "Max_Position_Limit", RESOLUTION - 1)
            self.bus.write_eeprom(sid, "Offset", 0)
            self.bus.write_eeprom(sid, "Operating_Mode", 0)         # position mode
        actual = self.read_counts()
        for sid in self.ids:
            off = int(np.clip(actual[sid] - MID, -2047, 2047))
            self.bus.write_eeprom(sid, "Offset", off)
        return self.read_counts()

    def write_limits(self, cal: ArmCalibration) -> None:
        for j in JOINTS:
            c = cal.joints[j]
            self.bus.write_eeprom(IDS[j], "Min_Position_Limit", int(c.min))
            self.bus.write_eeprom(IDS[j], "Max_Position_Limit", int(c.max))
