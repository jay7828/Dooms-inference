"""Real-robot path (SO-ARM101) against the virtual rig: protocol, calibration, camera calibration, safety, recovery."""
import shutil
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).parent))
from hw_person import Person  # noqa: E402

from dooms.command import task_for_command  # noqa: E402
from dooms.config import deep_update  # noqa: E402
from dooms.hardware import feetech  # noqa: E402
from dooms.hardware.feetech import BusError, FeetechBus, decode, encode, packet  # noqa: E402
from dooms.hardware.session import HardwareSession, SetupError  # noqa: E402
from dooms.hardware.so101 import IDS, JOINTS, SafetyStop  # noqa: E402
from dooms.hardware.virtual import FastClock, VirtualSerialPort, VirtualSO101  # noqa: E402
from dooms.llm.scripted import ScriptedLLM  # noqa: E402
from dooms.pipeline import Pipeline  # noqa: E402
from dooms.task import load_task  # noqa: E402


# ---------------------------------------------------------------------------------------------- protocol
def test_packet_and_sign_magnitude_encoding():
    assert packet(1, feetech.PING) == bytes([0xFF, 0xFF, 1, 2, 1, 0xFB])
    for reg, v in (("Offset", -1234), ("Offset", 2047), ("Present_Load", -500), ("Goal_Position", 4095)):
        assert decode(reg, encode(reg, v)) == v
    assert encode("Offset", -1) == bytes([0x01, 0x08])            # sign in bit 11


def test_corrupted_answers_are_retried_then_reported():
    rig = VirtualSO101(clock=FastClock())
    bus = FeetechBus(VirtualSerialPort(rig))
    real = rig.handle
    bad = {"n": 0}

    def noisy(pkt):
        out = real(pkt)
        if out and bad["n"] < 2:                                  # the first two answers arrive with a broken checksum
            bad["n"] += 1
            return out[:-1] + bytes([out[-1] ^ 0x5A])
        return out
    rig.handle = noisy
    assert bus.read(1, "Model_Number") == 777                      # recovered on the third try
    assert bad["n"] == 2
    rig.powered = False
    with pytest.raises(BusError):
        bus.read(1, "Model_Number")


def test_missing_servo_is_named():
    from dooms.hardware.so101 import SO101Hardware
    rig = VirtualSO101(clock=FastClock())
    rig.absent = {IDS["wrist_flex"]}
    with pytest.raises(Exception, match="wrist_flex"):
        SO101Hardware(VirtualSerialPort(rig)).scan()
    rig.absent = set(IDS.values())
    with pytest.raises(Exception, match="power supply"):
        SO101Hardware(VirtualSerialPort(rig)).scan()


# ---------------------------------------------------------------------------------------------- fixtures
@pytest.fixture(scope="module")
def calibrated_dir(tmp_path_factory, cfg):
    """One full setup by the scripted person; later tests reconnect to the saved calibration (like a real user)."""
    d = tmp_path_factory.mktemp("hw")
    s = HardwareSession(d, cfg, clock=FastClock())
    s.connect("virtual", scene="put_cube_in_box", seed=0)
    Person(s, seed=0).setup_everything(0)
    s.disconnect()
    return d


def session(calibrated_dir, cfg, tmp_path, scene="put_cube_in_box", seed=0):
    d = tmp_path / "hw_copy"
    shutil.copytree(calibrated_dir, d)
    s = HardwareSession(d, cfg, clock=FastClock())
    s.connect("virtual", scene=scene, seed=seed)
    s.open_camera("virtual")
    s.virtual_arrange(seed)
    s.set_torque(True)                                      # a freshly powered arm starts limp
    return s


# ---------------------------------------------------------------------------------------------- calibration
def test_calibration_recovers_hidden_servo_mounting(cfg, tmp_path):
    s = HardwareSession(tmp_path, cfg, clock=FastClock())
    s.connect("virtual", scene="put_cube_in_box", seed=0)
    Person(s, seed=3, pose_error_deg=0.0).calibrate_arm()
    signs = np.array([s.cal.joints[j].sign for j in JOINTS])
    assert np.all(signs == s.rig.dir)                                   # every direction found
    assert np.degrees(np.abs(s.env._q - s.rig.q())).max() < 0.5         # twin matches the arm
    for j in JOINTS:                                                    # no joint range crosses the 0/4095 wrap
        c = s.cal.joints[j]
        assert 0 < c.min <= c.zero <= c.max < 4095


