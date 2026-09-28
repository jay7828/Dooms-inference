"""One robot connection and its setup wizard. The web page and the desktop app drive this over the session WebSocket
(`hw_*` messages); tests drive it directly. Everything that must persist lives in DATA_DIR/hardware:

  so101_arm[_virtual].json   joint calibration      camera_<source>.json   camera pose + focal length
  safety.json                safety settings        virtual_eeprom.json    the virtual rig's servo EEPROM
"""
from __future__ import annotations

import json
import re
import time
from dataclasses import asdict
from pathlib import Path

import numpy as np

from .camera import CameraError, list_cameras, open_camera
from .camera_calibration import CalibrationError, CameraCalibration, quality, solve
from .feetech import BusError, EEPROM_END
from .real_env import REST_Q, RealSO101Env
from .so101 import (COUNTS_PER_RAD, DIRECTION_MIN_COUNTS, DIRECTION_STEPS, IDS, JOINTS, MID, MODEL_HI, MODEL_LO,
                    RESOLUTION, ArmCalibration, HardwareError, SafetyConfig, SafetyStop, SO101Hardware)

RANGE_MARGIN = 15                       # counts kept away from each recorded end stop
RANGE_MIN_FRACTION = 0.45               # a joint must travel at least this share of its model range ...
# ... except where the table stops it first
RANGE_MIN_FRACTION_BY_JOINT = {"shoulder_lift": 0.35, "elbow_flex": 0.35}


class SetupError(RuntimeError):
    """A step cannot be done yet; the message says what to do."""


def list_ports() -> list[dict]:
    out = [{"id": "virtual", "name": "Virtual SO-101 (simulated hardware)", "likely": False, "virtual": True}]
    try:
        from serial.tools import list_ports as lp
        for p in lp.comports():
            dev = p.device
            if dev.startswith("/dev/tty."):           # macOS: the cu.* twin does not block on open
                continue
            if any(x in dev for x in ("Bluetooth", "debug-console", "wlan", "Airbass")) or p.vid is None and "usb" not in dev.lower():
                continue                                    # built-in / wireless ports cannot be the arm
            vid = f"{p.vid:04x}:{p.pid:04x}" if p.vid is not None else ""
            likely = vid in ("1a86:7523", "1a86:55d3", "1a86:55d4") or "usbmodem" in dev or "usbserial" in dev \
                or "ACM" in dev or "USB" in dev
            out.append({"id": dev, "name": f"{dev} - {p.description or 'serial port'}", "likely": bool(likely),
                        "virtual": False})
    except Exception:  # noqa: BLE001
        pass
    return out[:1] + sorted(out[1:], key=lambda p: not p["likely"])


def _slug(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "_", s).strip("_")[:60] or "camera"


