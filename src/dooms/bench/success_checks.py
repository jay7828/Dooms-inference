"""Ground-truth success predicates evaluated on simulator state."""
from __future__ import annotations

import numpy as np

from ..sim.mujoco_env import MuJoCoEnv
from ..sim.scenes.builder import TRAY_HALF, TRAY_WALL_T
from ..task import SuccessPredicate, TaskSpec


def _inside(env: MuJoCoEnv, obj: str, box: str) -> bool:
    o, b = env.object_pos(obj), env.object_pos(box)
    inner = TRAY_HALF - TRAY_WALL_T
    return bool(abs(o[0] - b[0]) < inner and abs(o[1] - b[1]) < inner and o[2] < 0.11
                and np.linalg.norm(env.object_vel(obj)) < 0.05)


def _on_top(env: MuJoCoEnv, obj: str, base: str, size: float = 0.04) -> bool:
    o, b = env.object_pos(obj), env.object_pos(base)
    return bool(np.linalg.norm(o[:2] - b[:2]) < 0.025 and abs((o[2] - b[2]) - size) < 0.012
                and np.linalg.norm(env.object_vel(obj)) < 0.05)


def _outside(env: MuJoCoEnv, obj: str, box: str, start: dict | None = None) -> bool:
    o, b = env.object_pos(obj), env.object_pos(box)
    if start and obj in start and np.linalg.norm(o[:2] - start[obj][:2]) < 0.06:
        return False                       # it never moved: 'outside' was already true before the command
    clear = TRAY_HALF + 0.015
    return bool((abs(o[0] - b[0]) > clear or abs(o[1] - b[1]) > clear) and o[2] < 0.1
                and np.linalg.norm(env.object_vel(obj)) < 0.05)


def evaluate(env: MuJoCoEnv, task: TaskSpec, start: dict | None = None) -> dict:
    results = {}
    for p in task.success:
        ok = (_outside(env, p.object, p.target, start) if p.type == "outside"
              else {"inside": _inside, "on_top": _on_top}[p.type](env, p.object, p.target))
        results[f"{p.type}({p.object},{p.target})"] = ok
    return {"success": all(results.values()) if results else None, "predicates": results}
