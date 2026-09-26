"""Pydantic schemas: the typed contract between the four agents (also used as Bedrock tool schemas)."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ---- 01 Task Decomposer -------------------------------------------------------------------
class Subtask(BaseModel):
    id: int = Field(description="1-based order of execution")
    name: str = Field(description="short imperative name, e.g. 'Grasp the bottle'")
    description: str = Field(description="one sentence: what must be true when this subtask is done")


class Decomposition(BaseModel):
    observations: str = Field("", description="what you see that matters for the plan: the pose/state of the relevant "
                                             "objects (upright, lying on its side, inside the box, out of reach...)")
    feasible: bool = Field(True, description="false only if a top-down parallel-jaw gripper truly cannot do the task")
    reason: str = Field("", description="if not feasible: why, in one or two sentences")
    clears_obstacle: bool = Field(False, description="true when this plan ONLY removes an obstacle that blocks the task "
                                                     "(e.g. pushes the box aside); the original task is planned again afterwards")
    subtasks: list[Subtask] = Field(default_factory=list, description="empty only when not feasible")


# ---- 02 Skill Generator -------------------------------------------------------------------
class KeypointRequest(BaseModel):
    name: str = Field(description="keypoint name from the scene's keypoint vocabulary")
    description: str = ""


class ParamSpec(BaseModel):
    name: str = Field(description="symbolic parameter used by a controller, e.g. o_z, o_theta, f")
    description: str = Field(description="what it means physically, so a scene-aware agent can pick a number")
    unit: Literal["m", "deg", "N"]


class ControllerSpec(BaseModel):
    type: Literal["PosAlign", "AxisAlign", "YawAlign", "Force", "Gripper"]
    source: str | None = Field(None, description="PosAlign: point to move (eef_tcp or a held keypoint). "
                                                 "AxisAlign: vector to rotate, e.g. eef_z. YawAlign: eef_y")
    target: str | None = Field(None, description="PosAlign: static reference point. AxisAlign: reference vector")
    axis: str | None = Field(None, description="PosAlign: x|y|z. Force: x|y|z|-x|-y|-z")
    param: str | None = Field(None, description="name of the symbolic parameter that supplies the number")
    action: Literal["open", "close", "width"] | None = None
    priority: int = 1
    stage: int = 0


class SkillRecipe(BaseModel):
    subtask_id: int
    keypoints: list[KeypointRequest] = Field(description="object keypoints that must be grounded in the scene "
                                                         "(NOT eef_tcp / eef_z: those come from the robot)")
    controllers: list[ControllerSpec]
    params: list[ParamSpec] = Field(description="every symbolic parameter referenced by the controllers")


class SkillRecipes(BaseModel):
    recipes: list[SkillRecipe]


class SkillChoice(BaseModel):
    subtask_id: int
    skill_name: str = Field(description="name of a STORED skill to reuse, or a new snake_case name if you create one")
    role_bindings: dict[str, str] = Field(description="role name -> keypoint name, e.g. {\"obj\": \"bottle_cap\", "
                                                       "\"dest\": \"box_inside\"}. For a NEW skill, every object keypoint "
                                                       "used by its controllers must appear here with a role name of your choice")
    keypoints: list[KeypointRequest] = Field(default_factory=list, description="descriptions for keypoints you DEFINE "
                                             "(names not in the vocabulary); may be empty")
    description: str = Field("", description="NEW skills only: one general sentence about what the skill does, "
                                             "without mentioning specific objects")
    recipe: SkillRecipe | None = Field(None, description="NEW skills only: the full recipe with concrete keypoint names; "
                                                        "leave null when reusing a stored skill")


class SkillPlan(BaseModel):
    choices: list[SkillChoice]


# ---- 03 Parameter Setter ------------------------------------------------------------------
class ParamValue(BaseModel):
    subtask_id: int
    name: str
    value: float = Field(description="metres, degrees or newtons according to the parameter's unit")
    rationale: str = Field("", description="short justification")


class ParameterGroundings(BaseModel):
    values: list[ParamValue]


# ---- 04 Vision Grounder -------------------------------------------------------------------
class PixelPoint(BaseModel):
    name: str
    u: float = Field(description="horizontal pixel coordinate (x, increases to the right)")
    v: float = Field(description="vertical pixel coordinate (y, increases downward)")
    visible: bool = True


class PixelPoints(BaseModel):
    points: list[PixelPoint]
