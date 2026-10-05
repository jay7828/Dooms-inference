"""Jev AI ("System One", TypeSafe-compatible endpoint at jev-ai.pro) client: typed questions about a text state -> calibrated answers, no text generation.

Jev cannot write plans or read images, so it is used only for small typed decisions (see ../advisor.py)."""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass

from ..config import load_env
from .base import CallRecord, Usage

# Per the Jev AI docs: 429/502/503 are safe to retry; 504 and timeouts leave the outcome uncertain; 401/402/404/422 never retry.
TRANSIENT_HTTP = {429, 502, 503}
DEFAULT_ENDPOINT = "https://jev-ai.pro/api/v1/systemone"


@dataclass
class Answer:
    value: object                       # bool (noul) | str (choice) | float (score)
    confidence: float
    probabilities: dict


class JevClient:
    remote = True

    def __init__(self, jev_cfg: dict, api_key: str | None = None):
        load_env()
        self.cfg = jev_cfg
        self.api_key = api_key or os.environ.get("JEV_AI_API_KEY", "")
        if not self.api_key:
            raise RuntimeError("JEV_AI_API_KEY is not set (add it to .env). Run scripts/check_jev.py to test it.")
        self.usage = Usage()

    def decide(self, *, agent: str, state: str, questions: dict[str, dict]) -> dict[str, Answer]:
        body = {"model": self.cfg.get("model", "jev-latest"), "state": state, "questions": questions}
        retry = self.cfg.get("retry", {"max_attempts": 3, "base_delay_s": 0.5})
        for attempt in range(retry["max_attempts"]):
            t0 = time.time()
            req = urllib.request.Request(
                self.cfg.get("endpoint", DEFAULT_ENDPOINT), data=json.dumps(body).encode(),
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=self.cfg.get("timeout_s", 30)) as r:
                    raw = json.loads(r.read())
            except urllib.error.HTTPError as e:
                self.usage.add(CallRecord(agent, body["model"], 0, 0, time.time() - t0, ok=False))
                if e.code in TRANSIENT_HTTP and attempt < retry["max_attempts"] - 1:
                    time.sleep(_delay(e, retry["base_delay_s"] * 2 ** attempt))
                    continue
                raise RuntimeError(f"Jev HTTP {e.code}: {e.read()[:300].decode(errors='replace')}") from e
            except (urllib.error.URLError, TimeoutError) as e:      # outcome uncertain: do not blindly resend
                self.usage.add(CallRecord(agent, body["model"], 0, 0, time.time() - t0, ok=False))
                raise RuntimeError(f"Jev request failed: {e}") from e
            u = raw.get("usage", {})
            self.usage.add(CallRecord(agent, body["model"], u.get("input_tokens", 0), u.get("output_tokens", 0),
                                      time.time() - t0))
            return parse_answers(raw, questions)
        raise RuntimeError("unreachable")


def _delay(e: urllib.error.HTTPError, default: float) -> float:
    try:
        return min(float(e.headers.get("Retry-After", default)), 30.0)
    except (TypeError, ValueError):
        return default


def parse_answers(raw: dict, questions: dict) -> dict[str, Answer]:
    """Tolerant of the answers sitting at the top level or under 'answers'/'results'."""
    box = next((raw[k] for k in ("answers", "results", "result") if isinstance(raw.get(k), dict)), raw)
    out = {}
    for name, q in questions.items():
        a = box.get(name)
        if not isinstance(a, dict):
            raise ValueError(f"Jev response has no answer for '{name}': {str(raw)[:300]}")
        kind = q["type"]
        value = a.get(kind, a.get("answer", a.get("value")))
        if value is None:
            raise ValueError(f"Jev answer for '{name}' has no {kind} value: {a}")
        if kind == "noul":                  # docs: a noul answer is a probability 0-1 that the statement holds
            p = float(value)
            out[name] = Answer(p >= 0.5, float(a.get("confidence", abs(p - 0.5) * 2)), {"yes": p, "no": 1 - p})
            continue
        out[name] = Answer(value, float(a.get("confidence", 0.0)), a.get("probabilities") or {})
    return out
