"""Lightweight parsing of a typed command into (pick object, destination) for the scripted planner and for
ground-truth scoring of free-form commands. The real agents (Bedrock) never see this: they get the raw text."""
from __future__ import annotations

import re

from .task import SuccessPredicate, TaskSpec

_WORDS = [
    ("cube_red", r"\bred\b(?:\s+(?:cube|block))?|\bred\s+one\b"),
    ("cube_blue", r"\bblue\b(?:\s+(?:cube|block))?|\bblue\s+one\b"),
    ("bottle", r"\bbottle\b"),
    ("box", r"\b(?:box|tray|bin)\b"),
]


_OUTSIDE = r"\b(?:outside(?: of)?|out of|beside|next to|away from|on the table|on the free|free (?:spot|space))\b"


def parse_command(text: str, task: TaskSpec) -> tuple[str, str] | None:
    present = {o.name for o in task.objects}
    hits = []
    for name, pat in _WORDS:
        if name not in present:
            continue
        m = re.search(pat, text.lower())
        if m:
            hits.append((m.start(), name))
    order = [n for _, n in sorted(hits)]
    if re.search(_OUTSIDE, text.lower()):                       # "put X outside the box", "take X out of the box"...
        movable = [n for n in order if n != "box"]
        return (movable[0], "table") if movable else None
    if len(order) < 2 or order[0] == "box":
        return None
    return order[0], order[1]


def predicate_for(pick: str, dest: str) -> SuccessPredicate:
    if dest == "table":
        return SuccessPredicate(type="outside", object=pick, target="box")
    return SuccessPredicate(type="inside" if dest == "box" else "on_top", object=pick, target=dest)


def task_for_command(task: TaskSpec, text: str) -> tuple[TaskSpec, tuple[str, str] | None]:
    """Copy of `task` carrying the typed instruction; free-form scenes get a ground-truth predicate if parsable."""
    pair = parse_command(text, task)
    updates: dict = {"instruction": text}
    if not task.success and pair:
        updates["success"] = [predicate_for(*pair)]
    return task.model_copy(update=updates), pair