class HardwareSession:
    def __init__(self, data_dir: Path, cfg: dict, clock=None):
        from .virtual import RealClock
        self.dir = Path(data_dir) / "hardware"
        self.cfg = cfg
        self.clock = clock or RealClock()
        self.hw: SO101Hardware | None = None
        self.env: RealSO101Env | None = None
        self.rig = None
        self.camera = None
        self.camera_source = ""
        self.cam_cal: CameraCalibration | None = None
        self.cal = ArmCalibration()
        self.safety = self._load_safety()
        self.wizard: dict | None = None
        self.message = ""
        self._last_counts: dict[int, int] = {}
        self._telemetry: dict = {}
        self._tel_t = 0.0

    # ------------------------------------------------------------------ files
    @property
    def virtual(self) -> bool:
        return self.rig is not None

    def _arm_path(self) -> Path:
        return self.dir / ("so101_arm_virtual.json" if self.virtual else "so101_arm.json")

    def _cam_path(self, source: str) -> Path:
        return self.dir / f"camera_{_slug(source)}.json"

    def _load_safety(self) -> SafetyConfig:
        p = self.dir / "safety.json"
        try:
            return SafetyConfig(**json.loads(p.read_text()))
        except Exception:  # noqa: BLE001
            return SafetyConfig()

    def _save_eeprom(self) -> None:
        if self.rig is not None:
            self.dir.mkdir(parents=True, exist_ok=True)
            (self.dir / "virtual_eeprom.json").write_text(json.dumps(
                {str(k): list(v[:EEPROM_END]) for k, v in self.rig.mem.items()}))

    def _load_eeprom(self) -> None:
        p = self.dir / "virtual_eeprom.json"
        if self.rig is not None and p.exists():
            for k, v in json.loads(p.read_text()).items():
                self.rig.mem[int(k)][:EEPROM_END] = bytes(v)

    # ------------------------------------------------------------------ connection
    # the virtual robot's link behaves like a real USB adapter (latency, chunked replies, rare lost/corrupt replies)
    VIRTUAL_LINK = {"usb": True, "latency_ms": (1.0, 8.0), "drop": 0.005, "corrupt": 0.002}

    def connect(self, port: str, scene: str = "sandbox", seed: int = 0, link: dict | None = None) -> dict:
        if self.hw is not None:
            self.disconnect()
        try:
            if port == "virtual":
                from .virtual import VirtualSerialPort, VirtualSO101
                self.rig = VirtualSO101(scene=scene, seed=seed, clock=self.clock)
                self._load_eeprom()
                self.hw = SO101Hardware(VirtualSerialPort(self.rig, **(link if link is not None else self.VIRTUAL_LINK)),
                                        "virtual")
            else:
                self.rig = None
                self.hw = SO101Hardware.open(port)
            self.hw.scan()
            self._load_arm()
            self.hw.configure(self.safety)
            # keep whatever the arm is doing: switching the torque off here would drop a holding arm
            holding = any(v == 1 for v in self.hw.bus.sync_read_reg("Torque_Enable", self.hw.ids).values())
            if holding and self.cal.complete:
                self.hw.set_torque(True)                 # re-assert with goal = present so nothing moves
            elif holding:
                self.hw.torque_on = True
            self._telemetry = self.hw.telemetry()
        except (HardwareError, BusError) as e:
            self._drop()
            raise SetupError(str(e)) from e
        self.env = RealSO101Env(self.hw, self.cal, self.cfg, self.safety, self.clock,
                                gt_env=self.rig.env if self.rig else None)
        self.message = "Connected. " + ("Calibrated earlier; check the 3D arm matches." if self.cal.complete
                                        else "Next: calibrate the arm.")
        return self.status()

    def _load_arm(self) -> bool:
        p = self._arm_path()
        self.cal = ArmCalibration.load(p) if p.exists() else ArmCalibration()
        return self.cal.complete

    def _drop(self) -> None:
        self._selftest = None
        if self.hw is not None:
            self.hw.close()
        self.hw = self.env = self.rig = None
        self.wizard = None

    def disconnect(self) -> dict:
        if self.hw is not None:
            try:
                if self.env is not None:
                    self.env.hold()                      # leave it holding where it is: never drop the arm on exit
            except Exception:  # noqa: BLE001
                pass
            self._save_eeprom()
        self.close_camera() if self.camera_source == "virtual" else None
        self._drop()
        self.message = "Disconnected."
        return self.status()

    def _need(self, *what: str) -> None:
        if "connected" in what and self.hw is None:
            raise SetupError("Connect the robot first.")
        if "calibrated" in what and not self.cal.complete:
            raise SetupError("Calibrate the arm first.")
        if "torque" in what and not (self.hw and self.hw.torque_on):
            raise SetupError("Turn the torque on first (the arm must hold itself).")
        if "camera" in what and self.camera is None:
            raise SetupError("Connect the overview camera first.")
        if "camera_cal" in what and self.cam_cal is None:
            raise SetupError("Calibrate the camera first.")

    # ------------------------------------------------------------------ torque + motions
    def set_torque(self, on: bool) -> dict:
        self._need("connected")
        if on:
            self._need("calibrated")
        self.hw.set_torque(on)
        self.env.sync_from_hardware()
        self.message = "Torque on: the arm holds its pose." if on else "Torque off: the arm can be moved by hand."
        return self.status()

    def set_safety(self, **kw) -> dict:
        for k, v in kw.items():
            if hasattr(self.safety, k):
                setattr(self.safety, k, type(getattr(self.safety, k))(v))
        self.dir.mkdir(parents=True, exist_ok=True)
        (self.dir / "safety.json").write_text(json.dumps(asdict(self.safety)))
        if self.hw is not None:
            self.hw.configure(self.safety)
        return self.status()

    def home(self) -> dict:
        self._need("connected", "calibrated", "torque")
        q = np.append(self.env.q_home, self.env._q[5])
        self.env.move_to(q)
        self.message = "At the home pose."
        return self.status()

    def rest(self) -> dict:
        """Fold the arm into its rest pose, then switch the torque off (end of a session)."""
        self._need("connected", "calibrated", "torque")
        self.env.move_to(REST_Q)
        self.hw.set_torque(False)
        self.message = "Resting, torque off."
        return self.status()

    def jog(self, dx: float = 0.0, dy: float = 0.0, dz: float = 0.0) -> dict:
        self._need("connected", "calibrated", "torque")
        step = np.clip([dx, dy, dz], -0.05, 0.05)
        try:
            self.env.jog(step)
        finally:
            self.env.hold()
        return self.status()

    def jog_joint(self, joint: str, delta_deg: float) -> dict:
        self._need("connected", "calibrated", "torque")
        q = self.env._q.copy()
        q[JOINTS.index(joint)] += np.radians(np.clip(delta_deg, -20, 20))
        self.env.move_to(q, timeout=4.0)
        return self.status()

    def gripper(self, open_: bool) -> dict:
        self._need("connected", "calibrated", "torque")
        q = self.env._q.copy()
        q[5] = self.env.twin._width_to_jaw(self.env.max_width if open_ else 0.0)
        try:
            self.env.move_to(q, timeout=3.0)
        except SafetyStop:
            self.env.hold()                              # closing on something is fine
        return self.status()

    def stop(self) -> dict:
        if self.env is not None:
            self.env.hold()
        self.message = "Stopped: holding position."
        return self.status()

    # ------------------------------------------------------------------ arm calibration wizard
    def calib_start(self) -> dict:
        self._need("connected")
        self.hw.set_torque(False)
        self.wizard = {"kind": "arm", "stage": "reference"}
        self.message = "Torque is off. Put the arm in the reference pose shown, then press Record."
        return self.status()

    def calib_reference(self) -> dict:
        self._need("connected")
        if not self.wizard or self.wizard.get("kind") != "arm":
            raise SetupError("Start the arm calibration first.")
        now = self.hw.center_offsets()
        cal = ArmCalibration(port=self.hw.port_name)
        for j in JOINTS:
            cal.joints[j].zero = now[IDS[j]]
        cal.reference_done = True
        self.cal = cal
        self.env.cal = cal
        self.wizard = {"kind": "arm", "stage": "directions", "index": 0}
        self._save_eeprom()
        self.message = DIRECTION_STEPS[0][1]
        return self.status()

    def _calib_poll(self, counts: dict[int, int]) -> None:
        w = self.wizard
        if w["stage"] == "directions":
            joint, text, expected = DIRECTION_STEPS[w["index"]]
            c = self.cal.joints[joint]
            delta = ((counts[IDS[joint]] - c.zero + MID) % RESOLUTION) - MID
            if abs(delta) >= DIRECTION_MIN_COUNTS:
                c.sign = int(expected * np.sign(delta))
                w["index"] += 1
                if w["index"] >= len(DIRECTION_STEPS):
                    self.cal.directions_done = True
                    w.update(stage="range", lo={}, hi={})
                    self.message = "Now move every joint slowly from one end of its travel to the other."
                else:
                    self.message = f"Got it. Next: {DIRECTION_STEPS[w['index']][1].lower()}."
        elif w["stage"] == "range":
            for j in JOINTS:
                v = counts[IDS[j]]
                w["lo"][j] = min(w["lo"].get(j, v), v)
                w["hi"][j] = max(w["hi"].get(j, v), v)

    def range_progress(self) -> dict[str, float]:
        w = self.wizard or {}
        out = {}
        for i, j in enumerate(JOINTS):
            span = (MODEL_HI[i] - MODEL_LO[i]) * COUNTS_PER_RAD
            got = w.get("hi", {}).get(j, 0) - w.get("lo", {}).get(j, 0)
            out[j] = round(float(min(1.0, max(0.0, got / span))), 2)
        return out

    def calib_finish(self) -> dict:
        self._need("connected")
        w = self.wizard
        if not w or w.get("kind") != "arm" or w.get("stage") != "range":
            raise SetupError("Finish the direction step first.")
        prog = self.range_progress()
        short = [j.replace("_", " ") for j, p in prog.items() if p < RANGE_MIN_FRACTION_BY_JOINT.get(j, RANGE_MIN_FRACTION)]
        if short:
            raise SetupError(f"Move these joints further, to both ends: {', '.join(short)}.")
        for j in JOINTS:
            c = self.cal.joints[j]
            margin = 0 if j == "gripper" else RANGE_MARGIN     # the gripper must be able to close all the way
            c.min = int(max(0, w["lo"][j] + margin))
            c.max = int(min(RESOLUTION - 1, w["hi"][j] - margin))
        self.cal.range_done = True
        self.hw.write_limits(self.cal)
        self.cal.save(self._arm_path())
        self._save_eeprom()
        self.env.cal = self.cal
        self.env.refresh_limits()
        self.env.sync_from_hardware()
        self.wizard = None
        self.message = "Arm calibrated. Move it by hand and check the 3D arm follows exactly."
        return self.status()

    def calib_cancel(self) -> dict:
        self.wizard = None
        self._load_arm() if self.hw else None
        if self.env is not None:
            self.env.cal = self.cal
            self.env.refresh_limits()
        self.message = "Calibration cancelled."
        return self.status()

    # ------------------------------------------------------------------ camera
    def cameras(self) -> list[dict]:
        cams = list_cameras()
        if self.rig is not None:
            cams.insert(0, {"id": "virtual", "name": "Virtual tripod camera", "kind": "virtual"})
        return cams

    def open_camera(self, source: str) -> dict:
        self.close_camera()
        try:
            self.camera = open_camera(source, self.rig)
        except CameraError as e:
            raise SetupError(str(e)) from e
        self.camera_source = source
        p = self._cam_path(source)
        self.cam_cal = CameraCalibration.load(p) if p.exists() else None
        if self.env is not None:
            self.env.camera, self.env.camera_cal = self.camera, self.cam_cal
        self.message = "Camera connected." + ("" if self.cam_cal else " Next: calibrate it.")
        return self.status()

    def close_camera(self) -> None:
        if self.camera is not None:
            self.camera.close()
        self.camera, self.camera_source, self.cam_cal = None, "", None
        if self.env is not None:
            self.env.camera = self.env.camera_cal = None

    def frame(self) -> np.ndarray:
        self._need("camera")
        return self.camera.read()

    # ------------------------------------------------------------------ camera calibration wizard
    def camcal_start(self) -> dict:
        self._need("connected", "calibrated", "camera")
        self.wizard = {"kind": "camera", "points": [], "result": None}
        self.message = "Touch a tape mark with the closed jaw tips, then click that mark in the camera image."
        return self.status()

    def camcal_add(self, u: float, v: float) -> dict:
        self._need("connected", "camera")
        w = self.wizard
        if not w or w.get("kind") != "camera":
            raise SetupError("Start the camera calibration first.")
        self.env.sync_from_hardware()
        tip = self.env.tip()
        if tip[2] > 0.015:
            raise SetupError(f"The jaw tips are {tip[2] * 100:.1f} cm above the table: lower them onto the mark first.")
        wsz = self.camera.size
        if not (0 <= u < wsz[0] and 0 <= v < wsz[1]):
            raise SetupError("That click is outside the image.")
        w["points"].append({"world": [float(tip[0]), float(tip[1]), 0.0], "pixel": [float(u), float(v)],
                            "q": [float(x) for x in self.env._q]})
        w["result"] = None
        n = len(w["points"])
        self.message = (f"{n} point{'s' if n > 1 else ''}. " +
                        ("Add more marks, spread over the table." if n < 6 else "Enough points: press Solve."))
        return self.status()

    def camcal_remove(self, index: int) -> dict:
        w = self.wizard or {}
        if w.get("kind") == "camera" and 0 <= index < len(w["points"]):
            w["points"].pop(index)
            w["result"] = None
        return self.status()

    TIP_REST_Z = 0.003          # the closed jaw tips resting on tape sit this far above the table

    def _refine_zeros(self, pts) -> np.ndarray:
        """Every touch puts the jaw tips on the table. If the reference pose was held a few degrees off, the twin puts
        those tips above or below it; solve for the small shoulder-lift / elbow / wrist-flex zero corrections that bring
        them all back to table height (pan and roll do not change the height, so they are left alone)."""
        from scipy.optimize import least_squares
        if len(pts) < 4:
            return np.zeros(6)
        Q = [np.asarray(p["q"]) for p in pts]

        def res(x):
            fix = np.array([0.0, x[0], x[1], x[2], 0.0, 0.0])
            return np.concatenate([[(self.env.tip_of(q + fix)[2] - self.TIP_REST_Z) * 100 for q in Q], x * 0.2])

        lim = np.radians(6)
        x = least_squares(res, np.zeros(3), bounds=(-lim, lim)).x
        before = np.abs([self.env.tip_of(q)[2] - self.TIP_REST_Z for q in Q]).max()
        after = np.abs(res(x)[:len(Q)] / 100).max()
        return np.array([0.0, *x, 0.0, 0.0]) if after < before else np.zeros(6)

    def camcal_solve(self) -> dict:
        w = self.wizard or {}
        if w.get("kind") != "camera":
            raise SetupError("Start the camera calibration first.")
        pts = w["points"]
        w["zero_fix"] = self._refine_zeros(pts)             # the touches also correct small reference-pose errors
        for p in pts:
            t = self.env.tip_of(np.asarray(p["q"]) + w["zero_fix"])
            p["world"] = [float(t[0]), float(t[1]), 0.0]
        try:
            cal = solve([p["world"] for p in pts], [p["pixel"] for p in pts], self.camera.size, self.camera_source)
        except CalibrationError as e:
            raise SetupError(str(e)) from e
        grade, text = quality(cal)
        proj = cal.project([p["world"] for p in pts])
        w["result"] = {"cal": asdict(cal), "grade": grade, "text": text, "fov": round(cal.fov_deg, 1),
                       "arm_fix_deg": [round(float(np.degrees(v)), 2) for v in w["zero_fix"][1:4]],
                       "errors": [round(float(np.linalg.norm(proj[i] - pts[i]["pixel"])), 1) for i in range(len(pts))]}
        self.message = text
        return self.status()

    def camcal_save(self) -> dict:
        w = self.wizard or {}
        if w.get("kind") != "camera" or not w.get("result"):
            raise SetupError("Solve first.")
        if w["result"]["grade"] == "bad":
            raise SetupError("The result is not accurate enough to save. " + w["result"]["text"])
        cal = CameraCalibration(**w["result"]["cal"])
        fix = np.asarray(w.get("zero_fix", np.zeros(6)))
        if np.any(fix):                                      # keep the arm correction the touches revealed
            from .so101 import COUNTS_PER_RAD as CPR
            for i, j in enumerate(JOINTS):
                c = self.cal.joints[j]
                c.zero = int(round(c.zero - c.sign * fix[i] * CPR))
            self.cal.save(self._arm_path())
            self.env.cal = self.cal
            self.env.refresh_limits()
            self.env.sync_from_hardware()
        cal.save(self._cam_path(self.camera_source))
        self.cam_cal = cal
        self.env.camera_cal = cal
        self.wizard = None
        self.message = "Camera calibrated. Click a spot in the image to test: the arm can hover over it."
        return self.status()

    def locate(self, u: float, v: float) -> list[float]:
        self._need("camera", "camera_cal")
        try:
            return [round(float(x), 4) for x in self.cam_cal.pixel_to_table(u, v)]
        except CalibrationError as e:
            raise SetupError(str(e)) from e

    def hover(self, u: float, v: float, height: float = 0.02) -> dict:
        """Test the camera calibration: bring the jaw tips `height` above the clicked table point."""
        self._need("connected", "calibrated", "torque", "camera", "camera_cal")
        p = np.array(self.locate(u, v))
        if np.hypot(p[0], p[1]) > 0.30 or p[0] < 0.08:
            raise SetupError("That spot is out of the arm's reach.")
        tip = self.env.tip()
        try:
            self.env.jog([p[0] - tip[0], p[1] - tip[1], p[2] + height - tip[2]], timeout=6.0)
        finally:
            self.env.hold()
        self.message = f"Hovering {height * 100:.0f} cm above ({p[0]:.3f}, {p[1]:.3f}). Is it over the spot you clicked?"
        return self.status()

    # ------------------------------------------------------------------ virtual-only helpers (stand in for a hand)
    def virtual_hand(self, joint: str, deg: float) -> dict:
        if self.rig is None:
            raise SetupError("Only the virtual robot can be moved from here; move the real arm by hand.")
        if self.hw.torque_on:
            raise SetupError("Turn the torque off first (a hand cannot move a joint that is holding).")
        self.rig.set_hand(joint, np.radians(deg))
        return self.status()

    def virtual_place_tip(self, mark: int) -> dict:
        if self.rig is None:
            raise SetupError("Only available for the virtual robot.")
        from .virtual import TAPE_MARKS
        if self.hw.torque_on:
            self.hw.set_torque(False)
        x, y = TAPE_MARKS[int(mark) % len(TAPE_MARKS)]
        self.rig.place_tip([x, y, 0.003])                    # jaw tips resting lightly on the tape
        return self.status()

    def virtual_arrange(self, seed: int = 0) -> dict:
        if self.rig is None:
            raise SetupError("Only available for the virtual robot: arrange the real table by hand.")
        self.rig.arrange_objects(int(seed))
        self.message = "Objects placed on the virtual table."
        return self.status()

    def virtual_true_q(self) -> np.ndarray:
        return self.rig.q() if self.rig is not None else None

    # ------------------------------------------------------------------ self-test
    def self_test(self, move: bool = True) -> dict:
        """Check the connection end to end and say exactly what is wrong. Results: list of
        {name, status: ok|warn|fail, detail, fix}; also kept in status()["self_test"]."""
        self._need("connected")
        from .feetech import REG, STS3215_MODEL, describe_error
        hw, bus = self.hw, self.hw.bus
        out: list[dict] = []

        def add(name, status, detail, fix=""):
            out.append({"name": name, "status": status, "detail": detail, "fix": fix})

        # 1. every servo answers, with the right model
        missing, wrong, pings = [], [], []
        for j in JOINTS:
            t0 = time.perf_counter()
            ok = bus.ping(IDS[j])
            pings.append((time.perf_counter() - t0) * 1000)
            if not ok:
                missing.append(f"{j.replace('_', ' ')} (ID {IDS[j]})")
                continue
            try:
                if bus.read(IDS[j], "Model_Number") != STS3215_MODEL:
                    wrong.append(j.replace("_", " "))
            except BusError:
                missing.append(f"{j.replace('_', ' ')} (ID {IDS[j]})")
        if missing:
            add("Servos", "fail", f"not answering: {', '.join(missing)}",
                "Check the daisy-chain cable into those servos and that the arm's power is on.")
            self._selftest = {"ok": False, "checks": out, "t": time.time()}
            return self.status()
        add("Servos", "fail" if wrong else "ok",
            f"unexpected model on {', '.join(wrong)}" if wrong else "all 6 answer, all STS3215",
            "This app drives STS3215 servos (SO-101 follower arm)." if wrong else "")

        # 2. link speed and reliability (the control loop needs a full read in well under 20 ms)
        before, times, errs = bus.failures, [], 0
        for _ in range(60):
            t0 = time.perf_counter()
            try:
                hw.read_motion()
            except BusError:
                errs += 1
            times.append((time.perf_counter() - t0) * 1000)
        times = np.array(times)
        retries = bus.failures - before
        p95 = float(np.percentile(times, 95))
        detail = f"read of all joints: {times.mean():.1f} ms average, {p95:.1f} ms p95; {retries} retries, {errs} failures in 60"
        if errs or p95 > 15:
            add("Link speed", "fail", detail,
                "Too slow or unreliable for smooth control. Use a short, good USB cable plugged directly into the "
                "computer (no hub). On Linux with an FTDI adapter, set its latency timer to 1 ms.")
        elif p95 > 10 or retries > 3:
            add("Link speed", "warn", detail, "Usable, but check the USB cable / avoid hubs for smoother motion.")
        else:
            add("Link speed", "ok", detail)

        # 3. per-servo settings and health
        regs = {r: bus.sync_read_reg(r, hw.ids) for r in ("Operating_Mode", "Lock", "Torque_Limit", "Present_Voltage",
                                                         "Present_Temperature", "Min_Position_Limit", "Max_Position_Limit")}
        not_pos = [j for j in JOINTS if regs["Operating_Mode"][IDS[j]] != 0]
        add("Servo mode", "fail" if not_pos else "ok",
            f"not in position mode: {', '.join(not_pos)}" if not_pos else "all in position mode",
            "Run the arm calibration: it switches them to position mode." if not_pos else "")
        weak = [j for j in JOINTS if regs["Torque_Limit"][IDS[j]] < 300]
        add("Torque limit", "warn" if weak else "ok",
            f"very low on {', '.join(weak)}" if weak else f"at least {min(regs['Torque_Limit'].values()) / 10:.0f}% on every servo",
            "Raise 'Torque limit' in Test & safety." if weak else "")
        volts = np.array([regs["Present_Voltage"][IDS[j]] / 10 for j in JOINTS])
        vmin, vmax = volts.min(), volts.max()
        if vmin < 6.0 or vmax - vmin > 1.0:
            add("Power", "fail", f"{vmin:.1f}-{vmax:.1f} V across servos",
                "Supply too low or a bad power connection. Use the arm's own supply (12 V for the follower) and check the plug.")
        elif 11.0 <= vmin <= 13.2 or 6.5 <= vmin <= 8.5:
            add("Power", "ok", f"{vmin:.1f} V ({'12 V' if vmin > 10 else '7.4 V'} servos), even across the arm")
        else:
            add("Power", "warn", f"{vmin:.1f} V is unusual for these servos", "Check which power supply is plugged in.")
        temps = [regs["Present_Temperature"][IDS[j]] for j in JOINTS]
        tmax = max(temps)
        add("Temperature", "fail" if tmax >= 60 else "warn" if tmax >= 45 else "ok", f"hottest servo {tmax} °C",
            "Let the arm cool down before moving it." if tmax >= 45 else "")
        errs_now = {j: describe_error(bus.errors.get(IDS[j], 0)) for j in JOINTS if bus.errors.get(IDS[j], 0)}
        add("Servo error flags", "fail" if errs_now else "ok",
            "; ".join(f"{j.replace('_', ' ')}: {e}" for j, e in errs_now.items()) if errs_now else "none reported",
            "Power-cycle the arm. If a flag comes back, that servo may be damaged or blocked." if errs_now else "")

        # 4. calibration consistency
        if not self.cal.complete:
            add("Calibration", "warn", "not calibrated yet", "Run the arm calibration (next step).")
        else:
            pos = hw.read_counts()
            outside = [j.replace("_", " ") for j in JOINTS
                       if not (self.cal.joints[j].min - 60 <= pos[IDS[j]] <= self.cal.joints[j].max + 60)]
            limits_off = [j.replace("_", " ") for j in JOINTS
                          if (regs["Min_Position_Limit"][IDS[j]], regs["Max_Position_Limit"][IDS[j]])
                          != (self.cal.joints[j].min, self.cal.joints[j].max)]
            if outside:
                add("Calibration", "fail", f"outside the calibrated range: {', '.join(outside)}",
                    "The saved calibration does not match this arm (another arm, or servos were re-set). Recalibrate.")
            elif limits_off:
                add("Calibration", "warn", f"servo limits differ from the saved calibration on {', '.join(limits_off)}",
                    "Recalibrate to write the limits again.")
            else:
                add("Calibration", "ok", "saved calibration matches the servos")

        # 5. a small real motion: the wrist bends 6 degrees and comes back
        if move and self.cal.complete and not self.safety.dry_run and not any(c["status"] == "fail" for c in out):
            was_on = hw.torque_on
            try:
                if not was_on:
                    hw.set_torque(True)
                self.env.sync_from_hardware()
                start = self.env._q.copy()
                target = start.copy()
                i = JOINTS.index("wrist_flex")
                step = np.radians(6) * (1 if start[i] < 0 else -1)          # bend toward the middle of the range
                target[i] += step
                t0 = time.perf_counter()
                self.env.move_to(target, timeout=4.0)
                took = time.perf_counter() - t0
                got = float(np.degrees(self.env._q[i] - start[i]))
                self.env.move_to(start, timeout=4.0)
                back = float(np.degrees(abs(self.env._q[i] - start[i])))
                if abs(got - np.degrees(step)) > 1.5 or back > 1.5:
                    add("Motion", "fail", f"asked for {np.degrees(step):+.0f}°, the wrist moved {got:+.1f}° (return error {back:.1f}°)",
                        "The wrist servo is blocked, too weak (raise the torque limit) or mis-calibrated.")
                else:
                    add("Motion", "ok", f"wrist moved {got:+.1f}° as asked in {took:.1f} s and came back within {back:.1f}°. "
                        "Watch the 3D arm: it must have moved the same way.")
            except (SafetyStop, HardwareError) as e:
                add("Motion", "fail", str(e), "Something blocked the wrist, or the link dropped. Clear it and retry.")
            finally:
                if not was_on:
                    hw.set_torque(False)
        elif move:
            add("Motion", "warn", "skipped: " + ("calibrate the arm first" if not self.cal.complete else
                                                 "dry run is on" if self.safety.dry_run else "fix the failures above first"))
        ok = not any(c["status"] == "fail" for c in out)
        self._selftest = {"ok": ok, "checks": out, "t": time.time()}
        n_warn = sum(c["status"] == "warn" for c in out)
        self.message = ("Self-test passed." if ok and not n_warn else "Self-test passed with warnings." if ok
                        else "Self-test found problems: see the red items.")
        return self.status()

    # ------------------------------------------------------------------ periodic
    def tick(self) -> None:
        """Read the arm (twin + wizard progress). Raises SetupError when the connection is lost."""
        if self.hw is None:
            return
        try:
            if self.rig is not None:
                self.rig.sync()
            pos, load = self.hw.read_motion()
            self._last_counts = pos
            self.env.last_load = load
            if self.wizard and self.wizard.get("kind") == "arm" and self.wizard.get("stage") != "reference":
                self._calib_poll(pos)
            if self.cal.reference_done:
                self.env._q = self.cal.to_q(pos)
                if not self.hw.torque_on:
                    self.env._q_sent = self.env._q.copy()
                    self.env._q_cmd = self.env._q.copy()
                self.env._update_twin()
            if time.monotonic() - self._tel_t > 1.0:
                self._telemetry = self.hw.telemetry()
                self._tel_t = time.monotonic()
            self._tick_misses = 0
        except (BusError, OSError) as e:
            self._tick_misses = getattr(self, "_tick_misses", 0) + 1
            if isinstance(e, BusError) and self._tick_misses < 6:
                return                                       # a glitch on the link: try again next tick
            self._drop()
            self.message = f"Lost the connection to the arm ({e}). Check power and USB, then reconnect."
            raise SetupError(self.message) from e

    def prepare_run(self, task, dry_run: bool | None = None) -> RealSO101Env:
        self._need("connected", "calibrated", "camera", "camera_cal")
        if dry_run is not None:
            self.safety.dry_run = bool(dry_run)
        if not self.safety.dry_run and not self.hw.torque_on:
            self.hw.set_torque(True)
        self.env.sync_from_hardware()
        self.env.bind(task, self.camera, self.cam_cal)
        self.wizard = None
        return self.env

    # ------------------------------------------------------------------ status
    def status(self) -> dict:
        connected = self.hw is not None
        w = self.wizard
        wiz = None
        if w and w["kind"] == "arm":
            wiz = {"kind": "arm", "stage": w["stage"]}
            if w["stage"] == "directions":
                j, text, _ = DIRECTION_STEPS[min(w["index"], len(DIRECTION_STEPS) - 1)]
                wiz.update(index=w["index"], total=len(DIRECTION_STEPS), joint=j, text=text)
            if w["stage"] == "range":
                wiz["progress"] = self.range_progress()
        elif w and w["kind"] == "camera":
            wiz = {"kind": "camera", "points": w["points"],
                   "result": None if not w.get("result") else {k: v for k, v in w["result"].items() if k != "cal"}}
        cam_grade = quality(self.cam_cal) if self.cam_cal else None
        env = self.env
        return {
            "connected": connected, "port": self.hw.port_name if connected else "", "virtual": self.virtual,
            "torque": bool(connected and self.hw.torque_on),
            "calibrated": self.cal.complete if connected else False,
            "camera": self.camera_source or None,
            "camera_calibrated": self.cam_cal is not None,
            "camera_quality": None if not cam_grade else {"grade": cam_grade[0], "text": cam_grade[1],
                                                          "fov": round(self.cam_cal.fov_deg, 1)},
            "safety": asdict(self.safety),
            "joints": env.joints_deg() if (env is not None and self.cal.reference_done) else None,
            "tip": [round(float(x), 4) for x in env.tip()] if (env is not None and self.cal.reference_done) else None,
            "telemetry": self._telemetry if connected else {},
            "wizard": wiz,
            "message": self.message,
            "ready": bool(connected and self.cal.complete and self.camera is not None and self.cam_cal is not None),
            "self_test": getattr(self, "_selftest", None) if connected else None,
        }
