"""Skill library: reusable, object-agnostic subtask recipes.

A skill is a controller recipe written with ROLES (obj, dest, ...) instead of concrete keypoint names, so
"grasp_from_above" learned on a bottle also serves a cube. Skills live as JSON files (one per skill) in a
directory; the Skill Generator sees them and either reuses one (binding roles to keypoints) or creates a new one.
"""
from __future__ import annotations

import json
import os
import re
import tempfile
import threading
import time
from pathlib import Path

from pydantic import BaseModel, Field

from .llm.schemas import ControllerSpec, ParamSpec

_SUFFIXES = ("_normal", "_norm", "_axis")
NAME_RE = re.compile(r"^[a-z][a-z0-9_]{2,48}$")


class Skill(BaseModel):
    name: str
    description: str
    roles: list[str]
    controllers: list[ControllerSpec]              # source/target use role names instead of keypoints
    params: list[ParamSpec]
    defaults: dict[str, float] = Field(default_factory=dict)   # values that worked last time (hints)
    uses: int = 0
    successes: int = 0
    created: str = ""


def map_name(name: str | None, mapping: dict[str, str]) -> str | None:
    """Rename keypoints inside a point/vector name (also handles <kp>_normal/_axis and A__to__B)."""
    if not name:
        return name
    if "__to__" in name:
        a, b = name.split("__to__", 1)
        return f"{map_name(a, mapping)}__to__{map_name(b, mapping)}"
    if name in mapping:
        return mapping[name]
    for suf in _SUFFIXES:
        if name.endswith(suf) and name[: -len(suf)] in mapping:
            return mapping[name[: -len(suf)]] + suf
    return name


def remap_controllers(controllers: list[ControllerSpec], mapping: dict[str, str]) -> list[ControllerSpec]:
    return [c.model_copy(update={"source": map_name(c.source, mapping), "target": map_name(c.target, mapping)})
            for c in controllers]


def instantiate(skill: Skill, bindings: dict[str, str]) -> list[ControllerSpec]:
    return remap_controllers(skill.controllers, bindings)


def generalize(controllers: list[ControllerSpec], bindings: dict[str, str]) -> list[ControllerSpec]:
    return remap_controllers(controllers, {kp: role for role, kp in bindings.items()})


class SkillLibrary:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self.skills: dict[str, Skill] = {}
        self.reload()

    # ---------------------------------------------------------------- storage
    def reload(self) -> None:
        with self._lock:
            self.skills = {}
            for f in sorted(self.path.glob("*.json")):
                try:
                    s = Skill.model_validate_json(f.read_text())
                    self.skills[s.name] = s
                except Exception:  # noqa: BLE001 - a corrupt file must not break planning
                    continue

    def _write(self, s: Skill) -> None:
        fd, tmp = tempfile.mkstemp(dir=self.path, suffix=".tmp")
        with os.fdopen(fd, "w") as f:
            f.write(s.model_dump_json(indent=2))
        os.replace(tmp, self.path / f"{s.name}.json")

    def names(self) -> list[str]:
        return sorted(self.skills)

    def get(self, name: str) -> Skill | None:
        return self.skills.get(name)

    def add(self, s: Skill) -> None:
        with self._lock:
            s.created = s.created or time.strftime("%Y-%m-%d %H:%M")
            self.skills[s.name] = s
            self._write(s)

    def record(self, name: str, success: bool, values: dict[str, float] | None = None) -> None:
        with self._lock:
            s = self.skills.get(name)
            if s is None:
                return
            s.uses += 1
            s.successes += int(success)
            if success and values:
                s.defaults.update({k: v for k, v in values.items() if k in {p.name for p in s.params}})
            self._write(s)

    def clear(self) -> int:
        with self._lock:
            n = len(self.skills)
            for f in self.path.glob("*.json"):
                f.unlink()
            self.skills = {}
            return n

    # ---------------------------------------------------------------- views
    @staticmethod
    def _ctrl_line(c: ControllerSpec) -> str:
        args = [x for x in (c.source, c.target, c.axis, c.action, c.param) if x]
        st = f" stage {c.stage}" if c.stage else ""
        return f"{c.type}({', '.join(args)}) p{c.priority}{st}"

    def listing(self) -> str:
        if not self.skills:
            return "STORED SKILLS: none yet. Create new skills (with a recipe) for every subtask."
        out = ["STORED SKILLS (reuse one whenever it fits the subtask: give its name and bind its roles to keypoints; "
               "only create a new skill when none fits):"]
        for s in self.skills.values():
            rate = f"{s.successes}/{s.uses} successful" if s.uses else "not yet used"
            out.append(f"- {s.name}(roles: {', '.join(s.roles)}) - {s.description} [{rate}]")
            out.append("    controllers: " + "; ".join(self._ctrl_line(c) for c in s.controllers))
            if s.defaults:
                out.append("    values that worked: " + ", ".join(f"{k}={v:g}" for k, v in s.defaults.items()))
        return "\n".join(out)

    def api(self) -> list[dict]:
        return [{"name": s.name, "description": s.description, "roles": s.roles, "uses": s.uses,
                 "successes": s.successes, "created": s.created, "defaults": s.defaults,
                 "controllers": [self._ctrl_line(c) for c in s.controllers]} for s in self.skills.values()]
