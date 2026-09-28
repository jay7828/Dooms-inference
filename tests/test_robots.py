"""The second arm (SO-ARM101): profile plumbing, gripper geometry and full pipeline runs in simulation."""
import numpy as np
import pytest
from fastapi.testclient import TestClient

from dooms.agents.skill_generator import SkillGenerator
from dooms.config import deep_update
from dooms.controllers.library import controller_doc
from dooms.llm.schemas import ControllerSpec, Decomposition, SkillChoice, SkillPlan, SkillRecipe, Subtask
from dooms.llm.scripted import ScriptedLLM
from dooms.pipeline import Pipeline
from dooms.robots import PROFILES, adapt_task, get_profile
from dooms.server.app import app
from dooms.sim.mujoco_env import MuJoCoEnv
from dooms.task import load_task

SO_TASKS = ["put_bottle_in_box", "put_cube_in_box", "stack_cubes"]


def test_profiles_and_defaults():
    assert set(PROFILES) == {"franka", "so101"}
    assert get_profile(None).id == "franka"
    with pytest.raises(ValueError):
        get_profile("ur5")
    assert not get_profile("so101").force_sensor and get_profile("franka").force_sensor
    assert not get_profile("so101").supports("sandbox_fallen")


def test_franka_task_is_not_adapted():
    t = load_task("sandbox")
    assert adapt_task(t, get_profile("franka")) is t


def test_so101_task_is_rescaled_into_its_workspace():
    p = get_profile("so101")
    t = adapt_task(load_task("sandbox"), p)
    for o in t.objects:
        assert 0.10 < o.x_range[0] <= o.x_range[1] < 0.31 and abs(o.y_range[0]) < 0.17 and abs(o.y_range[1]) < 0.17
        if o.type == "cube":
            assert o.size == p.dims.cube
    assert "2.5 cm" in t.scene_context and f"{p.max_width * 100:.1f} cm" in t.scene_context


def test_so101_env_state_and_gripper_width(cfg):
    env = MuJoCoEnv(load_task("put_cube_in_box"), cfg, "so101")
    env.reset(0)
    s = env.state()
    assert s.q.shape == (5,) and env.n_joints == 5 and not env.force_sensor
    assert s.tcp_rot[:, 2] @ [0, 0, -1] > 0.95                      # the gripper points (nearly) down at home
    assert abs(s.gripper_width - env.max_width) < 2e-3               # open
    assert np.all(np.diff(env._jaw_width) >= 0)                      # width table is monotone, so it can be inverted
    env.set_gripper(0.0)
    for _ in range(60):
        env.step()
    closed = env.state().gripper_width
    assert closed < get_profile("so101").grasp_min_width             # closed on nothing reads "empty"
    assert np.allclose(env.state().wrench, 0)                        # no force sensor: zeros
    env.close()


def test_gripper_open_uses_each_robots_max_width(cfg):
    from dooms.controllers.base import Context
    from dooms.controllers.gripper import Gripper
    for robot in ("franka", "so101"):
        env = MuJoCoEnv(load_task("put_cube_in_box"), cfg, robot)
        env.reset(0)
        g = Gripper("open")
        g.on_stage_start(Context(env, env.state(), {}, cfg))
        assert g.gripper_command() == env.max_width
        env.close()


def test_force_controller_is_refused_and_documented_away_for_so101():
    assert "NOT AVAILABLE" in controller_doc(0.055, force_sensor=False)
    assert "Force(axis, value)" in controller_doc(0.08, force_sensor=True)
    assert "Max opening 0.055 m" in controller_doc(0.055, False)
    dec = Decomposition(observations="", subtasks=[Subtask(id=1, name="place", description="place it")])
    recipe = SkillRecipe(subtask_id=1, keypoints=[], params=[], controllers=[
        ControllerSpec(type="Force", axis="-z", param="f", priority=1, stage=0)])
    plan = SkillPlan(choices=[SkillChoice(subtask_id=1, skill_name="place_softly", role_bindings={}, recipe=recipe,
                                          description="Lower the object gently until it touches the surface.")])
    SkillGenerator.assemble(plan, dec, {}, None)                                 # fine on an arm with a force sensor
    with pytest.raises(ValueError, match="NO force sensor"):
        SkillGenerator.assemble(plan, dec, {}, None, allow_force=False)


