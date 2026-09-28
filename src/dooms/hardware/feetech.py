"""Feetech STS serial-bus protocol, as used by the STS3215 servos of the SO-ARM100 / SO-ARM101.

Packet:  FF FF <id> <len> <instr> <params...> <checksum>,  len = len(params) + 2,
         checksum = ~(id + len + instr + sum(params)) & 0xFF.
Status:  FF FF <id> <len> <error> <params...> <checksum>.
Multi-byte registers are little-endian on the STS series. A few registers use sign-magnitude encoding.

`port` is anything with pyserial's interface (write, read, reset_input_buffer, close); the virtual rig provides one too.
"""
from __future__ import annotations

import time

PING, READ, WRITE, SYNC_READ, SYNC_WRITE = 0x01, 0x02, 0x03, 0x82, 0x83
BROADCAST = 0xFE
DEFAULT_BAUD = 1_000_000
RESOLUTION = 4096                       # counts per turn
STS3215_MODEL = 777

# name: (address, size). EEPROM registers (< 40) only accept writes while Lock (55) is 0.
REG: dict[str, tuple[int, int]] = {
    "Model_Number": (3, 2),
    "ID": (5, 1),
    "Min_Position_Limit": (9, 2),
    "Max_Position_Limit": (11, 2),
    "Max_Torque_Limit": (16, 2),
    "Offset": (31, 2),
    "Operating_Mode": (33, 1),
    "Torque_Enable": (40, 1),
    "Acceleration": (41, 1),
    "Goal_Position": (42, 2),
    "Goal_Time": (44, 2),
    "Goal_Speed": (46, 2),
    "Torque_Limit": (48, 2),
    "Lock": (55, 1),
    "Present_Position": (56, 2),
    "Present_Speed": (58, 2),
    "Present_Load": (60, 2),
    "Present_Voltage": (62, 1),
    "Present_Temperature": (63, 1),
    "Moving": (66, 1),
    "Present_Current": (69, 2),
}
EEPROM_END = 40
SIGN_BIT = {"Offset": 11, "Present_Speed": 15, "Present_Load": 10, "Goal_Speed": 15}
ERROR_BITS = {0: "input voltage", 1: "angle sensor", 2: "overheat", 3: "overcurrent", 5: "overload"}


class BusError(RuntimeError):
    """No (valid) answer from a servo: loose cable, wrong port, power off, wrong baud rate."""


def checksum(body: bytes) -> int:
    return (~sum(body)) & 0xFF


def packet(sid: int, instr: int, params: bytes = b"") -> bytes:
    body = bytes([sid, len(params) + 2, instr]) + params
    return b"\xff\xff" + body + bytes([checksum(body)])


def encode(reg: str, value: int) -> bytes:
    size = REG[reg][1]
    if reg in SIGN_BIT:
        bit = SIGN_BIT[reg]
        value = (abs(value) & ((1 << bit) - 1)) | ((1 << bit) if value < 0 else 0)
    value &= (1 << (8 * size)) - 1
    return value.to_bytes(size, "little")


def decode(reg: str, data: bytes) -> int:
    value = int.from_bytes(data, "little")
    if reg in SIGN_BIT:
        bit = SIGN_BIT[reg]
        mag = value & ((1 << bit) - 1)
        return -mag if value & (1 << bit) else mag
    return value


def describe_error(err: int) -> str:
    return ", ".join(name for bit, name in ERROR_BITS.items() if err & (1 << bit))


