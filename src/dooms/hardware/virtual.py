"""A virtual SO-ARM101 rig: a MuJoCo world behind a fake serial port that speaks the Feetech byte protocol, plus a fake
camera. The whole real-robot path (driver, calibration, camera calibration, depth-free grounding, safety, UI) runs
against it unchanged, and the rig's ground truth grades the result.

To be a fair test it hides what real hardware hides: every servo is mounted at a random angle and direction, the offset
registers start unset, the camera sits on a "tripod" at a pose (and field of view) the software must calibrate, and the
arm only moves when the goal registers say so (a stale goal makes it jump, exactly like the real servos).
"""
from __future__ import annotations

import copy
import time

import mujoco
import numpy as np

from ..config import load_config
from ..perception.camera import CameraParams
from ..sim.camera_rig import lookat_quat
from ..sim.mujoco_env import MuJoCoEnv
from ..task import load_task
from .feetech import (EEPROM_END, PING, READ, REG, SYNC_READ, SYNC_WRITE, STS3215_MODEL, WRITE, checksum, decode,
                      encode)
from .so101 import COUNTS_PER_RAD, IDS, JOINTS

# tape marks for camera calibration (x, y on the table, metres from the robot base), also used in the guide
TAPE_MARKS = [(0.15, -0.13), (0.15, 0.13), (0.21, -0.17), (0.21, 0.17), (0.28, -0.07), (0.28, 0.07)]
TRIPOD = {"pos": [0.50, -0.34, 0.42], "lookat": [0.19, 0.0, 0.0], "fovy": 48.0}
CAM_SIZE = (640, 480)
TIP_LOCAL = np.array([-0.0065, 0.0, -0.100])   # between the closed jaw tips, in the `gripper` body frame
HAND_SPEED = 2.5                                # rad/s: how fast a person moves a limp joint


class RealClock:
    def now(self) -> float:
        return time.monotonic()

    def sleep(self, dt: float) -> None:
        if dt > 0:
            time.sleep(dt)


class FastClock:
    """Virtual time for tests: sleeping advances the clock instantly (the rig catches the physics up)."""

    def __init__(self):
        self.t = 0.0

    def now(self) -> float:
        return self.t

    def sleep(self, dt: float) -> None:
        self.t += max(dt, 0.0)


def _rig_extras(tripod: dict):
    def add(spec):
        wb = spec.worldbody
        for i, (x, y) in enumerate(TAPE_MARKS):
            wb.add_geom(name=f"tape{i}", type=mujoco.mjtGeom.mjGEOM_BOX, size=[0.006, 0.006, 0.0004],
                        pos=[x, y, 0.0004], rgba=[0.75, 0.12, 0.12, 1], contype=0, conaffinity=0)
        wb.add_camera(name="tripod_cam", pos=tripod["pos"], quat=lookat_quat(tripod["pos"], tripod["lookat"]),
                      fovy=tripod["fovy"])
    return add


