"""Typed decision points of the pipeline: did a subtask succeed, and how to recover from a failure.

RuleAdvisor is the original hand-written behaviour. JevAdvisor asks TypeSafe Jev the same questions. In shadow mode
the rules decide and Jev's answer is only recorded, so one real run yields rule-vs-Jev agreement at no risk."""
from __future__ import annotations

from .monitor import Verdict

RECOVERY = ("reground", "replan", "give_up")

VERDICT_Q = {"subtask_succeeded": {
    "type": "noul",
    "instructions": "The robot subtask finished and left the world in the state its goal requires: it reached its "
                    "targets, a grasp holds an object between the fingers, a held object was not dropped."}}

RECOVERY_Q = {"strategy": {
    "type": "choice",
    "instructions": "Pick the cheapest recovery likely to work after this robot manipulation failure.",
    "criteria": {
        "reground": "The plan is probably fine but a 3D target was mislocated: go home, look again, re-run the same plan.",
        "replan": "The plan itself is probably wrong or the scene changed (object dropped, knocked over, moved): "
                  "ask the planner for a new plan from the current scene.",
        "give_up": "No recovery can help: the time budget is exhausted or the task is physically impossible."}}}


def verdict_state(name: str, script_actions: list[str], res, holding: bool, expect_grasp: bool) -> str:
    return (f"Subtask: {name}\nGripper commands in this subtask: {', '.join(script_actions) or 'none'}\n"
            f"Controllers converged: {'yes' if res.success else 'no, ' + str(res.reason)}\n"
            f"Simulated seconds used: {res.sim_seconds:.1f}\nGripper opening after: {res.gripper_width * 1000:.1f} mm "
            f"(a closed gripper with an object inside stays wider than 8 mm; below that it holds nothing)\n"
            f"Robot was holding an object before this subtask: {'yes' if holding else 'no'}\n"
            f"A grasp is expected in this plan: {'yes' if expect_grasp else 'no (the gripper is only pushing)'}")


def recovery_state(failure: str, regrounds_used: int, replans_used: int, gripper_mm: float, sim_s: float) -> str:
    return (f"Failure: {failure}\nRe-looks already tried for this plan: {regrounds_used}\n"
            f"Replans already used: {replans_used}\nGripper opening: {gripper_mm:.0f} mm\n"
            f"Simulated seconds spent so far: {sim_s:.0f} of 240")


class RuleAdvisor:
    name = "rules"
    usage = None

    def verdict(self, rule: Verdict, **ctx) -> Verdict:
        return rule

    def recovery(self, failure: str, *, regrounds_used: int, max_regrounds: int, **ctx) -> str:
        return "reground" if regrounds_used < max_regrounds else "replan"


class JevAdvisor(RuleAdvisor):
    """mode: 'monitor' | 'recovery' | 'both' make Jev decide; 'shadow' records Jev beside the rules."""

    def __init__(self, jev, mode: str, min_confidence: float = 0.0):
        self.jev, self.mode, self.min_conf = jev, mode, min_confidence
        self.name = f"jev_{mode}"
        self.usage = jev.usage
        self.shadow: list[dict] = []        # per-decision rule-vs-Jev records, read into the episode log

    @property
    def _live_verdict(self):
        return self.mode in ("monitor", "both")

    @property
    def _live_recovery(self):
        return self.mode in ("recovery", "both")

    def verdict(self, rule: Verdict, *, name, actions, res, holding, expect_grasp, **ctx) -> Verdict:
        if not (self._live_verdict or self.mode == "shadow"):
            return rule
        a = self.jev.decide(agent="monitor", state=verdict_state(name, actions, res, holding, expect_grasp),
                            questions=VERDICT_Q)["subtask_succeeded"]
        ok = bool(a.value)
        self.shadow.append({"kind": "verdict", "subtask": name, "rule_ok": rule.ok, "jev_ok": ok,
                            "confidence": a.confidence})
        if self.mode == "shadow" or a.confidence < self.min_conf or ok == rule.ok:
            return rule
        return Verdict(ok, rule.reason if not ok else "")

    def recovery(self, failure: str, *, regrounds_used: int, max_regrounds: int, replans_used: int = 0,
                 gripper_mm: float = 0.0, sim_s: float = 0.0, **ctx) -> str:
        rule = super().recovery(failure, regrounds_used=regrounds_used, max_regrounds=max_regrounds)
        if not (self._live_recovery or self.mode == "shadow"):
            return rule
        a = self.jev.decide(agent="recovery", state=recovery_state(failure, regrounds_used, replans_used, gripper_mm, sim_s),
                            questions=RECOVERY_Q)["strategy"]
        choice = str(a.value)
        self.shadow.append({"kind": "recovery", "failure": failure[:120], "rule": rule, "jev": choice,
                            "confidence": a.confidence})
        if self.mode == "shadow" or choice not in RECOVERY or a.confidence < self.min_conf:
            return rule
        if choice == "reground" and regrounds_used >= max_regrounds:
            return "replan"                                    # hard caps stay in force
        return choice


def make_advisor(cfg: dict) -> RuleAdvisor:
    mode = cfg.get("pipeline", {}).get("advisor", "rules")
    if mode == "rules":
        return RuleAdvisor()
    if mode not in ("monitor", "recovery", "both", "shadow"):
        raise ValueError(f"unknown pipeline.advisor '{mode}' (rules | monitor | recovery | both | shadow)")
    from .llm.jev_client import JevClient
    return JevAdvisor(JevClient(cfg.get("jev", {})), mode, cfg.get("jev", {}).get("min_confidence", 0.0))
