import pytest

from dooms.agents.skill_generator import SkillGenerator
from dooms.llm.scripted import reference_plan
from dooms.llm.schemas import Decomposition, ParameterGroundings, PixelPoints, SkillRecipes
from dooms.task import load_task


def test_schemas_export_json_schema():
    for m in (Decomposition, SkillRecipes, ParameterGroundings, PixelPoints):
        assert m.model_json_schema()["type"] == "object"


def test_skill_check_rejects_unknown_keypoint():
    task = load_task("put_bottle_in_box")
    dec, rec, _ = reference_plan(task)
    SkillGenerator._check(rec, dec, task.keypoints)         # reference plan is valid
    rec.recipes[0].controllers[0].target = "banana"
    with pytest.raises(ValueError, match="unknown keypoint"):
        SkillGenerator._check(rec, dec, task.keypoints)


def test_agent_can_define_new_keypoints():
    from dooms.llm.schemas import KeypointRequest
    task = load_task("sandbox")
    dec, rec, _ = reference_plan(task, ("bottle", "table"))       # plan that targets a keypoint outside the vocabulary
    assert "table_free_spot" not in task.keypoints
    SkillGenerator._check(rec, dec, task.keypoints)              # declared with a description -> accepted
    assert any(k.name == "table_free_spot" and len(k.description) > 8 for r in rec.recipes for k in r.keypoints)
    # undeclared -> rejected with an instruction on how to define it
    for r in rec.recipes:
        r.keypoints = []
    with pytest.raises(ValueError, match="DEFINE a new one"):
        SkillGenerator._check(rec, dec, task.keypoints)
    # declared but with no real description -> rejected
    for r in rec.recipes:
        if any(c.target == "table_free_spot" for c in r.controllers):
            r.keypoints = [KeypointRequest(name="table_free_spot", description="")]
    with pytest.raises(ValueError, match="precise description"):
        SkillGenerator._check(rec, dec, task.keypoints)


def test_structural_mistakes_are_rejected_with_a_fix_hint():
    from dooms.llm.schemas import ControllerSpec
    task = load_task("sandbox")
    dec, rec, _ = reference_plan(task, ("bottle", "box"))
    SkillGenerator._check(rec, dec, task.keypoints)
    grasp = rec.recipes[1]                                   # descend (stage 0) then close (stage 1)
    for c in grasp.controllers:
        if c.type == "Gripper":
            c.stage = 0                                      # the classic mistake: close while still descending
    with pytest.raises(ValueError, match="stage 1"):
        SkillGenerator._check(rec, dec, task.keypoints)
    dec, rec, _ = reference_plan(task, ("bottle", "box"))
    for c in rec.recipes[5].controllers:                     # retract in the same stage as opening
        c.stage = 0
    with pytest.raises(ValueError, match="stage 1"):
        SkillGenerator._check(rec, dec, task.keypoints)


def test_a_keypoint_defined_once_is_valid_in_every_choice_of_the_plan():
    from dooms.llm.schemas import KeypointRequest, SkillChoice, SkillPlan
    task = load_task("sandbox")
    dec, rec, _ = reference_plan(task, ("bottle", "table"))
    from dooms.llm.scripted import to_plan
    plan = to_plan(rec, task, ("bottle", "table"), False, library_names=set())
    definition = KeypointRequest(name="table_free_spot", description="an empty spot of bare table clear of all objects")
    for ch in plan.choices:                                 # keep the definition in ONE choice only
        ch.keypoints = []
        if ch.recipe is not None:
            ch.recipe.keypoints = []
    plan.choices[3].keypoints = [definition]
    recipes, _ = SkillGenerator.assemble(plan, dec, task.keypoints, None)
    assert any(k.name == "table_free_spot" for r in recipes.recipes for k in r.keypoints)
