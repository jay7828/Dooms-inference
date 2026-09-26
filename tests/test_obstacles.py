import mujoco
import numpy as np

from dooms.command import task_for_command
from dooms.config import deep_update
from dooms.llm.scripted import ScriptedLLM
from dooms.perception.clearance import analyze_reach
from dooms.pipeline import Pipeline
from dooms.sim.mujoco_env import MuJoCoEnv
from dooms.task import load_task


def test_clearance_flags_a_neighbour_within_finger_space_but_not_a_far_one(cfg):
    env = MuJoCoEnv(load_task("sandbox"), cfg)
    env.reset(0)
    cube = env.gt_keypoint("cube_blue_top")[0]
    adr = env.model.joint("box_free").qposadr[0]
    verdict = {}
    for edge in (0.045, 0.09):                                   # tray edge distance from the cube centre (m)
        env.data.qpos[adr:adr + 2] = [cube[0], cube[1] + 0.09 + edge]
        mujoco.mj_forward(env.model, env.data)
        verdict[edge] = analyze_reach(env.render("scene"), cube[:2], [0.0, 1.0])
    assert verdict[0.045]["blocked"] and not verdict[0.09]["blocked"]
    assert 0.02 < verdict[0.045]["sides"][0]["distance"] < 0.08
    env.close()


def test_no_false_alarms_on_untouched_scenes(cfg):
    env = MuJoCoEnv(load_task("sandbox"), cfg)
    for seed in range(8):
        env.reset(seed)
        obs = env.render("scene")
        for n in ("bottle_cap", "cube_red_top", "cube_blue_top"):
            assert not analyze_reach(obs, env.gt_keypoint(n)[0][:2], [0.0, 1.0]).get("blocked"), (seed, n)
    env.close()


def test_blocking_box_is_pushed_away_then_the_task_is_done(cfg):
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle"}})
    base = load_task("sandbox_blocked")
    task, pair = task_for_command(base, "pick up the bottle and put it on the table")
    env = MuJoCoEnv(task, cfg)
    env.reset(0)
    box_before = env.object_pos("box").copy()
    events = []
    res = Pipeline(env, ScriptedLLM(task, env, pair=pair), cfg, task, emit=events.append).run(0, reset=False)
    assert res.success, (res.error, res.predicates)
    assert res.obstacles_cleared == 1 and len(res.obstacles) == 1 and "BLOCKED" in res.obstacles[0]
    assert np.linalg.norm(env.object_pos("box")[:2] - box_before[:2]) > 0.10            # the box really moved
    assert any(e["type"] == "obstacle" for e in events)
    env.close()


def test_obstacle_check_can_be_switched_off(cfg):
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle", "obstacle_check": False, "max_regrounds": 0,
                                         "max_replans": 0}})
    task, pair = task_for_command(load_task("sandbox_blocked"), "pick up the bottle and put it on the table")
    env = MuJoCoEnv(task, cfg)
    res = Pipeline(env, ScriptedLLM(task, env, pair=pair), cfg, task).run(0)
    assert res.obstacles_cleared == 0 and res.obstacles == []
    env.close()


def test_outside_predicate_requires_the_object_to_have_moved(cfg):
    from dooms.bench.success_checks import evaluate
    task, _ = task_for_command(load_task("sandbox_fallen"), "put the bottle on the table away from the box")
    env = MuJoCoEnv(task, cfg)
    env.reset(0)
    start = {o.name: env.object_pos(o.name).copy() for o in task.objects}
    assert evaluate(env, task)["success"] is True                    # trivially 'outside' without the movement rule
    assert evaluate(env, task, start)["success"] is False            # ...but nothing happened
    env.close()


def test_sideways_facing_grasp_surface_is_reported_before_any_motion(cfg):
    from dooms.agents.skill_generator import SkillGenerator
    from dooms.controllers.base import Keypoint
    from dooms.llm.scripted import reference_plan
    task, pair = task_for_command(load_task("sandbox"), "put the bottle into the box")
    env = MuJoCoEnv(task, cfg)
    env.reset(0)
    pipe = Pipeline(env, ScriptedLLM(task, env, pair=pair), cfg, task)
    dec, rec, par = reference_plan(task, pair)
    SkillGenerator._check(rec, dec, task.keypoints)
    pipe.store.update({"bottle_cap": Keypoint("bottle_cap", np.array([0.5, 0.1, 0.05]), np.array([0.0, -1.0, 0.0])),
                       "box_inside": Keypoint("box_inside", np.array([0.4, -0.2, 0.01]), np.array([0.0, 0.0, 1.0]))})
    msg = pipe._check_geometry(rec, par)
    assert msg and "SIDEWAYS" in msg and "bottle_cap" in msg
    pipe.store.kps["bottle_cap"].normal = np.array([0.0, 0.0, 1.0])
    assert pipe._check_geometry(rec, par) is None
    env.close()
