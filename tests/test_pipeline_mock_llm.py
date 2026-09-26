import pytest

from dooms.command import parse_command, task_for_command
from dooms.config import deep_update
from dooms.llm.scripted import ScriptedLLM
from dooms.pipeline import Pipeline
from dooms.sim.mujoco_env import MuJoCoEnv
from dooms.task import list_tasks, load_task


FIXED = [t for t in list_tasks() if load_task(t).success]


@pytest.mark.parametrize("task_name", FIXED)
def test_oracle_pipeline_succeeds(cfg, task_name):
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle"}})
    task = load_task(task_name)
    env = MuJoCoEnv(task, cfg)
    res = Pipeline(env, ScriptedLLM(task, env), cfg, task).run(seed=1)
    env.close()
    assert res.success, res.error
    assert res.subtasks_ok == res.subtasks_total == 6
    assert res.llm_calls == 3            # decomposer + skill generator + parameter setter


def test_vlm_grounding_with_noisy_pointing(cfg):
    task = load_task("put_bottle_in_box")
    env = MuJoCoEnv(task, cfg)
    res = Pipeline(env, ScriptedLLM(task, env, pixel_noise=(6.0, 1.0), seed=1), cfg, task).run(seed=1)
    env.close()
    assert res.success, res.error
    assert max(res.grounding_err_mm) < 15
    assert res.llm_calls_by_agent["vision_grounder"] == 5       # scene: 1 coarse + 2 zoom; wrist close-up of the cap: 1 + 1
    assert res.wrist_refinements == 1 and max(res.refined_err_mm) < 10


@pytest.mark.parametrize("text,pair", [
    ("put the bottle into the box", ("bottle", "box")),
    ("Put the blue cube in the box", ("cube_blue", "box")),
    ("stack the red cube on top of the blue cube", ("cube_red", "cube_blue")),
    ("put the blue block on the red one", ("cube_blue", "cube_red")),
])
def test_sandbox_free_form_commands(cfg, text, pair):
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle"}})
    base = load_task("sandbox")
    task, parsed = task_for_command(base, text)
    assert parsed == pair
    env = MuJoCoEnv(task, cfg)
    res = Pipeline(env, ScriptedLLM(task, env, pair=parsed), cfg, task).run(seed=2)
    env.close()
    assert res.verified and res.success, (res.error, res.predicates)


def test_unparsable_command_is_unverified():
    _, pair = task_for_command(load_task("sandbox"), "wave hello")
    assert pair is None


def test_fallen_bottle_is_grasped_across_its_body_and_moved(cfg):
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle"}})
    base = load_task("sandbox_fallen")
    task, pair = task_for_command(base, "pick up the bottle and put it on the table")
    assert pair == ("bottle", "table")
    env = MuJoCoEnv(task, cfg)
    env.reset(3)
    assert env.bottle_lying()
    res = Pipeline(env, ScriptedLLM(task, env, pair=pair), cfg, task).run(3, reset=False)
    env.close()
    assert res.success and res.verified, (res.error, res.predicates)
    assert {"bottle_body_center", "bottle_cap_end"} <= {k for l in res.subtask_log for k in l["keypoints"]}


def test_infeasible_task_is_reported_not_attempted(cfg):
    base = load_task("sandbox_fallen")
    task, pair = task_for_command(base, "put the bottle into the box")
    env = MuJoCoEnv(task, cfg)
    res = Pipeline(env, ScriptedLLM(task, env, pair=pair), cfg, task).run(1)
    env.close()
    assert res.infeasible and not res.success and res.llm_calls == 1 and res.subtasks_total == 0
