#!/usr/bin/env python
"""Run N seeded trials of several jobs (scene + arm + command) and report the success count of each.

    python scripts/run_trials.py --llm scripted --seeds 50 --out runs/trials_scripted

A job is scored by the simulator's ground-truth predicate (inside / on_top). Results are appended to
<out>/episodes.jsonl (resumable) and summarised in <out>/summary.{md,json}.
"""
import argparse
import json
import math
import multiprocessing as mp
import time
from dataclasses import asdict
from pathlib import Path

JOBS = [  # id, label, scene, robot, command (None = the scene's own instruction)
    ("franka_bottle_box", "Put the bottle in the box", "put_bottle_in_box", "franka", None),
    ("franka_cube_box", "Put the red cube in the box", "put_cube_in_box", "franka", None),
    ("franka_stack", "Stack red on blue", "stack_cubes", "franka", None),
    ("franka_clutter_cube_box", "Blue cube in the box, cluttered table", "sandbox", "franka", "put the blue cube into the box"),
    ("franka_clutter_stack", "Stack blue on red, cluttered table", "sandbox", "franka", "put the blue cube on the red cube"),
    ("so101_cube_box", "Put the red cube in the box", "put_cube_in_box", "so101", None),
    ("so101_stack", "Stack red on blue", "stack_cubes", "so101", None),
]


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return 0.0, 1.0
    p, d = k / n, 1 + z * z / n
    c, h = (p + z * z / (2 * n)) / d, z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return max(0.0, c - h), min(1.0, c + h)


def run_job(args):
    job, seeds, llm_kind, model, noise, out = args
    jid, label, scene, robot, command = job
    from dooms.command import task_for_command
    from dooms.config import deep_update, load_config
    from dooms.llm.factory import make_llm
    from dooms.pipeline import Pipeline
    from dooms.sim.mujoco_env import MuJoCoEnv
    from dooms.task import load_task

    cfg = deep_update(load_config(), {"pipeline": {"skill_library_dir": None, "record_video": False}})
    base = load_task(scene)
    task, pair = task_for_command(base, command or base.instruction)
    env = MuJoCoEnv(task, cfg, robot)
    rows = []
    for s in seeds:
        t0 = time.time()
        try:
            llm = make_llm(llm_kind, cfg, task, env, model, noise, seed=s, pair=pair)
            res = Pipeline(env, llm, cfg, task, run_dir=None).run(s)
            rec = {k: v for k, v in asdict(res).items() if k != "subtask_log"}
        except Exception as e:  # an episode that crashes counts as a failure, with the reason kept
            rec = {"success": False, "error": f"{type(e).__name__}: {e}"[:300], "seed": s}
        rec |= {"job": jid, "label": label, "scene": scene, "robot": robot, "seed": s, "llm_kind": llm_kind, "wall_s": round(time.time() - t0, 1)}
        with open(out / f"{jid}.jsonl", "a") as f:
            f.write(json.dumps(rec, default=float) + "\n")
        rows.append(rec)
        print(f"{jid:<26} seed {s:>2}: {'OK  ' if rec['success'] else 'FAIL'} {rec['wall_s']:>5}s {str(rec.get('error', ''))[:70]}", flush=True)
    env.close()
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--llm", default="scripted", choices=["scripted", "bedrock"])
    ap.add_argument("--model", default=None)
    ap.add_argument("--seeds", type=int, default=50)
    ap.add_argument("--jobs", nargs="+", default=[j[0] for j in JOBS], choices=[j[0] for j in JOBS])
    ap.add_argument("--noise", type=float, nargs=2, default=(6.0, 1.0), help="scripted planner: simulated pointing noise in pixels (coarse fine)")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    from dooms import ROOT
    out = Path(a.out) if a.out else ROOT / "runs" / f"trials_{a.llm}"
    out.mkdir(parents=True, exist_ok=True)

    work = []
    for job in JOBS:
        if job[0] not in a.jobs:
            continue
        f = out / f"{job[0]}.jsonl"
        done = {json.loads(l)["seed"] for l in f.read_text().splitlines() if l.strip()} if f.exists() else set()
        todo = [s for s in range(a.seeds) if s not in done]
        if todo:
            work.append((job, todo, a.llm, a.model, tuple(a.noise), out))
    if work:
        with mp.get_context("spawn").Pool(min(a.workers, len(work))) as pool:
            pool.map(run_job, work)

    summary = []
    for jid, label, scene, robot, command in JOBS:
        f = out / f"{jid}.jsonl"
        if not f.exists():
            continue
        rows = [json.loads(l) for l in f.read_text().splitlines() if l.strip()]
        n, k = len(rows), sum(bool(r["success"]) for r in rows)
        lo, hi = wilson(k, n)
        fails: dict[str, int] = {}
        for r in rows:
            if not r["success"]:
                key = str(r.get("error") or "predicate false")[:60]
                fails[key] = fails.get(key, 0) + 1
        mean = lambda key: round(sum(float(r.get(key) or 0) for r in rows) / n, 3) if n else 0
        summary.append({"job": jid, "label": label, "scene": scene, "robot": robot, "command": command, "n": n, "success": k,
                        "rate": round(k / n, 4) if n else 0, "ci95": [round(lo, 3), round(hi, 3)], "replans_mean": mean("replans"),
                        "sim_s_mean": mean("sim_s"), "llm_calls_mean": mean("llm_calls"), "cost_usd_mean": mean("cost_usd"), "failures": fails})
    (out / "summary.json").write_text(json.dumps({"llm": a.llm, "noise_px": list(a.noise), "jobs": summary}, indent=2))
    lines = ["| job | arm | n | solved | 95% CI | sim s | failures |", "|---|---|---|---|---|---|---|"]
    for r in summary:
        lines.append(f"| {r['label']} | {r['robot']} | {r['n']} | {r['success']} | {r['ci95'][0]:.0%}-{r['ci95'][1]:.0%} | {r['sim_s_mean']:.1f} | "
                     + "; ".join(f"{v}x {k}" for k, v in r["failures"].items()) + " |")
    total_n, total_k = sum(r["n"] for r in summary), sum(r["success"] for r in summary)
    lines.append(f"\ntotal: {total_k} / {total_n}")
    (out / "summary.md").write_text("\n".join(lines) + "\n")
    print("\n" + "\n".join(lines))


if __name__ == "__main__":
    main()
