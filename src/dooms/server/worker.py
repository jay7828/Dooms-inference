"""Simulation session: one long-lived process per browser connection.

The simulator (and therefore the world state) lives here between commands: run "put the bottle into the box" and
the next command starts with the bottle already in the box. The scene only changes on `reset` / `load`.

cmd_q  in : {"type": "load"|"reset"|"run"|"quit", ...}
out_q  out: ("json", event) | ("pose", bytes) | ("frame", bytes)
`cancel` is an mp.Event the server sets to abort a running episode (checked every control tick).
"""
from __future__ import annotations

import queue
import time
import traceback


class Aborted(BaseException):
    """Raised inside the sim loop when the user presses Stop (BaseException so nothing swallows it)."""


def make_cancellable(llm, cancel, poll: float = 0.1):
    """Make every model call abortable. Stop used to be honoured only while the arm moved; a Bedrock call (with retries)
    can take a minute, during which the button appeared dead. A remote call (`llm.remote`) runs on a helper thread and the
    caller polls `cancel`; on Stop it raises Aborted at once and the abandoned call's answer is discarded. Local planners
    (the scripted demo) are instant and render with OpenGL, which must stay on this thread, so they only check the flag."""
    import concurrent.futures as cf
    original = llm.structured
    pool = cf.ThreadPoolExecutor(max_workers=2, thread_name_prefix="llm")
    remote = bool(getattr(llm, "remote", False))

    def structured(*args, **kwargs):
        if cancel.is_set():
            raise Aborted()
        if not remote:
            return original(*args, **kwargs)
        fut = pool.submit(original, *args, **kwargs)
        while True:
            try:
                return fut.result(timeout=poll)
            except cf.TimeoutError:
                if cancel.is_set():
                    fut.cancel()
                    raise Aborted() from None

    llm.structured = structured
    return llm


