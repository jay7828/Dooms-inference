"""Agent base: prompt loading, forced-JSON call, validation with feedback retry, trace."""
from __future__ import annotations

from pathlib import Path

from pydantic import BaseModel, ValidationError

from ..llm.base import Block, LLMClient
from ..robots import get_profile

PROMPT_DIR = Path(__file__).resolve().parents[1] / "llm" / "prompts"


class AgentError(RuntimeError):
    pass


class Agent:
    name = "agent"
    schema: type[BaseModel]

    def __init__(self, llm: LLMClient, bedrock_cfg: dict):
        self.llm = llm
        self.acfg = (bedrock_cfg.get("agents", {}) or {}).get(self.name, {}) or {}
        self.robot = get_profile(bedrock_cfg.get("robot"))
        self.system = (PROMPT_DIR / f"{self.name}.md").read_text()
        if self.name in ("task_decomposer", "skill_generator", "parameter_setter"):
            self.system += "\n" + self.robot.spec_text()
        self.trace: list[dict] = []
        self.emit = None    # optional callable(dict) for live UIs
        self.temp_boost = 0.0   # >0 on retries so a deterministic model does not repeat the same wrong answer

    def call(self, content: list[Block], validate=None, attempts: int = 2, label: str = "") -> BaseModel:
        last: Exception | None = None
        if self.emit:
            self.emit({"type": "agent_start", "agent": self.name, "label": label})
        for i in range(attempts):
            try:
                out = self.llm.structured(agent=self.name, system=self.system, content=content, schema=self.schema,
                                          max_tokens=self.acfg.get("max_tokens", 2000),
                                          temperature=min(1.0, self.acfg.get("temperature", 0.0) + self.temp_boost))
                if validate is not None:
                    out = validate(out) or out
                self.trace.append({"agent": self.name, "label": label, "attempt": i, "output": out.model_dump()})
                if self.emit:
                    self.emit({"type": "agent", "agent": self.name, "label": label, "output": out.model_dump()})
                return out
            except (ValidationError, ValueError, KeyError) as e:
                last = e
                self.trace.append({"agent": self.name, "label": label, "attempt": i, "rejected": str(e)[:800]})
                if self.emit:
                    self.emit({"type": "agent_rejected", "agent": self.name, "label": label, "reason": str(e)[:300]})
                content = list(content) + [f"\n\nYour previous answer was rejected: {str(e)[:800]}\n"
                                           "Correct it and answer again."]
        raise AgentError(f"{self.name}: no valid answer after {attempts} attempts: {last}")