def test_calibration_persists_across_reconnect(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    st = s.status()
    assert st["calibrated"] and st["camera_calibrated"] and st["ready"]
    assert np.degrees(np.abs(s.env._q - s.rig.q())).max() < 3.5


def test_range_step_refuses_short_sweeps(cfg, tmp_path):
    s = HardwareSession(tmp_path, cfg, clock=FastClock())
    s.connect("virtual")
    p = Person(s)
    s.calib_start()
    s.calib_reference()
    from dooms.hardware.so101 import DIRECTION_STEPS, REF_Q
    for joint, _, e in DIRECTION_STEPS:
        q = REF_Q.copy()
        q[JOINTS.index(joint)] += e * 0.45
        p.pose(q)
        p.pose(REF_Q)
    with pytest.raises(SetupError, match="Move these joints further"):
        s.calib_finish()


def test_torque_on_never_jumps_to_a_stale_goal(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    s.set_torque(False)
    Person(s).pose(np.array([0.3, 0.2, 0.3, 0.8, 0.0, -0.17]), 3.0)    # moved by hand while limp
    before = s.rig.q().copy()
    s.set_torque(True)
    s.clock.sleep(1.0)
    s.tick()
    assert np.degrees(np.abs(s.rig.q() - before)).max() < 1.0


# ---------------------------------------------------------------------------------------------- camera calibration
def test_camera_calibration_rejects_bad_input(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    s.camcal_start()
    s.set_torque(False)
    Person(s).pose(np.array([0, 0, 0, 0, 0, -0.17]), 2.0)               # tips in the air
    with pytest.raises(SetupError, match="above the table"):
        s.camcal_add(300, 200)
    with pytest.raises(SetupError):                                     # nothing to solve yet
        s.camcal_solve()
    res = Person(s, click_error_px=0).calibrate_camera(marks=[0, 1, 2, 3, 4, 5])
    assert res["grade"] == "good"
    w = s.wizard
    w["points"][2]["pixel"] = [w["points"][2]["pixel"][0] + 40, w["points"][2]["pixel"][1]]   # one wrong click
    assert s.camcal_solve()["wizard"]["result"]["grade"] == "bad"
    with pytest.raises(SetupError, match="not accurate enough"):
        s.camcal_save()


def test_locate_matches_the_rig(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    for xy in ((0.18, 0.05), (0.24, -0.10), (0.15, 0.12)):
        u, v = s.rig.project([*xy, 0.0])
        got = np.array(s.locate(u, v))
        assert np.linalg.norm(got[:2] - xy) < 0.015


# ---------------------------------------------------------------------------------------------- safety
def test_floor_guard_blocks_digging_but_allows_lifting(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    env = s.env
    q = env._q.copy()
    q[1] += 1.2                                                          # shoulder down, hard, into the table
    with pytest.raises(SafetyStop, match="table|overloaded"):          # whichever guard trips first
        env.move_to(q)
    s.jog(dz=0.04)                                                       # moving up is fine


def test_collision_stops_and_holds(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    s.home()
    m = s.rig.env.model
    jid = m.joint("elbow_flex").id
    qe = s.rig.q()[2]
    m.jnt_range[jid] = [qe - 0.02, qe + 0.02]                            # something blocks the elbow
    q = s.env._q.copy()
    q[2] += 0.6
    with pytest.raises(SafetyStop, match="elbow flex is overloaded"):
        s.env.move_to(q)
    assert np.abs(s.env._q_cmd - s.env._q).max() < 1e-9                  # holding where it stopped


def test_temperature_and_voltage_watchdogs(calibrated_dir, cfg, tmp_path):
    for reg, val, msg in (("Present_Temperature", 70, "cool down"), ("Present_Voltage", 70, "voltage dropped")):
        s = session(calibrated_dir, cfg, tmp_path / reg)
        s.home()
        s.rig._set(IDS["elbow_flex"], reg, val)
        q = s.env._q.copy()
        q[0] += 1.2
        with pytest.raises(SafetyStop, match=msg):
            s.env.move_to(q, timeout=5)


def test_lost_connection_is_reported(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    s.rig.powered = False
    for _ in range(3):
        s.tick()                                                         # a few missed reads are tolerated ...
    assert s.status()["connected"]
    with pytest.raises(SetupError, match="Lost the connection"):
        for _ in range(5):
            s.tick()                                                     # ... a dead link is reported
    assert not s.status()["connected"]


def test_unplugged_mid_motion_stops_with_a_clear_message(calibrated_dir, cfg, tmp_path):
    from dooms.hardware.so101 import HardwareError
    s = session(calibrated_dir, cfg, tmp_path)
    s.home()
    q = s.env._q.copy()
    q[0] += 0.8
    ticks = {"n": 0}

    def unplug(t, poses):
        ticks["n"] += 1
        if ticks["n"] == 10:
            s.rig.powered = False
    s.env.pose_sink = unplug
    with pytest.raises(HardwareError, match="lost communication"):
        s.env.move_to(q)


def test_dry_run_moves_only_the_twin(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    s.set_safety(dry_run=True)
    before = s.rig.q().copy()
    q = s.env._q.copy()
    q[0] += 0.4
    s.env.move_to(q)
    assert np.degrees(np.abs(s.rig.q() - before)).max() < 0.5           # the real (virtual) arm did not move
    assert abs(s.env._q[0] - q[0]) < 0.05                                # the twin did


# ---------------------------------------------------------------------------------------------- whole task
@pytest.mark.parametrize("scene,cmd", [("put_cube_in_box", "put the red cube into the box"),
                                       ("put_bottle_in_box", "put the bottle into the box"),
                                       ("stack_cubes", "stack the red cube on top of the blue cube")])
def test_real_path_task_succeeds(calibrated_dir, cfg, tmp_path, scene, cmd):
    s = session(calibrated_dir, cfg, tmp_path, scene=scene, seed=1)
    cfg2 = deep_update(cfg, {"pipeline": {"skill_library_dir": None}})
    task, pair = task_for_command(load_task(scene), cmd)
    env = s.prepare_run(task)
    llm = ScriptedLLM(task, s.rig.env, pixel_noise=(6.0, 1.0), seed=1, pair=pair)
    llm.cam_alias = {"scene": "tripod"}
    res = Pipeline(env, llm, cfg2, task).run(1, reset=False)
    assert res.verified and res.success, res.error


def test_stop_mid_task_holds_the_arm(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    task, pair = task_for_command(load_task("put_cube_in_box"), "put the red cube into the box")
    env = s.prepare_run(task)

    class Stop(BaseException):
        pass
    ticks = {"n": 0}

    def sink(t, poses):
        ticks["n"] += 1
        if ticks["n"] == 60:
            raise Stop()
    env.pose_sink = sink
    llm = ScriptedLLM(task, s.rig.env, seed=0, pair=pair)
    llm.cam_alias = {"scene": "tripod"}
    with pytest.raises(Stop):
        Pipeline(env, llm, deep_update(cfg, {"pipeline": {"skill_library_dir": None}}), task).run(0, reset=False)
    env.pose_sink = None
    s.stop()
    q = s.rig.q().copy()
    s.clock.sleep(1.5)
    s.tick()
    assert np.degrees(np.abs(s.rig.q() - q)).max() < 1.0                 # it stays where it stopped



# ---------------------------------------------------------------------------------------------- self-test + USB realism
def _report(st):
    return {c["name"]: c for c in st["self_test"]["checks"]}


def test_self_test_passes_on_a_healthy_calibrated_arm(calibrated_dir, cfg, tmp_path):
    s = session(calibrated_dir, cfg, tmp_path)
    st = s.self_test()
    r = _report(st)
    assert st["self_test"]["ok"], r
    assert all(c["status"] == "ok" for c in r.values()), r
    assert "moved" in r["Motion"]["detail"]


@pytest.mark.parametrize("fault,check,words", [
    ("missing", "Servos", "wrist flex (ID 4)"),
    ("slow_link", "Link speed", "Too slow"),
    ("low_voltage", "Power", "Supply too low"),
    ("hot", "Temperature", "cool down"),
    ("velocity_mode", "Servo mode", "position mode"),
    ("error_flag", "Servo error flags", "overload"),
    ("blocked_wrist", "Motion", "wrist"),
    ("wrong_arm", "Calibration", "Recalibrate"),
])
def test_self_test_names_each_fault(calibrated_dir, cfg, tmp_path, fault, check, words):
    link = {"usb": True, "latency_ms": (14.0, 18.0)} if fault == "slow_link" else None
    d = tmp_path / "hw_copy"
    shutil.copytree(calibrated_dir, d)
    s = HardwareSession(d, cfg, clock=FastClock())
    s.connect("virtual", scene="put_cube_in_box", seed=0, link=link)
    rig = s.rig
    wf = IDS["wrist_flex"]
    if fault == "missing":
        rig.absent = {wf}
    elif fault == "low_voltage":
        rig._set(IDS["elbow_flex"], "Present_Voltage", 55)
    elif fault == "hot":
        rig._set(IDS["shoulder_lift"], "Present_Temperature", 63)
    elif fault == "velocity_mode":
        rig.mem[IDS["gripper"]][33] = 1
    elif fault == "error_flag":
        rig.error_flags = {IDS["elbow_flex"]: 32}
    elif fault == "blocked_wrist":
        m = rig.env.model
        j = m.joint("wrist_flex").id
        q = rig.q()[3]
        m.jnt_range[j] = [q - 0.005, q + 0.005]
    elif fault == "wrong_arm":
        rig._set(wf, "Offset", 0) if False else None
        rig.mem[wf][31:33] = __import__("dooms.hardware.feetech", fromlist=["x"]).encode("Offset", -1500)
    r = _report(s.self_test())
    assert r[check]["status"] in ("fail", "warn"), r
    assert words in (r[check]["detail"] + " " + r[check]["fix"]), r[check]
    assert r[check]["fix"] or check == "Motion"                        # always says what to do


def test_bus_never_returns_wrong_data_on_a_lossy_link():
    from dooms.hardware.so101 import SO101Hardware
    rig = VirtualSO101(clock=FastClock())
    hw = SO101Hardware(VirtualSerialPort(rig, usb=True, drop=0.05, corrupt=0.05, seed=3))
    truth = hw.read_counts()
    wrong = 0
    for _ in range(150):
        try:
            wrong += hw.read_counts() != truth
            wrong += any(v != 0 for v in hw.bus.sync_read_reg("Min_Position_Limit", hw.ids).values())
        except BusError:
            pass                                                        # failing loudly is fine; lying is not
    assert wrong == 0
    assert hw.bus.failures > 0                                          # the link really was lossy


def test_task_succeeds_over_a_lossy_usb_link(calibrated_dir, cfg, tmp_path):
    d = tmp_path / "hw_copy"
    shutil.copytree(calibrated_dir, d)
    s = HardwareSession(d, cfg, clock=FastClock())
    s.connect("virtual", scene="put_cube_in_box", seed=1, link={"usb": True, "drop": 0.03, "corrupt": 0.02})
    s.open_camera("virtual")
    s.virtual_arrange(1)
    s.set_torque(True)
    task, pair = task_for_command(load_task("put_cube_in_box"), "put the red cube into the box")
    env = s.prepare_run(task)
    llm = ScriptedLLM(task, s.rig.env, pixel_noise=(6.0, 1.0), seed=1, pair=pair)
    llm.cam_alias = {"scene": "tripod"}
    res = Pipeline(env, llm, deep_update(cfg, {"pipeline": {"skill_library_dir": None}}), task).run(1, reset=False)
    assert res.verified and res.success, res.error
    assert s.hw.bus.failures > 0
