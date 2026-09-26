"""Simulation session: one long-lived process per browser connection.

The simulator (and therefore the world state) lives here between commands: run "put the bottle into the box" and
the next command starts with the bottle already in the box. The scene only changes on `reset` / `load`.

cmd_q  in : {"type": "load"|"reset"|"run"|"quit", ...}
out_q  out: ("json", event) | ("pose", bytes) | ("frame", bytes)
`cancel` is an mp.Event the server sets to abort a running episode (checked every control tick).
"""
from __future__ import annotations

import time
import traceback


class Aborted(BaseException):
    """Raised inside the sim loop when the user presses Stop (BaseException so nothing swallows it)."""


def session_main(cmd_q, out_q, cancel) -> None:
    import numpy as np
    from dataclasses import asdict

    from ..bench.ablations import ABLATIONS
    from ..command import task_for_command
    from ..config import deep_update, load_config
    from ..llm.factory import make_llm
    from ..perception.viz import encode_jpeg
    from ..pipeline import Pipeline
    from ..sim.mujoco_env import MuJoCoEnv
    from ..sim.scene_export import poses
    from ..task import load_task

    base_cfg = load_config()
    S = {"env": None, "scene": None, "seed": 0, "runs": 0}

    def put(ev):
        out_q.put(("json", ev))

    def push_state(env):
        out_q.put(("pose", b"\x01\x00\x00\x00" + np.float32(env.data.time).tobytes() + poses(env.data).tobytes()))
        out_q.put(("frame", b"\x00\x00\x00\x00" + encode_jpeg(env._render_rgb("scene_cam", 480, 360), 75)))

    def ensure_env(scene: str, seed: int, force_reset: bool):
        fresh = S["env"] is None or S["scene"] != scene
        if fresh:
            if S["env"] is not None:
                S["env"].close()
            S["env"] = MuJoCoEnv(load_task(scene), base_cfg)
            S["scene"] = scene
        if fresh or force_reset:
            S["env"].reset(seed)
            S["seed"], S["runs"] = seed, 0
        return S["env"]

    def scene_state():
        put({"type": "scene_state", "scene": S["scene"], "seed": S["seed"], "runs": S["runs"]})

    def run(msg):
        env = ensure_env(msg["scene"], int(msg.get("seed", 0)), force_reset=False)
        variant = msg.get("variant", "baseline")
        cfg = deep_update(base_cfg, ABLATIONS.get(variant, {}))
        cfg = deep_update(cfg, {"pipeline": {"grounding": msg.get("grounding", "vlm"), "record_video": False,
                                             "skill_library_dir": "skills/library" if msg.get("skills", True) else None}})
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
        llm = make_llm(kind, cfg, task, env, msg.get("model") or None, (6.0, 1.0), seed, pair,
                       credentials=msg.get("credentials") if kind == "bedrock" else None)

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

    while True:
        msg = cmd_q.get()
        kind = msg.get("type")
        try:
            if kind == "quit":
                return
            if kind in ("load", "reset"):
                env = ensure_env(msg["scene"], int(msg.get("seed", 0)), force_reset=(kind == "reset"))
                push_state(env)
                scene_state()
            elif kind == "run":
                run(msg)
        except Aborted:
            put({"type": "stopped"})
            scene_state()
        except Exception as e:  # noqa: BLE001
            put({"type": "error", "message": f"{type(e).__name__}: {e}", "trace": traceback.format_exc()[-1500:]})
        finally:
            cancel.clear()
            if kind == "run":
                put({"type": "ended"})
