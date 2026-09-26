"""YAML config + .env loading."""
from __future__ import annotations

import copy
from pathlib import Path
from typing import Any

import yaml
import os

from dotenv import dotenv_values

from . import CONFIG_DIR, DATA_DIR


_LOADED_FROM_DOTENV: dict[str, str] = {}


def load_env() -> None:
    """Load .env into os.environ. Variables exported in the shell win; values we loaded from .env earlier are
    refreshed when the file changes (so editing .env takes effect without restarting). Blank values are ignored
    so boto3's normal credential chain still works when a key is left empty."""
    for k, v in dotenv_values(DATA_DIR / ".env").items():
        if not v:
            continue
        if k not in os.environ or os.environ[k] == _LOADED_FROM_DOTENV.get(k):
            os.environ[k] = v
            _LOADED_FROM_DOTENV[k] = v


def load_yaml(path: str | Path) -> dict[str, Any]:
    with open(path) as f:
        return yaml.safe_load(f) or {}


def deep_update(base: dict, patch: dict) -> dict:
    out = copy.deepcopy(base)
    for k, v in patch.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_update(out[k], v)
        else:
            out[k] = v
    return out


def load_config(overrides: dict | None = None) -> dict[str, Any]:
    cfg = load_yaml(CONFIG_DIR / "default.yaml")
    cfg["bedrock"] = load_yaml(CONFIG_DIR / "bedrock.yaml")
    return deep_update(cfg, overrides or {})
