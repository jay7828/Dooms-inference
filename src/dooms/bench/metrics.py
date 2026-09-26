"""Aggregate episode records into benchmark metrics."""
from __future__ import annotations

import math
from collections import defaultdict


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return 0.0, 0.0
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, c - h), min(1.0, c + h)


def _mean(xs):
    xs = [x for x in xs if x is not None]
    return sum(xs) / len(xs) if xs else float("nan")


def aggregate(episodes: list[dict]) -> list[dict]:
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for e in episodes:
        groups[(e["variant"], e["task"])].append(e)
    rows = []
    for (variant, task), eps in sorted(groups.items()):
        n = len(eps)
        k = sum(e["success"] for e in eps)
        lo, hi = wilson(k, n)
        errs = [x for e in eps for x in e.get("grounding_err_mm", [])]
        rows.append({
            "variant": variant, "task": task, "episodes": n, "success_rate": k / n, "ci_low": lo, "ci_high": hi,
            "subtask_success": _mean([e["subtasks_ok"] / max(1, e["subtasks_total"]) for e in eps]),
            "replans": _mean([e["replans"] for e in eps]),
            "llm_calls": _mean([e["llm_calls"] for e in eps]),
            "input_tokens": _mean([e["input_tokens"] for e in eps]),
            "output_tokens": _mean([e["output_tokens"] for e in eps]),
            "cost_usd": _mean([e["cost_usd"] for e in eps]),
            "llm_latency_s": _mean([e["llm_latency_s"] for e in eps]),
            "wall_s": _mean([e["wall_s"] for e in eps]),
            "sim_s": _mean([e["sim_s"] for e in eps]),
            "grounding_err_mm": _mean(errs),
            "refined_err_mm": _mean([x for e in eps for x in e.get("refined_err_mm", [])]),
            "errors": sum(1 for e in eps if e["error"] and not e["success"]),
        })
    return rows
