"""Benchmark runner: variants x tasks x seeds -> episodes.jsonl (resumable) -> report."""
from __future__ import annotations

import json
import time
from dataclasses import asdict
from pathlib import Path

from ..config import deep_update, load_config
from ..llm.factory import make_llm
from ..pipeline import Pipeline
from ..sim.mujoco_env import MuJoCoEnv
from ..task import load_task
from .ablations import ABLATIONS
from .report import write_report


def run_benchmark(tasks: list[str], seeds: list[int], variants: list[str], llm_kind: str, out_dir: Path,
                  model: str | None = None, pixel_noise: tuple[float, float] = (6.0, 1.0),
                  save_episodes: bool = True, use_skills: bool = True, log=print) -> list[dict]:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    ep_file = out_dir / "episodes.jsonl"
    done = set()
    if ep_file.exists():
        for l in ep_file.read_text().splitlines():
            if l.strip():
                e = json.loads(l)
                done.add((e["variant"], e["task"], e["seed"]))
    for variant in variants:
        cfg = deep_update(load_config(), ABLATIONS[variant])
        if cfg["pipeline"].get("skill_library_dir") == "__off__":
            cfg = deep_update(cfg, {"pipeline": {"skill_library_dir": None}})
        elif use_skills and cfg["pipeline"].get("skill_library_dir") is None:
            cfg = deep_update(cfg, {"pipeline": {"skill_library_dir": str((out_dir / "skills" / variant).resolve())}})
        for tname in tasks:
            task = load_task(tname)
            todo = [s for s in seeds if (variant, tname, s) not in done]
            if not todo:
                continue
            env = MuJoCoEnv(task, cfg)
            shared = make_llm(llm_kind, cfg, task, env, model, pixel_noise) if llm_kind == "bedrock" else None
            for s in todo:
                llm = shared or make_llm(llm_kind, cfg, task, env, model, pixel_noise, seed=s)
                run_dir = out_dir / "episodes" / f"{variant}__{tname}__{s}" if save_episodes else None
                t0 = time.time()
                res = Pipeline(env, llm, cfg, task, run_dir=run_dir).run(s)
                rec = asdict(res) | {"variant": variant, "model": model or cfg["bedrock"]["default_model"],
                                     "llm_kind": llm_kind}
                with open(ep_file, "a") as f:
                    f.write(json.dumps(rec, default=float) + "\n")
                log(f"[{variant}] {tname} seed {s}: {'OK ' if res.success else 'FAIL'} "
                    f"subtasks {res.subtasks_ok}/{res.subtasks_total} calls={res.llm_calls} "
                    f"${res.cost_usd:.3f} {time.time() - t0:.0f}s {res.error[:80]}")
            env.close()
    return write_report(out_dir)