class FeetechBus:
    def __init__(self, port, retries: int = 3):
        self.port = port
        self.retries = retries
        self.errors: dict[int, int] = {}          # last hardware-error byte reported by each servo
        self.failures = 0                          # exchanges that needed a retry (link quality)

    # ------------------------------------------------------------------ low level
    def _read_exact(self, n: int, deadline: float) -> bytes:
        buf = b""
        while len(buf) < n:
            chunk = self.port.read(n - len(buf))
            if chunk:
                buf += chunk
            elif time.monotonic() > deadline:
                break
        return buf

    def _status(self, deadline: float) -> tuple[int, int, bytes]:
        """Next status packet: (id, error, params). Skips line noise before the header."""
        prev = b""
        while True:
            b = self._read_exact(1, deadline)
            if not b:
                raise BusError("no answer from the servo bus")
            if prev == b"\xff" and b == b"\xff":
                break
            prev = b
        head = self._read_exact(2, deadline)
        if len(head) < 2:
            raise BusError("truncated answer")
        sid, length = head[0], head[1]
        rest = self._read_exact(length, deadline)
        if len(rest) < length or length < 2:
            raise BusError("truncated answer")
        err, params, chk = rest[0], rest[1:-1], rest[-1]
        if checksum(bytes([sid, length, err]) + params) != chk:
            raise BusError("bad checksum")
        self.errors[sid] = err
        return sid, err, params

    def _drain(self, quiet: float = 0.012, limit: float = 0.08) -> None:
        """Wait until the line has been silent for `quiet` seconds, discarding what arrives. After a failed exchange,
        replies can still be in flight (USB latency); without this they would be read as answers to the next request."""
        end = time.monotonic() + limit
        last = time.monotonic()
        while time.monotonic() < end:
            if self.port.read(64):
                last = time.monotonic()
            elif time.monotonic() - last >= quiet:
                break
        self.port.reset_input_buffer()

    def _transact(self, pkt: bytes, expect: list[int], timeout: float = 0.03) -> dict[int, bytes]:
        last: Exception | None = None
        for attempt in range(self.retries):
            if attempt:
                self._drain()
            try:
                self.port.reset_input_buffer()
                self.port.write(pkt)
                out: dict[int, bytes] = {}
                deadline = time.monotonic() + timeout + 0.002 * len(expect)
                while len(out) < len(expect):
                    sid, _, params = self._status(deadline)
                    if sid in expect and sid not in out:
                        out[sid] = params
                    elif sid in out:                         # a duplicate: something stale is mixed in
                        raise BusError("unexpected extra answer")
                return out
            except BusError as e:
                last = e
                self.failures += 1
        self._drain()
        missing = ", ".join(str(i) for i in expect)
        raise BusError(f"servo {missing}: {last}")

    # ------------------------------------------------------------------ API
    def ping(self, sid: int) -> bool:
        try:
            self._transact(packet(sid, PING), [sid], timeout=0.02)
            return True
        except BusError:
            return False

    def read(self, sid: int, reg: str) -> int:
        addr, size = REG[reg]
        data = self._transact(packet(sid, READ, bytes([addr, size])), [sid])[sid]
        if len(data) != size:
            raise BusError(f"servo {sid}: short read of {reg}")
        return decode(reg, data)

    def write(self, sid: int, reg: str, value: int) -> None:
        addr, _ = REG[reg]
        self._transact(packet(sid, WRITE, bytes([addr]) + encode(reg, value)), [sid])

    def sync_write(self, reg: str, values: dict[int, int]) -> None:
        """One broadcast packet for many servos (no answers)."""
        addr, size = REG[reg]
        params = bytes([addr, size]) + b"".join(bytes([sid]) + encode(reg, v) for sid, v in values.items())
        self.port.write(packet(BROADCAST, SYNC_WRITE, params))

    def sync_read(self, reg: str, ids: list[int], size: int | None = None) -> dict[int, bytes]:
        """Raw bytes of `size` bytes starting at `reg` for each servo (one request, one answer per servo)."""
        addr, rsize = REG[reg]
        size = size or rsize
        data = self._transact(packet(BROADCAST, SYNC_READ, bytes([addr, size]) + bytes(ids)), ids)
        for sid, d in data.items():
            if len(d) != size:
                raise BusError(f"servo {sid}: short read")
        return data

    def sync_read_reg(self, reg: str, ids: list[int]) -> dict[int, int]:
        return {sid: decode(reg, d) for sid, d in self.sync_read(reg, ids).items()}

    def write_eeprom(self, sid: int, reg: str, value: int) -> None:
        """EEPROM registers need the lock released around the write (torque must be off)."""
        self.write(sid, "Lock", 0)
        try:
            self.write(sid, reg, value)
        finally:
            self.write(sid, "Lock", 1)
