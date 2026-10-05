from types import SimpleNamespace

from dooms.advisor import JevAdvisor, RuleAdvisor, make_advisor
from dooms.llm.base import Usage
from dooms.llm.jev_client import Answer, parse_answers
from dooms.monitor import Verdict


class FakeJev:
    def __init__(self, answers):
        self.answers, self.usage = answers, Usage()

    def decide(self, *, agent, state, questions):
        return {k: Answer(self.answers[k], 0.9, {}) for k in questions}


RES = SimpleNamespace(success=True, reason="converged", sim_seconds=2.0, gripper_width=0.0004)
CTX = dict(name="grasp", actions=["close"], res=RES, holding=False, expect_grasp=True)


def test_rules_keep_original_recovery():
    r = RuleAdvisor()
    assert r.recovery("x", regrounds_used=0, max_regrounds=2) == "reground"
    assert r.recovery("x", regrounds_used=2, max_regrounds=2) == "replan"


def test_shadow_never_changes_decision_but_records():
    a = JevAdvisor(FakeJev({"subtask_succeeded": True, "strategy": "give_up"}), "shadow")
    assert a.verdict(Verdict(False, "missed"), **CTX).ok is False
    assert a.recovery("f", regrounds_used=0, max_regrounds=2) == "reground"
    assert [r["kind"] for r in a.shadow] == ["verdict", "recovery"] and a.shadow[0]["jev_ok"] is True


def test_live_modes_and_hard_caps():
    a = JevAdvisor(FakeJev({"subtask_succeeded": True, "strategy": "reground"}), "both")
    assert a.verdict(Verdict(False, "missed"), **CTX).ok is True
    assert a.recovery("f", regrounds_used=2, max_regrounds=2) == "replan"          # cap beats Jev
    assert JevAdvisor(FakeJev({"strategy": "give_up"}), "recovery").recovery("f", regrounds_used=0, max_regrounds=2) == "give_up"


def test_min_confidence_falls_back_to_rules():
    a = JevAdvisor(FakeJev({"subtask_succeeded": True}), "monitor", min_confidence=0.95)
    assert a.verdict(Verdict(False, "missed"), **CTX).ok is False


def test_parse_answers_shapes():
    q = {"s": {"type": "choice"}}
    raw = {"s": {"type": "choice", "choice": "replan", "confidence": 0.8, "probabilities": {"replan": 0.8}}}
    assert parse_answers(raw, q)["s"].value == "replan"
    assert parse_answers({"answers": raw}, q)["s"].confidence == 0.8


def test_make_advisor_default_is_rules():
    assert make_advisor({"pipeline": {}}).name == "rules"