class VirtualSO101:
    def __init__(self, scene: str = "sandbox", seed: int = 0, clock=None, hidden_seed: int = 7,
                 tripod: dict | None = None, cam_size: tuple[int, int] = CAM_SIZE):
        self.clock = clock or RealClock()
        self.tripod = {**TRIPOD, **(tripod or {})}
        cfg = copy.deepcopy(load_config())
        cfg["sim"]["cameras"]["tripod"] = {**self.tripod, "width": cam_size[0], "height": cam_size[1]}
        self.cam_size = cam_size
        self.env = MuJoCoEnv(load_task(scene), cfg, "so101", extras=_rig_extras(self.tripod))
        self.scene = scene
        m = self.env.model
        self._adr = list(self.env._qadr) + [self.env._jaw_adr]
        self._base_force = m.actuator_forcerange[:6].copy()
        rng = np.random.default_rng(hidden_seed)
        self.mount = rng.integers(0, 4096, 6)            # hidden: counts the servo reads at model angle 0
        self.dir = rng.choice([-1, 1], 6)
        self.mem = {IDS[j]: bytearray(80) for j in JOINTS}
        for sid, mem in self.mem.items():
            for reg, val in (("Model_Number", STS3215_MODEL), ("ID", sid), ("Min_Position_Limit", 0),
                             ("Max_Position_Limit", 4095), ("Offset", 0), ("Operating_Mode", 0),
                             ("Torque_Limit", 1000), ("Lock", 1), ("Present_Voltage", 121), ("Present_Temperature", 31)):
                a, n = REG[reg]
                mem[a:a + n] = encode(reg, val)
        self.powered = True
        self.absent: set[int] = set()                    # servo IDs that do not answer (unplugged cable)
        self.error_flags: dict[int, int] = {}              # hardware-error byte a servo reports (e.g. 32 = overload)
        self.reset(seed)

    # ------------------------------------------------------------------ world
    def reset(self, seed: int) -> None:
        self.env.reset(seed)
        q = self.q()
        self.hand_q = q.copy()                          # where a (virtual) hand holds each limp joint
        self.goal_q = q.copy()
        self.torque = np.zeros(6, bool)
        for i, sid in enumerate(self._ids()):
            self._set(sid, "Goal_Position", self.present(i))
            self._set(sid, "Torque_Enable", 0)
        self.t0 = self.clock.now() - float(self.env.data.time)

    def arrange_objects(self, seed: int) -> None:
        """Put the objects back on the table (what a person does after calibrating with a cleared table)."""
        d, m = self.env.data, self.env.model
        arm = {a: d.qpos[a] for a in self._adr}
        ctrl = d.ctrl.copy()
        t = d.time
        self.env.reset(seed)                                 # places objects, puts the arm home ...
        for a, v in arm.items():                             # ... so restore the arm exactly as it was
            d.qpos[a] = v
        d.qvel[:] = 0
        d.ctrl[:] = ctrl
        d.time = t
        mujoco.mj_forward(m, d)

    def _ids(self):
        return [IDS[j] for j in JOINTS]

    def q(self) -> np.ndarray:
        return np.array([self.env.data.qpos[a] for a in self._adr])

    def sync(self) -> None:
        """Step the physics up to the clock (lazily: every bus transaction and camera frame catches up)."""
        d, m = self.env.data, self.env.model
        target = self.clock.now() - self.t0
        steps = 0
        m.actuator_forcerange[:6] = self._base_force * (
            np.array([self._get(sid, "Torque_Limit") for sid in self._ids()]) / 1000.0)[:, None]
        limp = ~self.torque
        dof = [m.jnt_dofadr[m.actuator_trnid[i, 0]] for i in range(6)]
        while d.time < target and steps < 2500:
            d.ctrl[:6] = np.where(self.torque, self.goal_q, self.hand_q)
            for i in np.nonzero(limp)[0]:                    # a hand holds a limp joint where it puts it
                a = self._adr[i]
                d.qpos[a] += np.clip(self.hand_q[i] - d.qpos[a], -HAND_SPEED * m.opt.timestep, HAND_SPEED * m.opt.timestep)
                d.qvel[dof[i]] = 0.0
            mujoco.mj_step(m, d)
            steps += 1
        if steps >= 2500:                                # far behind (paused): do not replay minutes of physics
            self.t0 = self.clock.now() - d.time

    def set_hand(self, joint: str, q: float) -> None:
        """A hand moving a limp joint (only works while that servo's torque is off)."""
        i = JOINTS.index(joint)
        lo, hi = self.env.model.jnt_range[self.env.model.actuator_trnid[i, 0]]
        self.hand_q[i] = float(np.clip(q, lo, hi))

    def place_tip(self, xyz, iters: int = 300) -> float:
        """Hand-guide the (closed) jaw tips onto a table point. Returns the remaining error (m)."""
        from scipy.optimize import least_squares
        m, d = self.env.model, mujoco.MjData(self.env.model)
        gb = m.body("gripper").id
        lo, hi = self.env._lo, self.env._hi
        target = np.asarray(xyz, float)

        def tip(q5):
            d.qpos[:] = self.env.data.qpos
            for k, a in enumerate(self.env._qadr):
                d.qpos[a] = q5[k]
            mujoco.mj_kinematics(m, d)
            return d.xpos[gb] + d.xmat[gb].reshape(3, 3) @ TIP_LOCAL, d.xmat[gb].reshape(3, 3)

        def res(q5):
            p, R = tip(q5)
            down = R @ np.array([0.0, 0.0, -1.0])            # jaws point roughly down (a person would do this)
            return np.concatenate([(p - target) * 50, (down - [0, 0, -1]) * 0.3])

        best = None
        for seed in (self.q()[:5], np.array([0, 0.4, 0.5, 1.0, 0]), np.array([0, 0.8, 0.2, 0.9, 0])):
            r = least_squares(res, np.clip(seed, lo + 1e-3, hi - 1e-3), bounds=(lo, hi), max_nfev=iters)
            err = float(np.linalg.norm(tip(r.x)[0] - target))
            if best is None or err < best[0]:
                best = (err, r.x)
        for k in range(5):
            self.hand_q[k] = best[1][k]
        self.hand_q[5] = -0.1745                             # closed
        return best[0]

    def true_tip(self) -> np.ndarray:
        d = self.env.data
        gb = self.env.model.body("gripper").id
        return d.xpos[gb] + d.xmat[gb].reshape(3, 3) @ TIP_LOCAL

    def true_camera(self) -> CameraParams:
        m, d = self.env.model, self.env.data
        cid = m.camera("tripod_cam").id
        mujoco.mj_forward(m, d)
        T = np.eye(4)
        T[:3, :3] = d.cam_xmat[cid].reshape(3, 3)
        T[:3, 3] = d.cam_xpos[cid]
        return CameraParams.from_fovy("tripod", self.cam_size[0], self.cam_size[1], m.cam_fovy[cid], T)

    def project(self, xyz) -> tuple[float, float]:
        cam = self.true_camera()
        p = np.linalg.inv(cam.T_world_cam) @ np.append(np.asarray(xyz, float), 1.0)
        return float(p[0] / -p[2] * cam.fx + cam.cx), float(-p[1] / -p[2] * cam.fy + cam.cy)

    def render(self) -> np.ndarray:
        self.sync()
        return self.env._render_rgb("tripod_cam", *self.cam_size)

    # ------------------------------------------------------------------ servo model
    def _get(self, sid: int, reg: str) -> int:
        a, n = REG[reg]
        return decode(reg, bytes(self.mem[sid][a:a + n]))

    def _set(self, sid: int, reg: str, value: int) -> None:
        a, n = REG[reg]
        self.mem[sid][a:a + n] = encode(reg, value)

    def actual(self, i: int) -> int:
        return int(round(self.mount[i] + self.dir[i] * self.q()[i] * COUNTS_PER_RAD)) % 4096

    def present(self, i: int) -> int:
        sid = self._ids()[i]
        return (self.actual(i) - self._get(sid, "Offset")) % 4096

    def _refresh(self, sid: int) -> None:
        i = sid - 1
        d = self.env.data
        vel = d.qvel[self.env.model.jnt_dofadr[self.env.model.actuator_trnid[i, 0]]]
        load = d.actuator_force[i] / max(self._base_force[i, 1], 1e-6)
        self._set(sid, "Present_Position", self.present(i))
        self._set(sid, "Present_Speed", int(self.dir[i] * vel * COUNTS_PER_RAD))
        self._set(sid, "Present_Load", int(np.clip(abs(load) * 1000, 0, 1000)) * (1 if load >= 0 else -1))
        self._set(sid, "Moving", int(abs(vel) > 0.05))

    def _apply(self, sid: int, addr: int, data: bytes) -> None:
        mem, i = self.mem[sid], sid - 1
        if addr < EEPROM_END and mem[REG["Lock"][0]] == 1:
            return                                           # EEPROM locked: the servo ignores the write
        mem[addr:addr + len(data)] = data
        touched = set(range(addr, addr + len(data)))
        if REG["Torque_Enable"][0] in touched:
            on = bool(mem[REG["Torque_Enable"][0]])
            if on and not self.torque[i]:
                self._goal_from_register(sid)                # the servo drives to whatever the goal register holds
            if not on:
                self.hand_q[i] = self.q()[i]                 # limp: stays put until moved by hand
            self.torque[i] = on
        if REG["Goal_Position"][0] in touched and self.torque[i]:
            self._goal_from_register(sid)

    def _goal_from_register(self, sid: int) -> None:
        i = sid - 1
        goal = self._get(sid, "Goal_Position")
        lo, hi = self._get(sid, "Min_Position_Limit"), self._get(sid, "Max_Position_Limit")
        if lo < hi:
            goal = int(np.clip(goal, lo, hi))
        delta = goal - self.present(i)                       # absolute positioning: no shortcut across 0/4095
        self.goal_q[i] = self.q()[i] + self.dir[i] * delta / COUNTS_PER_RAD

    def handle(self, pkt: bytes) -> bytes:
        """One instruction packet in, the servo answers out (what the bus would carry back)."""
        self.sync()
        sid, length, instr = pkt[2], pkt[3], pkt[4]
        if len(pkt) < 4 + length or checksum(pkt[2:3 + length]) != pkt[3 + length]:
            return b""                                       # corrupted packet: a real servo stays silent
        params = pkt[5:3 + length]
        if not self.powered or sid in self.absent:
            return b""

        def status(s: int, data: bytes = b"") -> bytes:
            body = bytes([s, len(data) + 2, self.error_flags.get(s, 0)]) + data
            return b"\xff\xff" + body + bytes([checksum(body)])

        if instr == PING:
            return status(sid) if sid in self.mem else b""
        if instr == READ and sid in self.mem:
            self._refresh(sid)
            a, n = params[0], params[1]
            return status(sid, bytes(self.mem[sid][a:a + n]))
        if instr == WRITE and sid in self.mem:
            self._apply(sid, params[0], bytes(params[1:]))
            return status(sid)
        if instr == SYNC_WRITE:
            a, n = params[0], params[1]
            body = params[2:]
            for k in range(0, len(body), n + 1):
                s = body[k]
                if s in self.mem:
                    self._apply(s, a, bytes(body[k + 1:k + 1 + n]))
            return b""
        if instr == SYNC_READ:
            a, n = params[0], params[1]
            out = b""
            for s in params[2:]:
                if s in self.mem and s not in self.absent:
                    self._refresh(s)
                    out += status(s, bytes(self.mem[s][a:a + n]))
            return out
        return b""


