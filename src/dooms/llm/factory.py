from __future__ import annotations

from ..task import TaskSpec
from .base import LLMClient


def make_llm(kind: str, cfg: dict, task: TaskSpec | None = None, env=None, model: str | None = None,
             pixel_noise: tuple[float, float] = (6.0, 1.0), seed: int = 0,
             pair: tuple[str, str] | None = None, credentials: dict | None = None) -> LLMClient:
    if kind == "bedrock":
        from .bedrock_client import BedrockClient
        return BedrockClient(cfg["bedrock"], model_override=model, credentials=credentials)
    if kind == "scripted":
        from .scripted import ScriptedLLM
        return ScriptedLLM(task, env, pixel_noise=pixel_noise, seed=seed, pair=pair)
    raise ValueError(f"unknown llm kind '{kind}' (bedrock | scripted)")
