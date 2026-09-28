"""Web UI: type a command, watch the simulator + agent pipeline live.  `python scripts/serve.py`"""
from __future__ import annotations

import asyncio
import multiprocessing as mp
import os
import queue
import threading
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from ..config import load_config, load_env
from ..robots import DEFAULT_ROBOT, PROFILES, get_profile
from ..task import list_tasks, load_task
from .worker import session_main

STATIC = Path(__file__).parent / "static"
app = FastAPI(title="Dooms")
app.add_middleware(GZipMiddleware, minimum_size=1000)
if STATIC.exists():                                   # the standalone web UI; absent when embedded in the desktop app
    app.mount("/static", StaticFiles(directory=STATIC), name="static")

# Embedded mode (desktop app): a per-session token guards the API/WebSocket, and the Electron renderer (file:// or the
# dev server) is allowed by CORS. Unset token = open (standalone localhost use).
AUTH_TOKEN = os.environ.get("DOOMS_AUTH_TOKEN", "")
if os.environ.get("DOOMS_EMBEDDED"):
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
elif os.environ.get("DOOMS_CORS_ORIGINS"):              # UI hosted elsewhere (e.g. Vercel): comma-separated origins
    from fastapi.middleware.cors import CORSMiddleware
    app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in os.environ["DOOMS_CORS_ORIGINS"].split(",") if o.strip()],
                       allow_methods=["*"], allow_headers=["*"])


def _token_ok(given: str | None) -> bool:
    import hmac
    return not AUTH_TOKEN or hmac.compare_digest(given or "", AUTH_TOKEN)


@app.middleware("http")
async def _require_token(request: Request, call_next):
    path = request.url.path
    if AUTH_TOKEN and request.method != "OPTIONS" and path.startswith("/api") and path != "/api/health":
        if not _token_ok(request.headers.get("x-dooms-token")):
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "invalid or missing token"}, status_code=401)
    return await call_next(request)


@app.middleware("http")
async def _no_stale_ui(request: Request, call_next):
    """The page and its scripts change together: make browsers re-check them, so an old cached page is never run
    against a new script (which breaks the UI)."""
    resp = await call_next(request)
    path = request.url.path
    if path == "/" or path.startswith("/static/"):
        resp.headers["Cache-Control"] = "no-cache"
    return resp


@app.get("/api/health")
def health():
    return {"ok": True, "service": "dooms"}

EXAMPLES = {
    "sandbox_blocked": ["pick up the bottle and put it on the table", "put the bottle on the table away from the box"],
    "sandbox_fallen": ["pick up the bottle and put it on the table away from the box", "put the bottle into the box",
                       "put the blue cube into the box"],
    "sandbox": ["put the bottle into the box", "put the blue cube into the box",
                "stack the red cube on top of the blue cube", "put the blue cube on the red cube"],
}
_ctx = mp.get_context("spawn")


REQUIRE_USER_KEYS = os.environ.get("DOOMS_REQUIRE_USER_KEYS", "").lower() in ("1", "true", "yes")
# Hosted in the cloud: the server cannot reach anyone's USB arm or camera, so real-robot control is refused and the UI
# points people to the desktop app (which runs this same server on their own computer).
HOSTED = os.environ.get("DOOMS_HOSTED", "").lower() in ("1", "true", "yes")
DESKTOP_URL = os.environ.get("DOOMS_DESKTOP_URL", "")
REAL_ROBOT_UNAVAILABLE = ("Real robots need the desktop app: this website runs in the cloud and cannot reach the arm or "
                          "camera plugged into your computer. Install Motion Desktop, open Dooms Inference and choose "
                          "Real robot there.")
_validate_hits: dict[str, list[float]] = {}


def _has_credentials() -> bool:
    if REQUIRE_USER_KEYS:
        return False                     # hosted mode: every user brings their own AWS credentials
    load_env()
    if os.environ.get("AWS_BEARER_TOKEN_BEDROCK"):
        return True
    try:
        import boto3
        return boto3.Session().get_credentials() is not None
    except Exception:  # noqa: BLE001
        return False


@app.get("/")
def index():
    if not (STATIC / "index.html").exists():
        return {"service": "dooms", "embedded": True}
    return FileResponse(STATIC / "index.html")


@app.get("/api/config")
def config():
    cfg = load_config()
    scenes = []
    for name in ["sandbox", "sandbox_fallen", "sandbox_blocked"] + [t for t in list_tasks() if not t.startswith("sandbox")]:
        t = load_task(name)
        scenes.append({"name": name, "instruction": t.instruction, "objects": [o.name for o in t.objects],
                       "examples": EXAMPLES.get(name, [t.instruction]),
                       "robots": [p.id for p in PROFILES.values() if p.supports(name)]})
    return {"scenes": scenes, "robots": [p.summary() for p in PROFILES.values()], "default_robot": DEFAULT_ROBOT,
            "real_robots": ["so101"],
            "real_robot": {"available": not HOSTED, "desktop_url": DESKTOP_URL,
                           "reason": REAL_ROBOT_UNAVAILABLE if HOSTED else ""},
            "model": cfg["bedrock"]["default_model"], "bedrock_ready": _has_credentials(),
            "require_user_keys": REQUIRE_USER_KEYS}


_scene_envs: dict = {}
_scene_lock = threading.Lock()


