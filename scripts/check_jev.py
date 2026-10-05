#!/usr/bin/env python
"""One tiny Jev call: verifies JEV_AI_API_KEY (jev-ai.pro) and prints the raw response so the parser can be checked."""
import json

from dooms.advisor import RECOVERY_Q, VERDICT_Q
from dooms.config import load_config
from dooms.llm.jev_client import JevClient, parse_answers


def main():
    cfg = load_config()["jev"]
    c = JevClient(cfg)
    import urllib.request
    state = "Failure: grasp missed: gripper closed to 0.4 mm on nothing\nRe-looks already tried for this plan: 0"
    body = {"model": cfg["model"], "state": state, "questions": RECOVERY_Q}
    req = urllib.request.Request(cfg["endpoint"], data=json.dumps(body).encode(),
                                 headers={"Authorization": f"Bearer {c.api_key}", "Content-Type": "application/json"})
    raw = json.loads(urllib.request.urlopen(req, timeout=30).read())
    print(json.dumps(raw, indent=2)[:1500])
    print("\nparsed:", parse_answers(raw, RECOVERY_Q))
    a = c.decide(agent="check", state="Subtask: close_gripper\nGripper opening after: 0.4 mm", questions=VERDICT_Q)
    print("verdict:", a, f"latency {c.usage.latency_s:.2f}s")


if __name__ == "__main__":
    main()
