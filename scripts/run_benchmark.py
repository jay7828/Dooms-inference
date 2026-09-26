#!/usr/bin/env python
"""python scripts/run_benchmark.py --llm bedrock --tasks put_bottle_in_box stack_cubes --seeds 20 --variants baseline oracle_grounding"""
import argparse
from pathlib import Path

from dooms import ROOT
from dooms.bench.ablations import ABLATIONS
from dooms.bench.runner import run_benchmark
from dooms.task import list_tasks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--llm", default="bedrock", choices=["bedrock", "scripted"])
    ap.add_argument("--model", default=None)
    ap.add_argument("--tasks", nargs="+", default=list_tasks(), choices=list_tasks())
    ap.add_argument("--seeds", type=int, default=10, help="number of seeds (0..N-1)")
    ap.add_argument("--seed-start", type=int, default=0)
    ap.add_argument("--variants", nargs="+", default=["baseline"], choices=sorted(ABLATIONS))
    ap.add_argument("--noise", type=float, nargs=2, default=(6.0, 1.0))
    ap.add_argument("--out", default=None)
    ap.add_argument("--no-artifacts", action="store_true", help="skip per-episode images/videos")
    a = ap.parse_args()
    out = Path(a.out) if a.out else ROOT / "runs" / f"bench_{a.llm}"
    seeds = list(range(a.seed_start, a.seed_start + a.seeds))
    rows = run_benchmark(a.tasks, seeds, a.variants, a.llm, out, a.model, tuple(a.noise), not a.no_artifacts)
    print(f"\nresults in {out}")
    print((out / "summary.md").read_text())


if __name__ == "__main__":
    main()