def _library(robot: str = DEFAULT_ROBOT):
    """One skill library per arm: stored parameter defaults (heights, offsets) only make sense for the arm that learned them."""
    from .. import DATA_DIR
    from ..skills import SkillLibrary
    get_profile(robot)
    return SkillLibrary(DATA_DIR / "skills" / ("library" if robot == DEFAULT_ROBOT else f"library-{robot}"))


@app.post("/api/bedrock/validate")
def bedrock_validate(payload: dict, request: Request):
    """Validate user-provided AWS credentials (held in memory only; never stored or logged)."""
    import time as _t
    ip = request.client.host if request.client else "?"
    hits = [t for t in _validate_hits.get(ip, []) if _t.time() - t < 60]
    if len(hits) >= 12:
        raise HTTPException(429, "Too many validation attempts - wait a minute.")
    _validate_hits[ip] = hits + [_t.time()]
    from ..llm.bedrock_client import validate_credentials
    creds = {k: str(v) for k, v in (payload.get("credentials") or {}).items() if isinstance(v, (str, int)) and v != ""}
    if not (creds.get("bearer_token") or (creds.get("access_key_id") and creds.get("secret_access_key"))):
        raise HTTPException(400, "Provide an access key ID and secret access key, or a Bedrock API key.")
    return validate_credentials(creds, payload.get("model"))


@app.get("/api/skills")
def skills(robot: str = DEFAULT_ROBOT):
    return _library(robot).api()


@app.delete("/api/skills")
def clear_skills(robot: str = DEFAULT_ROBOT):
    return {"cleared": _library(robot).clear()}


@app.get("/api/scene/{name}")
def scene(name: str, seed: int = 0, robot: str = DEFAULT_ROBOT, mode: str = "sim"):
    """Renderable scene (meshes + geoms) and the initial body poses for `seed` (browser 3D viewer)."""
    from ..sim.mujoco_env import MuJoCoEnv
    from ..sim.scene_export import export_scene
    if name not in list_tasks():
        raise HTTPException(404, "unknown scene")
    try:
        profile = get_profile(robot)
    except ValueError as e:
        raise HTTPException(404, str(e)) from None
    if not profile.supports(name):
        raise HTTPException(404, f"the {profile.label} does not support the '{name}' scene")
    if mode == "real":                                   # the live twin: the arm on a bare table (objects are real)
        if robot != "so101":
            raise HTTPException(404, "real-robot mode is available for the SO-ARM101")
        from ..hardware.real_env import twin_task
        with _scene_lock:
            if ("twin", robot) not in _scene_envs:
                _scene_envs[("twin", robot)] = MuJoCoEnv(twin_task(), load_config(), profile)
            env = _scene_envs[("twin", robot)]
            return {**export_scene(env.model, env.data), "view": profile.view, "robot": profile.id, "mode": "real"}
    with _scene_lock:
        if (name, robot) not in _scene_envs:
            _scene_envs[(name, robot)] = MuJoCoEnv(load_task(name), load_config(), profile)
        env = _scene_envs[(name, robot)]
        env.reset(seed)
        return {**export_scene(env.model, env.data), "view": profile.view, "robot": profile.id}


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    """One simulation session (own process, own world state) per browser connection."""
    if not _token_ok(ws.query_params.get("token")):
        await ws.close(code=4401)
        return
    await ws.accept()
    cmd_q, out_q, cancel = _ctx.Queue(), _ctx.Queue(), _ctx.Event()
    proc = _ctx.Process(target=session_main, args=(cmd_q, out_q, cancel), daemon=True)
    proc.start()
    state = {"running": False}

    async def pump():
        while True:
            try:
                kind, payload = out_q.get_nowait()
            except queue.Empty:
                if not proc.is_alive():
                    await ws.send_json({"type": "error", "message": "The simulator process stopped unexpectedly."})
                    await ws.send_json({"type": "ended"})
                    return
                await asyncio.sleep(0.01)
                continue
            if kind == "json":
                if payload.get("type") == "ended":
                    state["running"] = False
                await ws.send_json(payload)
            else:
                await ws.send_bytes(payload)

    forward = asyncio.create_task(pump())
    try:
        while True:
            msg = await ws.receive_json()
            t = msg.get("type")
            if t == "stop":
                cancel.set()
            elif t == "hw":                               # robot setup / motions: serialized by the session worker
                if HOSTED:
                    await ws.send_json({"type": "hw_error", "op": msg.get("op", ""), "code": "hosted",
                                        "message": REAL_ROBOT_UNAVAILABLE})
                    continue
                cmd_q.put(msg)
            elif t in ("run", "reset", "load"):
                if state["running"]:
                    await ws.send_json({"type": "error", "message": "A command is already running - stop it first."})
                    continue
                if t == "run" and msg.get("mode") == "real" and HOSTED:
                    await ws.send_json({"type": "error", "code": "hosted", "message": REAL_ROBOT_UNAVAILABLE})
                    await ws.send_json({"type": "ended"})
                    continue
                if t == "run":
                    if msg.get("llm") == "bedrock" and not msg.get("credentials") and not _has_credentials():
                        await ws.send_json({"type": "error", "code": "no_credentials",
                                            "message": "Connect your AWS account (top right) to use Claude, or switch to the Demo planner."})
                        continue
                    state["running"] = True
                cmd_q.put(msg)
    except WebSocketDisconnect:
        pass
    finally:
        forward.cancel()
        cancel.set()
        cmd_q.put({"type": "quit"})
        proc.join(timeout=1.5)
        if proc.is_alive():
            proc.terminate()
