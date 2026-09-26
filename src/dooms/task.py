"""Task specification (loaded from configs/tasks/*.yaml)."""
from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from . import CONFIG_DIR
from .config import load_yaml


class ObjectSpec(BaseModel):
    name: str
    type: Literal["bottle", "tray", "cube"]
    x_range: tuple[float, float]
    y_range: tuple[float, float]
    yaw_range: tuple[float, float] = (0.0, 0.0)
    color: tuple[float, float, float] = (0.5, 0.5, 0.5)
    size: float = 0.04            # cube edge length (m)
    lying: bool = False           # bottle starts knocked over, lying on its side


class SuccessPredicate(BaseModel):
    type: Literal["inside", "on_top", "outside"]
    object: str
    target: str


class TaskSpec(BaseModel):
    name: str
    instruction: str
    objects: list[ObjectSpec]
    # symbolic object keypoints the agents may request: name -> description
    keypoints: dict[str, str]
    # free-text facts handed to the Parameter Setter (approximate object sizes etc.)
    scene_context: str = ""
    success: list[SuccessPredicate]
    min_object_separation: float = 0.16
    seed_variation: bool = True


def load_task(name_or_path: str) -> TaskSpec:
    p = Path(name_or_path)
    if not p.exists():
        p = CONFIG_DIR / "tasks" / f"{name_or_path}.yaml"
    return TaskSpec(**load_yaml(p))


def list_tasks() -> list[str]:
    return sorted(p.stem for p in (CONFIG_DIR / "tasks").glob("*.yaml"))
