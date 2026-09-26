"""Ground-truth success predicates evaluated on simulator state."""
from __future__ import annotations

import numpy as np

from ..sim.mujoco_env import MuJoCoEnv
from ..task import SuccessPredicate, TaskSpec


def _inside(env: MuJoCoEnv, obj: str, box: str) -> bool:
    o, b = env.object_pos(obj), env.object_pos(box)
    D = env.dims
    inner = D.tray_half - D.tray_wall_t
    return bool(abs(o[0] - b[0]) < inner and abs(o[1] - b[1]) < inner and o[2] < 0.11 * D.tray_half / 0.09
                and np.linalg.norm(env.object_vel(obj)) < 0.05)


def _on_top(env: MuJoCoEnv, obj: str, base: str, size: float | None = None) -> bool:
    o, b = env.object_pos(obj), env.object_pos(base)
    size = size or env.dims.cube
    return bool(np.linalg.norm(o[:2] - b[:2]) < 0.6 * size and abs((o[2] - b[2]) - size) < 0.3 * size
                and np.linalg.norm(env.object_vel(obj)) < 0.05)


def _outside(env: MuJoCoEnv, obj: str, box: str, start: dict | None = None) -> bool:
    o, b = env.object_pos(obj), env.object_pos(box)
    if start and obj in start and np.linalg.norm(o[:2] - start[obj][:2]) < 0.06:
        return False                       # it never moved: 'outside' was already true before the command
    clear = env.dims.tray_half + 0.015
    return bool((abs(o[0] - b[0]) > clear or abs(o[1] - b[1]) > clear) and o[2] < 0.1
                and np.linalg.norm(env.object_vel(obj)) < 0.05)


def evaluate(env: MuJoCoEnv, task: TaskSpec, start: dict | None = None) -> dict:
    results = {}
    for p in task.success:
        ok = (_outside(env, p.object, p.target, start) if p.type == "outside"
              else {"inside": _inside, "on_top": _on_top}[p.type](env, p.object, p.target))
        results[f"{p.type}({p.object},{p.target})"] = ok
    return {"success": all(results.values()) if results else None, "predicates": results}
