#!/usr/bin/env python
"""Run one episode: python scripts/run_task.py --task put_bottle_in_box --seed 0 --llm bedrock"""
import argparse
import json
from pathlib import Path

from dooms import ROOT
from dooms.bench.ablations import ABLATIONS
from dooms.config import deep_update, load_config
from dooms.llm.factory import make_llm
from dooms.pipeline import Pipeline
from dooms.sim.mujoco_env import MuJoCoEnv
from dooms.task import list_tasks, load_task


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--task", default="put_bottle_in_box", choices=list_tasks())
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--llm", default="bedrock", choices=["bedrock", "scripted"])
    ap.add_argument("--model", default=None, help="Bedrock model / inference-profile ID (default: configs/bedrock.yaml)")
    ap.add_argument("--variant", default="baseline", choices=sorted(ABLATIONS))
    ap.add_argument("--noise", type=float, nargs=2, default=(6.0, 1.0), help="scripted VLM pixel noise (coarse fine)")
    ap.add_argument("--out", default=None, help="run directory (default runs/<task>_<seed>)")
    ap.add_argument("--skills", default="skills/library", help="skill library directory (persistent; 'none' disables)")
    a = ap.parse_args()

    cfg = deep_update(load_config(), ABLATIONS[a.variant])
    cfg = deep_update(cfg, {"pipeline": {"skill_library_dir": None if a.skills == "none" else a.skills}})
    task = load_task(a.task)
    env = MuJoCoEnv(task, cfg)
    llm = make_llm(a.llm, cfg, task, env, a.model, tuple(a.noise), a.seed)
    out = Path(a.out) if a.out else ROOT / "runs" / f"{a.task}_{a.llm}_{a.variant}_{a.seed}"
    res = Pipeline(env, llm, cfg, task, run_dir=out).run(a.seed)
    for l in res.subtask_log:
        print(f"  [{l['plan']}] {l['subtask']}. {l['name']:<34} {'ok ' if l['ok'] else 'FAIL'} {l['sim_s']:>5}s  {l['verdict']}")
    print(json.dumps({k: v for k, v in res.__dict__.items() if k not in ("subtask_log",)}, indent=2, default=float))
    if res.skills_new or res.skills_reused:
        print(f"skills: new {res.skills_new} | reused {res.skills_reused}")
    print(f"\n{'SUCCESS' if res.success else 'FAILURE'}  -> artifacts in {out}")


if __name__ == "__main__":
    main()