def session_main(cmd_q, out_q, cancel) -> None:
    import numpy as np
    from dataclasses import asdict

    from ..bench.ablations import ABLATIONS
    from ..command import task_for_command
    from ..config import deep_update, load_config
    from ..llm.factory import make_llm
    from ..perception.viz import encode_jpeg
    from ..pipeline import Pipeline
    from ..robots import DEFAULT_ROBOT, get_profile
    from ..sim.mujoco_env import MuJoCoEnv
    from ..sim.scene_export import poses
    from ..task import load_task

    base_cfg = load_config()
    S = {"env": None, "scene": None, "robot": DEFAULT_ROBOT, "seed": 0, "runs": 0}

    def put(ev):
        out_q.put(("json", ev))

    def push_state(env):
        out_q.put(("pose", b"\x01\x00\x00\x00" + np.float32(env.data.time).tobytes() + poses(env.data).tobytes()))
        out_q.put(("frame", b"\x00\x00\x00\x00" + encode_jpeg(env._render_rgb("scene_cam", 480, 360), 75)))

    def ensure_env(scene: str, seed: int, force_reset: bool, robot: str = DEFAULT_ROBOT):
        profile = get_profile(robot)
        if not profile.supports(scene):
            raise ValueError(f"the {profile.label} does not support the '{scene}' scene")
        fresh = S["env"] is None or S["scene"] != scene or S["robot"] != robot
        if fresh:
            if S["env"] is not None:
                S["env"].close()
            S["env"] = MuJoCoEnv(load_task(scene), base_cfg, profile)
            S["scene"], S["robot"] = scene, robot
        if fresh or force_reset:
            S["env"].reset(seed)
            S["seed"], S["runs"] = seed, 0
        return S["env"]

    def scene_state():
        put({"type": "scene_state", "scene": S["scene"], "robot": S["robot"], "seed": S["seed"], "runs": S["runs"]})

    def run(msg):
        robot = msg.get("robot") or DEFAULT_ROBOT
        env = ensure_env(msg["scene"], int(msg.get("seed", 0)), force_reset=False, robot=robot)
        variant = msg.get("variant", "baseline")
        cfg = deep_update(base_cfg, ABLATIONS.get(variant, {}))
        cfg = deep_update(cfg, {"pipeline": {"grounding": msg.get("grounding", "vlm"), "record_video": False,
                                             "skill_library_dir": (("skills/library" if robot == DEFAULT_ROBOT else f"skills/library-{robot}")
                                                                if msg.get("skills", True) else None)}})
        text = (msg.get("instruction") or "").strip()
        base = load_task(msg["scene"])
        task, pair = task_for_command(base, text or base.instruction)
        kind = msg.get("llm", "scripted")
        if kind == "scripted" and pair is None and not base.success:
            put({"type": "error", "message": "The demo planner needs a command that names two objects, e.g. "
                 "'put the bottle into the box' or 'stack the red cube on the blue cube'. "
                 "Free-form commands need the Claude (Bedrock) planner."})
            return
        seed = S["seed"]
        llm = make_cancellable(make_llm(kind, cfg, task, env, msg.get("model") or None, (6.0, 1.0), seed, pair,
                                        credentials=msg.get("credentials") if kind == "bedrock" else None), cancel)

        speed = float(msg.get("speed", 1.0))
        clock = {"t": float(env.data.time), "wall": time.time()}

        def pose_sink(t, P):
            if cancel.is_set():
                raise Aborted()
            if speed > 0:                       # pace the simulation to wall-clock time
                due = clock["wall"] + (t - clock["t"]) / speed
                now = time.time()
                if due > now:
                    time.sleep(due - now)
                    now = due
                clock["wall"] = now
            clock["t"] = t
            out_q.put(("pose", b"\x01\x00\x00\x00" + np.float32(t).tobytes() + P.tobytes()))

        def frame_sink(rgb):                    # the agents' camera view, ~10 fps
            out_q.put(("frame", b"\x00\x00\x00\x00" + encode_jpeg(rgb, 75)))

        env._frame_every = 5
        env.pose_sink, env.frame_sink = pose_sink, frame_sink

        def emit(ev):
            if ev.get("type") in ("agent", "agent_start", "agent_rejected"):
                u = llm.usage
                ev = dict(ev, usage={"calls": u.n_calls, "input_tokens": u.input_tokens,
                                     "output_tokens": u.output_tokens, "cost": u.cost(cfg["bedrock"]["pricing"])})
            put(ev)
            clock["wall"] = time.time()         # LLM latency must not be "caught up" by fast-forwarding the sim

        put({"type": "started", "instruction": task.instruction, "planner": kind, "seed": seed,
             "verified": bool(task.success), "model": getattr(llm, "default_model", "scripted"),
             "continuing": S["runs"] > 0})
        try:
            from .. import DATA_DIR
            run_dir = DATA_DIR / "runs" / "web" / f"{time.strftime('%Y%m%d-%H%M%S')}_{msg['scene']}_{kind}"
            res = Pipeline(env, llm, cfg, task, run_dir=run_dir, emit=emit).run(seed, reset=False)
        finally:
            env.pose_sink = env.frame_sink = None
        S["runs"] += 1
        d = asdict(res)
        d["subtask_log"] = [{k: v for k, v in l.items() if k != "script"} for l in d["subtask_log"]]
        mean = lambda xs: sum(xs) / len(xs) if xs else None
        d["grounding_err_mm_mean"] = mean(d["grounding_err_mm"])
        put({"type": "done", "result": d})
        scene_state()

    # ------------------------------------------------------------------ real robot (SO-ARM101)
    H = {"session": None, "last_pose": 0.0, "last_frame": 0.0, "last_status": 0.0}

    def hw():
        if H["session"] is None:
            from .. import DATA_DIR
            from ..hardware.session import HardwareSession
            H["session"] = HardwareSession(DATA_DIR, base_cfg)
        return H["session"]

    def hw_status(sess, op: str = "", **extra):
        st = sess.status()
        if sess.camera is not None:
            try:
                st["camera_size"] = list(sess.camera.size)
            except Exception:  # noqa: BLE001
                st["camera_size"] = None
        put({"type": "hw_status", "op": op, **st, **extra})

    def hw_stream(sess, force: bool = False):
        """Twin poses (~15 Hz) and the camera (~6 Hz) while connected, so the page shows the real arm live."""
        now = time.time()
        if sess.env is not None and (force or now - H["last_pose"] > 0.066):
            H["last_pose"] = now
            out_q.put(("pose", b"\x01\x00\x00\x00" + np.float32(sess.env.twin.data.time).tobytes()
                       + poses(sess.env.twin.data).tobytes()))
        if sess.camera is not None and (force or now - H["last_frame"] > 0.16):
            H["last_frame"] = now
            try:
                frame = sess.camera.read()
                h, w = frame.shape[:2]
                if w > 960:
                    import cv2
                    frame = cv2.resize(frame, (960, int(h * 960 / w)), interpolation=cv2.INTER_AREA)
                out_q.put(("frame", b"\x00\x00\x00\x00" + encode_jpeg(frame, 80)))
            except Exception as e:  # noqa: BLE001
                put({"type": "hw_error", "op": "camera", "message": str(e)})
                sess.close_camera()
                hw_status(sess, "camera")

    def with_motion(sess, fn):
        """Long motions stream the twin and honour Stop (cancel -> hold)."""
        env = sess.env

        def sink(t, P):
            if cancel.is_set():
                raise Aborted()
            out_q.put(("pose", b"\x01\x00\x00\x00" + np.float32(t).tobytes() + P.tobytes()))
        if env is not None:
            env.pose_sink = sink
        try:
            return fn()
        finally:
            if env is not None:
                env.pose_sink = None

    HW_OPS = {"connect", "disconnect", "torque", "home", "rest", "jog", "jog_joint", "gripper", "stop", "calib_start",
              "calib_reference", "calib_finish", "calib_cancel", "cameras", "ports", "camera_open", "camera_close",
              "camcal_start", "camcal_add", "camcal_remove", "camcal_solve", "camcal_save", "locate", "hover",
              "safety", "virtual_hand", "virtual_place_tip", "virtual_arrange", "status", "self_test"}
    MOTIONS = {"home", "rest", "jog", "jog_joint", "gripper", "hover", "self_test"}

    def hw_op(msg):
        from ..hardware.session import SetupError, list_ports
        from ..hardware.so101 import SafetyStop
        op = msg.get("op", "")
        a = msg.get("args") or {}
        if op not in HW_OPS:
            put({"type": "hw_error", "op": op, "message": f"unknown robot command '{op}'"})
            return
        sess = hw()
        try:
            if op == "ports":
                put({"type": "hw_ports", "ports": list_ports()})
                return
            if op == "cameras":
                put({"type": "hw_cameras", "cameras": sess.cameras()})
                return
            if op == "locate":
                put({"type": "hw_locate", "point": sess.locate(float(a["u"]), float(a["v"]))})
                return
            calls = {
                "connect": lambda: sess.connect(str(a.get("port", "")), scene=a.get("scene", "sandbox"),
                                                seed=int(a.get("seed", 0))),
                "disconnect": sess.disconnect, "status": sess.status,
                "torque": lambda: sess.set_torque(bool(a.get("on"))),
                "home": sess.home, "rest": sess.rest, "stop": sess.stop,
                "jog": lambda: sess.jog(float(a.get("dx", 0)), float(a.get("dy", 0)), float(a.get("dz", 0))),
                "jog_joint": lambda: sess.jog_joint(str(a["joint"]), float(a["deg"])),
                "gripper": lambda: sess.gripper(bool(a.get("open"))),
                "calib_start": sess.calib_start, "calib_reference": sess.calib_reference,
                "calib_finish": sess.calib_finish, "calib_cancel": sess.calib_cancel,
                "camera_open": lambda: sess.open_camera(str(a.get("source", ""))),
                "camera_close": lambda: (sess.close_camera(), sess.status())[1],
                "camcal_start": sess.camcal_start,
                "camcal_add": lambda: sess.camcal_add(float(a["u"]), float(a["v"])),
                "camcal_remove": lambda: sess.camcal_remove(int(a["index"])),
                "camcal_solve": sess.camcal_solve, "camcal_save": sess.camcal_save,
                "hover": lambda: sess.hover(float(a["u"]), float(a["v"])),
                "safety": lambda: sess.set_safety(**{k: v for k, v in a.items()}),
                "virtual_hand": lambda: sess.virtual_hand(str(a["joint"]), float(a["deg"])),
                "virtual_place_tip": lambda: sess.virtual_place_tip(int(a.get("mark", 0))),
                "virtual_arrange": lambda: sess.virtual_arrange(int(a.get("seed", 0))),
                "self_test": lambda: sess.self_test(bool(a.get("move", True))),
            }
            if op in MOTIONS:
                put({"type": "hw_busy", "busy": True, "op": op})
                try:
                    with_motion(sess, calls[op])
                finally:
                    put({"type": "hw_busy", "busy": False, "op": op})
            else:
                calls[op]()
            hw_status(sess, op)
            hw_stream(sess, force=True)
        except Aborted:
            sess.stop()
            hw_status(sess, op, stopped=True)
        except (SetupError, SafetyStop, ValueError, KeyError) as e:
            if op in MOTIONS and sess.env is not None:
                sess.env.hold()                          # a motion that failed stays where it is
            hw_status(sess, op)
            put({"type": "hw_error", "op": op, "message": str(e)})   # after the status, so the reason stays on screen

    def hw_idle():
        sess = H["session"]
        if sess is None or sess.hw is None:
            return
        from ..hardware.session import SetupError
        try:
            sess.tick()
            hw_stream(sess)
            if time.time() - H["last_status"] > 0.5:
                H["last_status"] = time.time()
                hw_status(sess, "tick")
        except SetupError as e:
            put({"type": "hw_error", "op": "tick", "message": str(e)})
            hw_status(sess, "tick")

    def run_real(msg):
        from ..hardware.session import SetupError
        sess = hw()
        text = (msg.get("instruction") or "").strip()
        base = load_task(msg["scene"])
        task, pair = task_for_command(base, text or base.instruction)
        kind = msg.get("llm", "scripted")
        if kind == "scripted" and not sess.virtual:
            raise SetupError("The Demo planner cannot see a real table. Use the Claude planner with the real robot "
                             "(or connect the virtual robot to try the Demo planner).")
        if kind == "scripted" and pair is None:
            raise SetupError("The demo planner needs a command that names two objects, e.g. 'put the red cube into the box'.")
        cfg = deep_update(base_cfg, {"pipeline": {"grounding": "vlm", "record_video": False, "obstacle_check": False,
                                                  "skill_library_dir": "skills/library-so101" if msg.get("skills", True) else None}})
        env = sess.prepare_run(task, dry_run=bool(msg.get("dry_run", False)))
        if kind == "scripted":
            from ..llm.scripted import ScriptedLLM
            llm = ScriptedLLM(task, sess.rig.env, pixel_noise=(6.0, 1.0), seed=int(msg.get("seed", 0)), pair=pair)
            llm.cam_alias = {"scene": "tripod"}
            llm = make_cancellable(llm, cancel)
        else:
            llm = make_cancellable(make_llm("bedrock", cfg, task, None, msg.get("model") or None,
                                            credentials=msg.get("credentials")), cancel)

        def pose_sink(t, P):
            if cancel.is_set():
                raise Aborted()
            out_q.put(("pose", b"\x01\x00\x00\x00" + np.float32(t).tobytes() + P.tobytes()))

        def frame_sink(rgb):
            out_q.put(("frame", b"\x00\x00\x00\x00" + encode_jpeg(rgb, 75)))

        def emit(ev):
            if ev.get("type") in ("agent", "agent_start", "agent_rejected"):
                u = llm.usage
                ev = dict(ev, usage={"calls": u.n_calls, "input_tokens": u.input_tokens,
                                     "output_tokens": u.output_tokens, "cost": u.cost(cfg["bedrock"]["pricing"])})
            put(ev)

        env.pose_sink, env.frame_sink = pose_sink, frame_sink
        put({"type": "started", "instruction": task.instruction, "planner": kind, "seed": 0,
             "verified": sess.virtual and bool(task.success), "model": getattr(llm, "default_model", "scripted"),
             "continuing": True, "mode": "real", "dry_run": sess.safety.dry_run})
        try:
            from .. import DATA_DIR
            run_dir = DATA_DIR / "runs" / "real" / f"{time.strftime('%Y%m%d-%H%M%S')}_{msg['scene']}_{kind}"
            res = Pipeline(env, llm, cfg, task, run_dir=run_dir, emit=emit).run(0, reset=False)
        finally:
            env.pose_sink = env.frame_sink = None
            sess.stop()                                  # whatever happened, leave the arm holding still
        d = asdict(res)
        d["subtask_log"] = [{k: v for k, v in l.items() if k != "script"} for l in d["subtask_log"]]
        mean = lambda xs: sum(xs) / len(xs) if xs else None
        d["grounding_err_mm_mean"] = mean(d["grounding_err_mm"])
        put({"type": "done", "result": d})
        hw_status(sess, "run")

    while True:
        connected = H["session"] is not None and H["session"].hw is not None
        try:
            msg = cmd_q.get(timeout=0.03) if connected else cmd_q.get()
        except queue.Empty:
            hw_idle()
            continue
        kind = msg.get("type")
        cancel.clear()                                   # a Stop pressed while idle must not abort this command
        try:
            if kind == "quit":
                if H["session"] is not None:
                    H["session"].disconnect()
                return
            if kind == "hw":
                hw_op(msg)
                continue
            if kind == "run" and msg.get("mode") == "real":
                run_real(msg)
                continue
            if kind in ("load", "reset"):
                env = ensure_env(msg["scene"], int(msg.get("seed", 0)), force_reset=(kind == "reset"),
                                 robot=msg.get("robot") or DEFAULT_ROBOT)
                push_state(env)
                scene_state()
            elif kind == "run":
                run(msg)
        except Aborted:
            put({"type": "stopped"})
            if kind != "run" or msg.get("mode") != "real":
                scene_state()
        except Exception as e:  # noqa: BLE001
            name = type(e).__name__
            text = str(e) if name in ("SetupError", "SafetyStop", "HardwareError") else f"{name}: {e}"
            put({"type": "error", "message": text, "trace": traceback.format_exc()[-1500:]})
        finally:
            if kind == "run":
                put({"type": "ended"})
