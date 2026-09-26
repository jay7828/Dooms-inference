"""End-to-end pipeline: 01 decompose -> 02 recipes -> 03 parameters -> per-subtask 04 grounding -> compile -> execute."""
from __future__ import annotations

import json
import time
import traceback
from dataclasses import asdict, dataclass, field
from pathlib import Path

import imageio
import numpy as np

from .agents.base import AgentError
from .agents.parameter_setter import ParameterSetter
from .agents.skill_generator import SkillGenerator
from .agents.task_decomposer import TaskDecomposer
from .agents.vision_grounder import GroundingError, OracleGrounder, VisionGrounder
from .bench.success_checks import evaluate
from .execution.compiler import compile_subtask
from .execution.runtime import Runtime
from .llm.base import LLMClient, Usage
from .controllers.library import keypoint_of
from .llm.schemas import Decomposition, KeypointRequest, Subtask
from .monitor import Monitor
from .perception.keypoint_store import KeypointStore
from .skills import Skill, SkillLibrary, generalize
from .controllers.base import Context
from .perception.clearance import analyze_reach, describe
from .perception.viz import draw_points, encode_jpeg
from .sim.mujoco_env import MuJoCoEnv
from .task import TaskSpec

MAX_EPISODE_SIM_SECONDS = 240.0


class Infeasible(Exception):
    """The Task Decomposer judged the command impossible for this robot in this scene."""


@dataclass
class EpisodeResult:
    task: str
    seed: int
    success: bool = False
    error: str = ""
    subtasks_total: int = 0
    subtasks_ok: int = 0
    replans: int = 0
    retries: int = 0
    llm_calls: int = 0
    llm_calls_by_agent: dict = field(default_factory=dict)
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    llm_latency_s: float = 0.0
    wall_s: float = 0.0
    sim_s: float = 0.0
    grounding_err_mm: list = field(default_factory=list)
    refined_err_mm: list = field(default_factory=list)      # after wrist-camera re-grounding
    wrist_refinements: int = 0
    regrounds: int = 0
    infeasible: bool = False
    obstacles: list = field(default_factory=list)          # what blocked the task (descriptions the agents got)
    obstacles_cleared: int = 0
    skills_new: list = field(default_factory=list)
    skills_reused: list = field(default_factory=list)
    observations: str = ""
    normal_err_deg: list = field(default_factory=list)
    predicates: dict = field(default_factory=dict)
    verified: bool = True   # False when no ground-truth predicate exists for the command
    subtask_log: list = field(default_factory=list)