class VirtualSerialPort:
    """pyserial-compatible port backed by the rig.

    `usb=True` makes it behave like a real USB-serial adapter: every reply arrives after a USB latency (random in
    `latency_ms`), bytes trickle in at the baud rate and in small chunks, `read()` blocks up to `timeout` like pyserial,
    and a few replies are lost (`drop`) or corrupted (`corrupt`). Late replies can land in the next transaction, exactly
    the case a real bus driver must survive.
    """

    name = "virtual"

    def __init__(self, rig: VirtualSO101, usb: bool = False, latency_ms=(1.0, 8.0), chunk: int = 16, drop: float = 0.0,
                 corrupt: float = 0.0, timeout: float = 0.004, baud: int = 1_000_000, seed: int = 0):
        self.rig = rig
        self.usb = usb
        self.latency = latency_ms
        self.chunk = chunk
        self.drop, self.corrupt = drop, corrupt
        self.timeout = timeout
        self.byte_s = 10.0 / baud                         # 8N1: 10 bits per byte
        self.rng = np.random.default_rng(seed)
        self._out = bytearray()
        self._pending: list[tuple[float, bytes]] = []      # (arrival time, bytes) not yet in the receive buffer
        self.is_open = True
        self.stats = {"sent": 0, "dropped": 0, "corrupted": 0}

    def _arrive(self) -> None:
        now = time.monotonic()
        keep = []
        for t, b in self._pending:
            if t <= now:
                self._out += b
            else:
                keep.append((t, b))
        self._pending = keep

    def write(self, data: bytes) -> int:
        if not self.is_open:
            raise OSError("port closed")
        data = bytes(data)
        k = 0
        t = time.monotonic() + len(data) * self.byte_s if self.usb else 0.0
        while k + 4 <= len(data):
            if data[k:k + 2] != b"\xff\xff":
                k += 1
                continue
            n = data[k + 3]
            reply = self.rig.handle(data[k:k + 4 + n])
            k += 4 + n
            if not reply:
                continue
            if not self.usb:
                self._out += reply
                continue
            self.stats["sent"] += 1
            if self.rng.random() < self.drop:
                self.stats["dropped"] += 1
                continue
            if self.rng.random() < self.corrupt:
                self.stats["corrupted"] += 1
                i = int(self.rng.integers(2, len(reply)))
                reply = reply[:i] + bytes([reply[i] ^ 0x5A]) + reply[i + 1:]
            t0 = t + self.rng.uniform(*self.latency) / 1000.0
            for c in range(0, len(reply), self.chunk):       # USB delivers in packets, spaced by the byte time
                part = reply[c:c + self.chunk]
                self._pending.append((t0 + c * self.byte_s, part))
            t = t0 + len(reply) * self.byte_s
        return len(data)

    def read(self, n: int = 1) -> bytes:
        if not self.is_open:
            raise OSError("port closed")
        if self.usb:
            deadline = time.monotonic() + self.timeout
            self._arrive()
            while not self._out and time.monotonic() < deadline:  # pyserial blocks until data or timeout
                nxt = min((t for t, _ in self._pending), default=None)
                if nxt is None:
                    time.sleep(max(0.0, deadline - time.monotonic()))
                    break
                time.sleep(max(0.0, min(deadline, nxt) - time.monotonic()))
                self._arrive()
        out = bytes(self._out[:n])
        del self._out[:n]
        return out

    @property
    def in_waiting(self) -> int:
        if self.usb:
            self._arrive()
        return len(self._out)

    def reset_input_buffer(self) -> None:
        if self.usb:
            self._arrive()
        self._out.clear()                                  # bytes still in flight are NOT cleared (like real hardware)

    def close(self) -> None:
        self.is_open = False
