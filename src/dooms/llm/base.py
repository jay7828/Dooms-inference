"""LLM client interface, usage tracking, and a scriptable mock for tests."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Callable, Protocol, Union

from pydantic import BaseModel


@dataclass
class Image:
    png: bytes


Block = Union[str, Image]


@dataclass
class CallRecord:
    agent: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_s: float
    ok: bool = True


@dataclass
class Usage:
    calls: list[CallRecord] = field(default_factory=list)

    def add(self, rec: CallRecord) -> None:
        self.calls.append(rec)

    @property
    def n_calls(self) -> int:
        return len(self.calls)

    @property
    def input_tokens(self) -> int:
        return sum(c.input_tokens for c in self.calls)

    @property
    def output_tokens(self) -> int:
        return sum(c.output_tokens for c in self.calls)

    @property
    def latency_s(self) -> float:
        return sum(c.latency_s for c in self.calls)

    def by_agent(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for c in self.calls:
            out[c.agent] = out.get(c.agent, 0) + 1
        return out

    def cost(self, pricing: dict) -> float:
        return (self.input_tokens * pricing["input_per_m"] + self.output_tokens * pricing["output_per_m"]) / 1e6


class LLMClient(Protocol):
    usage: Usage

    def structured(self, *, agent: str, system: str, content: list[Block], schema: type[BaseModel],
                   max_tokens: int = 2000, temperature: float = 0.0) -> BaseModel:
        """One model call whose output is forced into `schema` (Bedrock tool-use)."""


class MockLLM:
    """handlers[agent](content, schema) -> BaseModel | dict. Records calls like the real client."""

    def __init__(self, handlers: dict[str, Callable]):
        self.handlers = handlers
        self.usage = Usage()
        self.log: list[tuple[str, list[Block]]] = []

    def structured(self, *, agent, system, content, schema, max_tokens=2000, temperature=0.0):
        t = time.time()
        self.log.append((agent, content))
        out = self.handlers[agent](content, schema)
        if isinstance(out, dict):
            out = schema.model_validate(out)
        self.usage.add(CallRecord(agent, "mock", 0, 0, time.time() - t))
        return out
