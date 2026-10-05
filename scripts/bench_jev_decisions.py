#!/usr/bin/env python
"""Offline, simulator-free benchmark of the typed decisions: Jev vs the rule-based advisor (vs Claude, opt-in).

  python scripts/bench_jev_decisions.py [--repeat 3] [--claude]     (--claude makes paid Bedrock calls)

Recovery cases are hand-labelled (failure text -> the sensible strategy). Verdict cases replay the recorded subtask
logs of earlier runs (all successes) plus perturbed copies with a known label (grasp closed on nothing, dropped...)."""
import argparse
import json
import statistics as st
import time
from pathlib import Path

from pydantic import BaseModel

from dooms import ROOT
from dooms.advisor import RECOVERY_Q, VERDICT_Q, RuleAdvisor, recovery_state, verdict_state
from dooms.config import load_config
from dooms.llm.jev_client import JevClient

RECOVERY_CASES = [  # (failure, regrounds_used, label)
    ("grounding failed: no keypoint returned for bottle_cap", 0, "reground"),
    ("grasp missed: gripper closed to 0.4 mm on nothing", 0, "reground"),
    ("grasp missed: gripper closed to 1.1 mm on nothing", 1, "replan"),
    ("subtask 'approach_above' did not finish (timeout after 10.0s)", 0, "reground"),
    ("subtask 'move_over' did not finish (timeout after 10.0s)", 1, "replan"),
    ("the held object was dropped during the motion", 0, "replan"),
    ("the held object was dropped during the motion", 1, "replan"),
    ("subtask 'place_down_on_contact' did not finish (timeout after 10.0s)", 0, "reground"),
    ("grounding failed: depth is invalid at the pointed pixel", 0, "reground"),
    ("grounding failed: depth is invalid at the pointed pixel", 2, "replan"),
    ("grasp missed: gripper closed to 0.0 mm on nothing", 2, "replan"),
    ("episode time budget exhausted: 240 s of simulated time used and the task is not finished", 1, "give_up"),
]


def verdict_cases():
    cases = []
    for p in sorted((ROOT / "runs").glob("*/episodes.jsonl")):
        for line in p.read_text().splitlines():
            for s in json.loads(line)["subtask_log"][:3]:
                cases.append((s["name"], ["close"] if "grasp" in s["name"] else [], True, s["gripper_mm"], True, False, True))
    cases = cases[:12]
    for name, acts, mm, hold, label in [
            ("grasp_from_above", ["close"], 0.4, False, False), ("grasp_from_above", ["close"], 2.0, False, False),
            ("grasp_from_above", ["close"], 22.0, False, True), ("grasp_from_above", ["close"], 41.0, False, True),
            ("lift_held", [], 0.5, True, False), ("move_over", [], 0.3, True, False), ("move_over", [], 23.0, True, True),
            ("release_and_retract", ["open"], 70.0, True, True), ("approach_above", ["open"], 70.0, False, True)]:
        cases.append((name, acts, True, mm, hold, False, label))
    return cases


class Res:
    def __init__(self, ok, mm):
        self.success, self.reason, self.sim_seconds, self.gripper_width = ok, "converged", 3.0, mm / 1000


def run_jev(jev, repeat):
    rows = {"recovery": [], "verdict": []}
    for _ in range(repeat):
        for fail, used, label in RECOVERY_CASES:
            t = time.time()
            a = jev.decide(agent="recovery", state=recovery_state(fail, used, 0, 60, 30), questions=RECOVERY_Q)["strategy"]
            rows["recovery"].append((str(a.value) == label, time.time() - t, a.confidence))
        for name, acts, conv, mm, hold, expect_not, label in verdict_cases():
            t = time.time()
            a = jev.decide(agent="monitor", state=verdict_state(name, acts, Res(conv, mm), hold, True),
                           questions=VERDICT_Q)["subtask_succeeded"]
            rows["verdict"].append((bool(a.value) == label, time.time() - t, a.confidence))
    return rows


def run_rules():
    rule = RuleAdvisor()
    rec = [(rule.recovery(f, regrounds_used=u, max_regrounds=2) == lab) for f, u, lab in RECOVERY_CASES]
    return sum(rec) / len(rec)


def run_claude(repeat):
    from dooms.llm.bedrock_client import BedrockClient
    cl = BedrockClient(load_config()["bedrock"])

    class R(BaseModel):
        strategy: str

    class V(BaseModel):
        subtask_succeeded: bool
    rows = {"recovery": [], "verdict": []}
    for _ in range(repeat):
        for fail, used, label in RECOVERY_CASES:
            t = time.time()
            out = cl.structured(agent="decision", system="Choose one of: reground, replan, give_up. " + json.dumps(RECOVERY_Q),
                                content=[recovery_state(fail, used, 0, 60, 30)], schema=R, max_tokens=100)
            rows["recovery"].append((out.strategy == label, time.time() - t, 1.0))
        for name, acts, conv, mm, hold, _, label in verdict_cases():
            t = time.time()
            out = cl.structured(agent="decision", system=VERDICT_Q["subtask_succeeded"]["instructions"],
                                content=[verdict_state(name, acts, Res(conv, mm), hold, True)], schema=V, max_tokens=100)
            rows["verdict"].append((out.subtask_succeeded == label, time.time() - t, 1.0))
    return rows, cl.usage.cost(load_config()["bedrock"]["pricing"])


def show(label, rows, extra=""):
    for k, v in rows.items():
        lat = sorted(x[1] for x in v)
        print(f"| {label} | {k} | {len(v)} | {sum(x[0] for x in v) / len(v):.0%} | {st.median(lat) * 1000:.0f} | "
              f"{lat[int(0.95 * (len(lat) - 1))] * 1000:.0f} | {extra} |")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repeat", type=int, default=3)
    ap.add_argument("--claude", action="store_true", help="also run Claude on Bedrock (paid)")
    a = ap.parse_args()
    cfg = load_config()
    jev = JevClient(cfg["jev"])
    print("| decider | decision | n | accuracy | p50 ms | p95 ms | cost $ |\n|---|---|---|---|---|---|---|")
    show("jev", run_jev(jev, a.repeat), f"{jev.usage.cost(cfg['jev']['pricing']):.5f}")
    print(f"| rules | recovery | {len(RECOVERY_CASES)} | {run_rules():.0%} | <1 | <1 | 0 |")
    if a.claude:
        rows, cost = run_claude(a.repeat)
        show("claude", rows, f"{cost:.4f}")


if __name__ == "__main__":
    main()