class Pipeline:
    def __init__(self, env: MuJoCoEnv, llm: LLMClient, cfg: dict, task: TaskSpec, run_dir: Path | None = None,
                 emit=None, library: SkillLibrary | None = None):
        self.env, self.llm, self.cfg, self.task = env, llm, cfg, task
        self.emit = emit or (lambda e: None)
        self.run_dir = Path(run_dir) if run_dir else None
        pc, bc = cfg["pipeline"], cfg["bedrock"]
        self.decomposer = TaskDecomposer(llm, bc)
        self.skillgen = SkillGenerator(llm, bc)
        self.paramset = ParameterSetter(llm, bc)
        self.grounder = (OracleGrounder(env) if pc["grounding"] == "oracle"
                         else VisionGrounder(llm, bc, refine_iters=pc["refine_iters"]))
        self.runtime = Runtime(env, cfg, env.q_home)
        self.monitor = Monitor()
        self.store = KeypointStore()
        self.res: EpisodeResult | None = None
        self._t_start = 0.0
        self._start_pos: dict = {}
        lib_dir = pc.get("skill_library_dir")
        if library is None and lib_dir:
            from . import DATA_DIR
            library = SkillLibrary(Path(lib_dir) if Path(lib_dir).is_absolute() else DATA_DIR / lib_dir)
        self.library = library
        self._infos: list[dict] = []
        self._plan_params = None
        self._final_ok: dict[int, bool] = {}
        for a in (self.decomposer, self.skillgen, self.paramset, self.grounder):
            a.emit = self.emit

    # ------------------------------------------------------------------ helpers
    def _save(self, name: str, data):
        if self.run_dir is None:
            return
        self.run_dir.mkdir(parents=True, exist_ok=True)
        p = self.run_dir / name
        if isinstance(data, np.ndarray):
            imageio.imwrite(p, data)
        else:
            p.write_text(data if isinstance(data, str) else json.dumps(data, indent=2, default=float))

    def _plan(self, failure_context: str | None):
        obs = self.env.render("scene")
        t, pc = self.task, self.cfg["pipeline"]
        if pc.get("use_decomposer", True):
            dec = self.decomposer.run(t.instruction, obs, t.scene_context, failure_context)
        else:
            dec = Decomposition(subtasks=[Subtask(id=1, name=t.instruction, description="Complete the whole task")])
        self.res.observations = dec.observations
        if not dec.feasible:
            raise Infeasible(dec.reason)
        recipes, infos = self.skillgen.run(t.instruction, dec, t.keypoints, self.library, failure_context)
        self._infos = infos
        self.emit({"type": "recipes", "recipes": [r.model_dump() for r in recipes.recipes],
                   "skills": [{"subtask_id": i["subtask_id"], "skill": i["skill_name"], "reused": i["reused"],
                               "description": i["description"]} for i in infos],
                   "library_size": len(self.library.names()) if self.library else 0})
        hints = {i["subtask_id"]: dict(self.library.get(i["skill_name"]).defaults) for i in infos
                 if i["reused"] and self.library and self.library.get(i["skill_name"])}
        params = self.paramset.run(t.instruction, dec, recipes, obs, t.scene_context, failure_context, hints=hints)
        self._plan_params = params
        return dec, recipes, params

    def _ground_plan(self, recipes, tag: str) -> None:
        """Ground every object keypoint the plan needs, once, from a clean image of the scene."""
        need: dict[str, KeypointRequest] = {}
        for r in recipes.recipes:
            for k in r.keypoints:
                need.setdefault(k.name, k)
        todo = [need[n] for n in self.store.missing(need)]
        if not todo:
            return
        obs = self.env.render("scene")
        kps = self.grounder.ground(todo, obs)
        self.store.update(kps)
        pixels = getattr(self.grounder, "last_pixels", None)
        if pixels:
            self._save(f"{tag}_grounding.png", draw_points(obs.rgb, pixels))
        overlay = draw_points(obs.rgb, pixels) if pixels else obs.rgb
        import base64
        self.emit({"type": "grounding", "image": base64.b64encode(encode_jpeg(overlay, 85)).decode(),
                   "keypoints": {n: {"pos": k.pos.round(4).tolist(),
                                     "normal": None if k.normal is None else k.normal.round(3).tolist(),
                                     "pixel": pixels.get(n) if pixels else None} for n, k in kps.items()}})
        for name, kp in kps.items():
            if self.env.has_keypoint(name):
                gt_p, gt_n = self.env.gt_keypoint(name)
                self.res.grounding_err_mm.append(float(np.linalg.norm(kp.pos - gt_p) * 1000))
                if kp.normal is not None:
                    self.res.normal_err_deg.append(float(np.degrees(np.arccos(np.clip(kp.normal @ gt_n, -1, 1)))))

    def _wrist_refine(self, recipe) -> None:
        """Coarse-to-fine grounding: when the gripper is about to reach for a keypoint and already hovers near it,
        look again with the wrist camera (closer, so the same pointing error costs fewer millimetres)."""
        if not self.cfg["pipeline"].get("wrist_refine", True) or not hasattr(self.grounder, "refine_iters"):
            return
        s = self.env.state()
        names = []
        for c in recipe.controllers:
            k = keypoint_of(c.target) if c.type == "PosAlign" and c.source == "eef_tcp" else None
            if k and k in self.store.kps and k not in self.store.held and k not in names:
                names.append(k)
        for n in names:
            old = self.store.kps[n]
            if np.linalg.norm(old.pos[:2] - s.tcp_pos[:2]) > 0.10:      # not above it yet: a close-up is useless
                continue
            obs = self.env.render("wrist")
            try:
                new = self.grounder.ground([KeypointRequest(name=n, description=next((k.description for k in recipe.keypoints if k.name == n), self.task.keypoints.get(n, "")))], obs)[n]
            except (GroundingError, AgentError) as e:
                self.emit({"type": "status", "text": f"wrist re-grounding of {n} failed, keeping the scene estimate ({e})"})
                continue
            jump = np.linalg.norm(new.pos - old.pos)
            if jump > 0.06:                                                  # implausible: keep the old estimate
                self.emit({"type": "status", "text": f"wrist re-grounding of {n} moved it {jump * 100:.0f} cm - rejected"})
                continue
            self.store.kps[n] = new
            self.res.wrist_refinements += 1
            if self.env.has_keypoint(n):
                self.res.refined_err_mm.append(float(np.linalg.norm(new.pos - self.env.gt_keypoint(n)[0]) * 1000))
            pixels = getattr(self.grounder, "last_pixels", None)
            import base64
            self.emit({"type": "grounding", "source": "wrist close-up",
                       "image": base64.b64encode(encode_jpeg(draw_points(obs.rgb, pixels) if pixels else obs.rgb, 85)).decode(),
                       "keypoints": {k: {"pos": v.pos.round(4).tolist(), "normal": None if v.normal is None else v.normal.round(3).tolist(),
                                         "pixel": (pixels or {}).get(k)} for k, v in self.store.kps.items() if k not in self.store.held}})

    def _commit_skills(self, episode_ok: bool) -> None:
        """Learn: save NEW skills after a successful episode; update the stats of reused ones."""
        if self.library is None or not self._infos or self._plan_params is None:
            return
        for info in self._infos:
            sid, name = info["subtask_id"], info["skill_name"]
            rec = info["recipe"]
            declared = {p.name for p in rec.params}
            values = {k: v for k, v in ParameterSetter.values_for(self._plan_params, sid).items() if k in declared}
            if info["reused"]:
                if sid in self._final_ok:
                    self.library.record(name, self._final_ok[sid], values)
                    self.res.skills_reused.append(name)
            elif episode_ok and self._final_ok.get(sid, False):
                roles = sorted(info["role_bindings"])
                self.library.add(Skill(name=name, description=info["description"].strip(), roles=roles,
                                       controllers=generalize(rec.controllers, info["role_bindings"]),
                                       params=rec.params, defaults=values, uses=1, successes=1))
                self.res.skills_new.append(name)
        self.emit({"type": "library", "skills": self.library.api()})

    def _stage_done(self, stage) -> None:
        """Runtime hook: a stage converged -> update what the robot is holding (keypoint tracking)."""
        actions = [c.action for c in stage if c.name == "Gripper"]
        if "close" in actions and self.env.state().gripper_width >= 0.008:
            self.store.on_grasp(list(self.store.kps), self.env.state())
        elif "open" in actions:
            self.store.on_release(self.env.state())

    def _finger_dir(self, recipe, values: dict) -> np.ndarray:
        """Horizontal direction along which the open fingers will lie when this subtask grasps."""
        st = self.env.state()
        yaw = next((c for c in recipe.controllers if c.type == "YawAlign"), None)
        if yaw is not None:
            try:
                names = [k.name for k in recipe.keypoints]
                v = Context(self.env, st, self.store.snapshot(names, st), self.cfg).vector(yaw.target)[:2]
                if np.linalg.norm(v) > 1e-6:
                    v = v / np.linalg.norm(v)
                    ang = values.get(yaw.param, 90.0)
                    return np.array([-v[1], v[0]]) if abs(ang - 90) < 45 else v
            except KeyError:
                pass
        e = st.tcp_rot[:, 1][:2]
        return e / np.linalg.norm(e)

    def _check_geometry(self, recipes, params) -> str | None:
        """A top-down gripper cannot point opposite to a sideways-facing surface (e.g. the cap of a bottle lying down)."""
        for recipe in recipes.recipes:
            values = ParameterSetter.values_for(params, recipe.subtask_id)
            for c in recipe.controllers:
                if not (c.type == "AxisAlign" and c.source in ("eef_z", "eef_z_axis") and (c.target or "").endswith(("_normal", "_norm"))):
                    continue
                k = keypoint_of(c.target)
                kp = self.store.kps.get(k)
                if kp is None or kp.normal is None or k in self.store.held:
                    continue
                if values.get(c.param, 180.0) > 120 and abs(float(kp.normal[2])) < 0.6:
                    n = kp.normal
                    return (f"Surface check: keypoint '{k}' lies on a surface whose normal points SIDEWAYS (n = {n[0]:+.2f}, "
                            f"{n[1]:+.2f}, {n[2]:+.2f} in world x, y, z). Aligning the gripper with it (AxisAlign eef_z vs "
                            f"{c.target}, {values.get(c.param, 180.0):.0f} deg) would make the gripper point horizontally, which this "
                            "top-down gripper cannot do. Do NOT clear anything: re-plan the task and grasp/target a point on an "
                            "UPWARD-facing surface instead (for an object lying on its side, define new keypoints such as "
                            "`<obj>_body_center`: the top of its body, and `<obj>_cap_end`: its far end). To point the gripper "
                            "straight down use AxisAlign(eef_z, world_z, 180) - never the measured normal of a curved surface.")
        return None

    def _check_obstacles(self, recipes, params) -> str | None:
        """Depth-based clearance check at every grasp target: would a finger hit a neighbouring object?"""
        obs = self.env.render("scene")
        for recipe in recipes.recipes:
            if not any(c.type == "Gripper" and c.action == "close" for c in recipe.controllers):
                continue
            targets = []
            for c in recipe.controllers:
                k = keypoint_of(c.target) if c.type == "PosAlign" and c.source == "eef_tcp" else None
                if k and k in self.store.kps and k not in self.store.held and k not in targets:
                    targets.append(k)
            values = ParameterSetter.values_for(params, recipe.subtask_id)
            for k in targets:
                res = analyze_reach(obs, self.store.kps[k].pos[:2], self._finger_dir(recipe, values))
                if res.get("blocked"):
                    nearby = {n: kp.pos for n, kp in self.store.kps.items() if n != k}
                    return describe(res, k, nearby)
        return None

    def _execute_plan(self, dec, recipes, params, tag: str, check_obstacles: bool = False) -> str | None:
        """Run all subtasks; return a failure description or None."""
        pc = self.cfg["pipeline"]
        names = {s.id: s.name for s in dec.subtasks}
        self._final_ok = {}
        self.monitor.reset()
        self.monitor.expect_grasp = not dec.clears_obstacle
        self.store.clear()
        try:
            self._ground_plan(recipes, tag)
        except (GroundingError, AgentError) as e:
            return f"grounding failed: {e}"
        if check_obstacles and self.cfg["pipeline"].get("obstacle_check", True):
            blocked = self._check_geometry(recipes, params) or self._check_obstacles(recipes, params)
            if blocked:
                return "OBSTACLE: " + blocked
        self.res.subtasks_total += len(dec.subtasks)
        for recipe in recipes.recipes:
            sid, name = recipe.subtask_id, names[recipe.subtask_id]
            values = ParameterSetter.values_for(params, sid)
            script = compile_subtask(recipe, name, values)
            req_names = [k.name for k in recipe.keypoints]
            for attempt in range(1 + pc["max_subtask_retries"]):
                if self.env.state().t - self._t_start > MAX_EPISODE_SIM_SECONDS:
                    return "episode time budget exhausted"
                snap = lambda: self.store.snapshot(req_names, self.env.state())
                self._wrist_refine(recipe)
                kps = snap()
                self.emit({"type": "subtask_start", "id": sid, "name": name, "attempt": attempt, "script": script.to_text()})
                out = self.runtime.run_subtask(script, snap, on_stage_done=self._stage_done)
                verdict = self.monitor.check(script, out)
                self.res.subtask_log.append({
                    "plan": tag, "subtask": sid, "name": name, "attempt": attempt, "reason": out.reason,
                    "sim_s": round(out.sim_seconds, 2), "gripper_mm": round(out.gripper_width * 1000, 1),
                    "ok": verdict.ok, "verdict": verdict.reason, "script": script.to_text(),
                    "keypoints": {k: v.pos.round(4).tolist() for k, v in kps.items()}})
                self.emit({"type": "subtask_end", "id": sid, "name": name, "ok": verdict.ok, "reason": out.reason,
                           "verdict": verdict.reason, "sim_s": round(out.sim_seconds, 2)})
                self._final_ok[sid] = verdict.ok
                if verdict.ok:
                    self.res.subtasks_ok += 1
                    break
                if attempt < pc["max_subtask_retries"] and out.reason == "timeout":
                    self.res.retries += 1
                    continue
                return verdict.reason
        return None

    # ------------------------------------------------------------------ episode
    def run(self, seed: int, reset: bool = True) -> EpisodeResult:
        """reset=False continues from the simulator's current state (persistent session): the arm first returns
        home, objects stay wherever earlier commands left them."""
        t0 = time.time()
        self.res = res = EpisodeResult(task=self.task.name, seed=seed)
        self.llm.usage = Usage()
        for a in (self.decomposer, self.skillgen, self.paramset, self.grounder):
            getattr(a, "trace", []).clear()
        pc = self.cfg["pipeline"]
        try:
            if reset:
                self.env.reset(seed)
            elif np.linalg.norm(self.env.state().q - self.env.q_home) > 0.05 or self.env.state().gripper_width < 0.07:
                self.emit({"type": "status", "text": "returning to the home pose"})
                self.runtime.go_home()
            self._t_start = self.env.state().t
            self._start_pos = {o.name: self.env.object_pos(o.name).copy() for o in self.task.objects}
            self.env.record = bool(pc.get("record_video", False)) and self.run_dir is not None
            self._save("scene.png", self.env.render("scene").rgb)
            failure = None
            replans_used, obstacle_rounds, plan_no = 0, 0, 0
            while True:
                dec, recipes, params = self._plan(failure)
                self._save(f"plan_{plan_no}.json", {"subtasks": dec.model_dump(), "recipes": recipes.model_dump(),
                                                    "params": params.model_dump(), "failure_context": failure})
                tries = 0
                while True:
                    failure = self._execute_plan(
                        dec, recipes, params, tag=f"p{plan_no}" + (f"r{tries}" if tries else ""),
                        check_obstacles=(not dec.clears_obstacle) and obstacle_rounds < pc.get("max_obstacle_rounds", 2))
                    if (failure is None or failure.startswith("OBSTACLE:") or tries >= pc.get("max_regrounds", 0)
                            or "time budget" in failure):
                        break
                    # targeted feedback: the plan is probably fine, the perception was not -> home, look again, re-run
                    tries += 1
                    res.regrounds += 1
                    self.emit({"type": "status", "text": f"{failure} - returning home to look again (attempt {tries + 1})"})
                    self.runtime.go_home()
                    if hasattr(self.grounder, "temp_boost"):
                        self.grounder.temp_boost = 0.4
                if hasattr(self.grounder, "temp_boost"):
                    self.grounder.temp_boost = 0.0
                plan_no += 1
                if failure is None:
                    if dec.clears_obstacle and plan_no < 8:      # obstacle gone: plan the actual task again from the new scene
                        self._commit_skills(True)
                        res.obstacles_cleared += 1
                        self.emit({"type": "status", "text": "obstacle cleared - looking at the scene again to plan the task"})
                        self.runtime.go_home()
                        continue
                    break
                if failure.startswith("OBSTACLE:") and plan_no < 8:
                    obstacle_rounds += 1
                    res.obstacles.append(failure[len("OBSTACLE:"):].strip())
                    self.emit({"type": "obstacle", "text": res.obstacles[-1]})
                    continue                                       # `failure` is handed to the agents as planning context
                res.error = failure
                if replans_used < pc["max_replans"]:
                    replans_used += 1
                    res.replans += 1
                    self.emit({"type": "replan", "reason": failure})
                    self.runtime.go_home()
                    w = self.env.state().gripper_width
                    failure = (f"The previous plan failed: {failure}. The gripper is currently "
                               f"{'open' if w > 0.06 else 'closed'} (opening {w * 1000:.0f} mm). "
                               "Plan a recovery from the current scene.")
                    continue
                break
            if failure is None:
                res.error = ""
            self.runtime.hold(1.0)
            ev = evaluate(self.env, self.task, self._start_pos)
            res.verified = ev["success"] is not None
            res.success = ev["success"] if res.verified else (res.error == "")
            res.predicates = ev["predicates"]
            self._commit_skills(res.success)
        except Infeasible as e:
            res.error, res.infeasible, res.verified, res.success = f"cannot do this: {e}", True, False, False
        except Exception as e:  # keep benchmark runs going; the failure is recorded on the episode
            res.error = f"{type(e).__name__}: {e}"
            if self.run_dir is not None:
                self._save("traceback.txt", traceback.format_exc())
        u = self.llm.usage
        res.llm_calls, res.llm_calls_by_agent = u.n_calls, u.by_agent()
        res.input_tokens, res.output_tokens = u.input_tokens, u.output_tokens
        res.cost_usd = u.cost(self.cfg["bedrock"]["pricing"])
        res.llm_latency_s = u.latency_s
        res.wall_s = time.time() - t0
        res.sim_s = self.env.state().t - getattr(self, "_t_start", 0.0)
        if self.run_dir is not None:
            self._save("result.json", asdict(res))
            self._save("transcript.json", [t for a in (self.decomposer, self.skillgen, self.paramset, self.grounder)
                                           for t in getattr(a, "trace", [])])
            if self.env.frames:
                imageio.mimsave(self.run_dir / "video.mp4", self.env.frames, fps=pc.get("video_fps", 20),
                                macro_block_size=1)
        return res
