from dooms.command import task_for_command
from dooms.config import deep_update
from dooms.llm.scripted import ScriptedLLM
from dooms.pipeline import Pipeline
from dooms.sim.mujoco_env import MuJoCoEnv
from dooms.task import load_task


def _run(env, cfg, text, reset):
    task, pair = task_for_command(load_task("sandbox"), text)
    return Pipeline(env, ScriptedLLM(task, env, pair=pair), cfg, task).run(seed=1, reset=reset)


def test_state_persists_across_commands_until_reset(cfg):
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle"}})
    env = MuJoCoEnv(load_task("sandbox"), cfg)
    assert _run(env, cfg, "put the bottle into the box", reset=True).success
    r2 = _run(env, cfg, "put the blue cube into the box", reset=False)      # continues from the current state
    assert r2.success, (r2.error, r2.predicates)
    box = env.object_pos("box")
    assert abs(env.object_pos("bottle")[0] - box[0]) < 0.08 and env.object_pos("bottle")[2] < 0.11   # still in the box (the cube went into the free side)
    env.reset(1)                                                                                        # "Reset scene"
    assert env.object_pos("bottle")[2] > 0.05 and abs(env.object_pos("bottle")[1] - box[1]) > 0.1
    env.close()