@pytest.mark.parametrize("task_name", SO_TASKS)
@pytest.mark.parametrize("seed", [0, 3])
def test_so101_scripted_pipeline_succeeds(cfg, task_name, seed):
    cfg = deep_update(cfg, {"pipeline": {"skill_library_dir": None}})
    task = load_task(task_name)
    env = MuJoCoEnv(task, cfg, "so101")
    res = Pipeline(env, ScriptedLLM(task, env, pixel_noise=(6.0, 1.0), seed=seed), cfg, task).run(seed=seed)
    env.close()
    assert res.success, res.error
    assert res.subtasks_ok == res.subtasks_total == 6
    assert max(res.grounding_err_mm) < 15


def test_server_lists_robots_and_serves_scenes_per_robot():
    c = TestClient(app)
    cfg = c.get("/api/config").json()
    assert [r["id"] for r in cfg["robots"]] == ["franka", "so101"] and cfg["default_robot"] == "franka"
    by_name = {s["name"]: s["robots"] for s in cfg["scenes"]}
    assert by_name["sandbox"] == ["franka", "so101"] and by_name["sandbox_fallen"] == ["franka"]
    sc = c.get("/api/scene/put_bottle_in_box?seed=0&robot=so101").json()
    assert sc["robot"] == "so101" and sc["nbody"] > 5 and sc["view"]["pos"]
    assert c.get("/api/scene/put_bottle_in_box?seed=0").json()["robot"] == "franka"
    assert c.get("/api/scene/sandbox_fallen?seed=0&robot=so101").status_code == 404
    assert c.get("/api/scene/sandbox?seed=0&robot=nope").status_code == 404


def _stage(*ctls):
    from dooms.execution.compiler import SubtaskScript
    return SubtaskScript(1, "test move", [list(ctls)], {})


def test_unreachable_target_fails_fast_with_a_reason(cfg):
    """A target the arm cannot reach with the gripper pointing down must end as 'stalled' after ~2 s, not shake for 10 s."""
    import numpy as np
    from dooms.controllers.axis_align import AxisAlign
    from dooms.controllers.base import Keypoint
    from dooms.controllers.pos_align import PosAlign
    from dooms.execution.runtime import Runtime
    from dooms.robots import apply_profile
    c = apply_profile(cfg, get_profile("so101"))
    env = MuJoCoEnv(load_task("put_cube_in_box"), c, "so101")
    env.reset(0)
    far = {"p": Keypoint("p", np.array([0.32, 0.0, 0.0]), np.array([0.0, 0.0, 1.0]))}
    ctls = [PosAlign("eef_tcp", "p", ax, off, 1, 0) for ax, off in (("x", 0.0), ("y", 0.0), ("z", 0.12))]
    ctls.append(AxisAlign("eef_z", "world_z", np.pi, 2, 0))
    res = Runtime(env, c, env.q_home).run_subtask(_stage(*ctls), far)
    env.close()
    assert not res.success and res.reason.startswith("stalled") and "not converged" in res.reason
    assert res.sim_seconds < 6.0


def test_reachable_target_is_not_flagged_as_stalled(cfg):
    import numpy as np
    from dooms.controllers.axis_align import AxisAlign
    from dooms.controllers.base import Keypoint
    from dooms.controllers.pos_align import PosAlign
    from dooms.execution.runtime import Runtime
    from dooms.robots import apply_profile
    c = apply_profile(cfg, get_profile("so101"))
    env = MuJoCoEnv(load_task("put_cube_in_box"), c, "so101")
    env.reset(0)
    near = {"p": Keypoint("p", np.array([0.22, 0.05, 0.0]), np.array([0.0, 0.0, 1.0]))}
    ctls = [PosAlign("eef_tcp", "p", ax, off, 1, 0) for ax, off in (("x", 0.0), ("y", 0.0), ("z", 0.03))]
    ctls.append(AxisAlign("eef_z", "world_z", np.pi, 2, 0))
    res = Runtime(env, c, env.q_home).run_subtask(_stage(*ctls), near)
    env.close()
    assert res.success, res.reason
