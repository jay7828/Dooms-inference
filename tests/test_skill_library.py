from dooms.command import task_for_command
from dooms.config import deep_update
from dooms.llm.scripted import ScriptedLLM
from dooms.pipeline import Pipeline
from dooms.sim.mujoco_env import MuJoCoEnv
from dooms.skills import SkillLibrary
from dooms.task import load_task


def _run(env, cfg, lib, scene, text, seed=1):
    task, pair = task_for_command(load_task(scene), text)
    return Pipeline(env, ScriptedLLM(task, env, pair=pair), cfg, task, library=lib).run(seed)


def test_library_starts_empty_learns_then_reuses(cfg, tmp_path):
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle"}})
    lib = SkillLibrary(tmp_path / "skills")
    assert lib.names() == []
    env = MuJoCoEnv(load_task("sandbox"), cfg)

    r1 = _run(env, cfg, lib, "sandbox", "put the bottle into the box")
    assert r1.success and len(r1.skills_new) == 6 and not r1.skills_reused
    assert set(lib.names()) == {"approach_above", "grasp_from_above", "lift_held", "move_over",
                                "place_down_on_contact", "release_and_retract"}
    grasp = lib.get("grasp_from_above")
    assert grasp.roles == ["obj"] and grasp.successes == 1 and "o_d" in grasp.defaults
    assert all("bottle" not in (c.source or "") + (c.target or "") for s in lib.skills.values() for c in s.controllers)

    # a different object: every skill is REUSED, nothing new is created, statistics grow
    r2 = _run(env, cfg, lib, "sandbox", "put the blue cube into the box")
    # (the agent picks the *aligned* variants for boxy objects; everything else is reused)
    assert r2.success and set(r2.skills_new) == {"approach_above_aligned", "grasp_from_above_aligned"}
    assert set(r2.skills_reused) == {"lift_held", "move_over", "place_down_on_contact", "release_and_retract"}
    assert lib.get("lift_held").uses == 2 and lib.get("lift_held").successes == 2
    r3 = _run(env, cfg, lib, "sandbox", "put the blue cube into the box")
    assert r3.success and r3.skills_new == [] and len(r3.skills_reused) == 6

    # survives a restart (files on disk)
    assert set(SkillLibrary(tmp_path / "skills").names()) == set(lib.names())
    env.close()


def test_new_situation_creates_only_the_missing_skills(cfg, tmp_path):
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle"}})
    lib = SkillLibrary(tmp_path / "skills")
    env = MuJoCoEnv(load_task("sandbox"), cfg)
    assert _run(env, cfg, lib, "sandbox", "put the bottle into the box").success
    before = set(lib.names())
    env2 = MuJoCoEnv(load_task("sandbox_fallen"), cfg)
    r = _run(env2, cfg, lib, "sandbox_fallen", "pick up the bottle and put it on the table")
    assert r.success
    assert set(r.skills_new) == {"approach_above_long_axis", "grasp_from_above_long_axis"}
    assert set(lib.names()) == before | set(r.skills_new)


def test_failed_episode_does_not_store_new_skills(cfg, tmp_path):
    lib = SkillLibrary(tmp_path / "skills")
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle", "max_regrounds": 0, "max_replans": 0}})
    task, pair = task_for_command(load_task("sandbox_fallen"), "put the bottle into the box")   # infeasible
    env = MuJoCoEnv(task, cfg)
    r = Pipeline(env, ScriptedLLM(task, env, pair=pair), cfg, task, library=lib).run(1)
    assert r.infeasible and lib.names() == []


def test_new_skill_with_an_existing_name_becomes_a_variant_instead_of_failing(cfg, tmp_path):
    from dooms.agents.skill_generator import SkillGenerator
    from dooms.llm.scripted import reference_plan, to_plan
    from dooms.llm.schemas import Decomposition
    lib = SkillLibrary(tmp_path / "skills")
    task = load_task("sandbox")
    dec, rec, _ = reference_plan(task, ("bottle", "box"))
    cfg = deep_update(cfg, {"pipeline": {"grounding": "oracle"}})
    env = MuJoCoEnv(task, cfg)
    assert Pipeline(env, ScriptedLLM(task, env, pair=("bottle", "box")), cfg, task, library=lib).run(1).success
    # the agent now proposes a NEW recipe under a name that is already stored
    plan = to_plan(rec, task, ("bottle", "box"), False, library_names=set())       # everything 'new'
    recipes, infos = SkillGenerator.assemble(plan, dec, task.keypoints, lib)
    assert all(i["skill_name"].endswith("_v2") for i in infos) and not any(i["reused"] for i in infos)
    env.close()
