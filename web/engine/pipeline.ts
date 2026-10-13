/**
 * End-to-end pipeline: 01 decompose -> 02 recipes -> 03 parameters -> grounding -> compile -> execute (pipeline.py).
 * Emits exactly the event shapes the Dooms UI store consumes.
 */
import {
  AgentError, GroundingError, OracleGrounder, ParameterSetter, SkillGenerator, TaskDecomposer, type Emit, type Grounder, type SkillInfo,
} from './agents'
import {
  ctxVector, keypointOf, type Context, type ExecCfg, type Keypoint, Gripper,
} from './controllers'
import { applyProfile, type Config, type TaskSpec } from './data'
import type { MuJoCoEnv } from './env'
import { Aborted, Runtime, compileSubtask, scriptText } from './execution'
import { Usage, type LLM } from './llm'
import { norm, type Vec3 } from './linalg'
import { Monitor, evaluate } from './monitor'
import { KeypointStore, analyzeReach, describeReach } from './perception'
import type { Decomposition, KeypointRequest, ParameterGroundings, SkillRecipe, SkillRecipes } from './schemas'
import { generalize, mkSkill, type SkillLibrary } from './skills'

const MAX_EPISODE_SIM_SECONDS = 240.0

/** The Task Decomposer judged the command impossible for this robot in this scene. */
export class Infeasible extends Error {}

export interface EpisodeResult {
  task: string
  seed: number
  success: boolean
  error: string
  subtasks_total: number
  subtasks_ok: number
  replans: number
  retries: number
  llm_calls: number
  llm_calls_by_agent: Record<string, number>
  input_tokens: number
  output_tokens: number
  cost_usd: number
  llm_latency_s: number
  wall_s: number
  sim_s: number
  grounding_err_mm: number[]
  refined_err_mm: number[] // after wrist-camera re-grounding
  wrist_refinements: number
  regrounds: number
  infeasible: boolean
  obstacles: string[] // what blocked the task (descriptions the agents got)
  obstacles_cleared: number
  skills_new: string[]
  skills_reused: string[]
  observations: string
  normal_err_deg: number[]
  predicates: Record<string, boolean>
  verified: boolean // false when no ground-truth predicate exists for the command
  subtask_log: Record<string, unknown>[]
}

const newResult = (task: string, seed: number): EpisodeResult => ({
  task, seed, success: false, error: '', subtasks_total: 0, subtasks_ok: 0, replans: 0, retries: 0, llm_calls: 0, llm_calls_by_agent: {},
  input_tokens: 0, output_tokens: 0, cost_usd: 0, llm_latency_s: 0, wall_s: 0, sim_s: 0, grounding_err_mm: [], refined_err_mm: [],
  wrist_refinements: 0, regrounds: 0, infeasible: false, obstacles: [], obstacles_cleared: 0, skills_new: [], skills_reused: [],
  observations: '', normal_err_deg: [], predicates: {}, verified: true, subtask_log: [],
})

export interface PipelineHooks {
  /** base64 JPEG of the scene camera for the 'grounding' event ('' when this environment cannot render) */
  sceneJpegBase64?: () => Promise<string>
  /** base64 JPEG of a camera with the grounded pixels marked (vision grounding); '' when it cannot be made */
  overlayJpegBase64?: (camera: 'scene' | 'wrist', pixels: Record<string, [number, number]>) => Promise<string>
}

const round = (v: ArrayLike<number>, k: number): number[] => Array.from(v, (x) => Math.round(x * 10 ** k) / 10 ** k)

export class Pipeline {
  private decomposer: TaskDecomposer
  private skillgen: SkillGenerator
  private paramset: ParameterSetter
  private grounder: Grounder
  readonly runtime: Runtime
  private monitor: Monitor
  private store = new KeypointStore()
  private res: EpisodeResult = newResult('', 0)
  private tStart = 0
  private startPos: Record<string, Vec3> = {}
  private infos: SkillInfo[] = []
  private planParams: ParameterGroundings | null = null
  private finalOk: Record<number, boolean> = {}
  private cfg: Config
  private task: TaskSpec
  private emit: Emit

  constructor(
    private env: MuJoCoEnv, private llm: LLM, cfg: Config, task: TaskSpec,
    opts: { emit?: Emit; library?: SkillLibrary | null; grounder?: Grounder; hooks?: PipelineHooks } = {},
  ) {
    this.cfg = applyProfile(cfg, env.profile) // this arm's speeds / options
    this.task = env.task.scene_context !== task.scene_context ? { ...task, scene_context: env.task.scene_context } : task // the scene as this arm sees it
    this.emit = opts.emit ?? (() => undefined)
    this.library = opts.library ?? null
    this.hooks = opts.hooks ?? {}
    this.decomposer = new TaskDecomposer(llm, env.profile)
    this.skillgen = new SkillGenerator(llm, env.profile)
    this.paramset = new ParameterSetter(llm, env.profile)
    this.grounder = opts.grounder ?? new OracleGrounder(env)
    this.runtime = new Runtime(env, this.cfg as unknown as ExecCfg, env.q_home)
    this.monitor = new Monitor(env.profile.grasp_min_width)
    for (const a of [this.decomposer, this.skillgen, this.paramset]) a.emit = this.emit
  }
  private library: SkillLibrary | null
  private hooks: PipelineHooks

  // ------------------------------------------------------------------ helpers
  private async plan(failureContext: string | null): Promise<{ dec: Decomposition; recipes: SkillRecipes; params: ParameterGroundings }> {
    const obs = this.env.render('scene')
    const t = this.task
    let dec: Decomposition
    if (this.cfg.pipeline.use_decomposer ?? true) dec = await this.decomposer.run(t.instruction, obs, t.scene_context, failureContext)
    else
      dec = {
        observations: '', feasible: true, reason: '', clears_obstacle: false,
        subtasks: [{ id: 1, name: t.instruction, description: 'Complete the whole task' }],
      }
    this.res.observations = dec.observations
    if (!dec.feasible) throw new Infeasible(dec.reason)
    const { recipes, infos } = await this.skillgen.run(t.instruction, dec, t.keypoints, this.library, failureContext)
    this.infos = infos
    this.emit({
      type: 'recipes', recipes: recipes.recipes,
      skills: infos.map((i) => ({ subtask_id: i.subtask_id, skill: i.skill_name, reused: i.reused, description: i.description })),
      library_size: this.library ? this.library.names().length : 0,
    })
    const hints: Record<number, Record<string, number>> = {}
    for (const i of infos) {
      const sk = i.reused && this.library ? this.library.get(i.skill_name) : undefined
      if (sk) hints[i.subtask_id] = { ...sk.defaults }
    }
    const params = await this.paramset.run(t.instruction, dec, recipes, obs, t.scene_context, failureContext, hints)
    this.planParams = params
    return { dec, recipes, params }
  }

  /** Ground every object keypoint the plan needs, once, from a clean image of the scene. */
  private async groundPlan(recipes: SkillRecipes): Promise<void> {
    const need = new Map<string, KeypointRequest>()
    for (const r of recipes.recipes) for (const k of r.keypoints) if (!need.has(k.name)) need.set(k.name, k)
    const todo = this.store.missing(need.keys()).map((n) => need.get(n)!)
    if (!todo.length) return
    const obs = this.env.render('scene')
    const kps = await this.grounder.ground(todo, obs)
    this.store.update(kps)
    const pixels = this.grounder.lastPixels
    const havePixels = Object.keys(pixels).length > 0
    this.emit({
      type: 'grounding', image: (havePixels ? await this.hooks.overlayJpegBase64?.('scene', pixels) : undefined) || ((await this.hooks.sceneJpegBase64?.()) ?? ''),
      keypoints: Object.fromEntries(Object.entries(kps).map(([n, k]) => [n, {
        pos: round(k.pos, 4), normal: k.normal ? round(k.normal, 3) : null, pixel: havePixels ? (pixels[n] ?? null) : null,
      }])),
    })
    for (const [name, kp] of Object.entries(kps)) {
      if (!this.env.hasKeypoint(name)) continue
      const [gtP, gtN] = this.env.gtKeypoint(name)
      this.res.grounding_err_mm.push(norm([kp.pos[0] - gtP[0], kp.pos[1] - gtP[1], kp.pos[2] - gtP[2]]) * 1000)
      if (kp.normal) {
        const c = Math.min(1, Math.max(-1, kp.normal[0] * gtN[0] + kp.normal[1] * gtN[1] + kp.normal[2] * gtN[2]))
        this.res.normal_err_deg.push((Math.acos(c) * 180) / Math.PI)
      }
    }
  }

  /** Coarse-to-fine grounding: when the gripper is about to reach for a keypoint and already hovers near it, look again
   *  with the wrist camera. Only meaningful for grounders that look at pixels (the oracle has nothing to refine). */
  private async wristRefine(recipe: SkillRecipe): Promise<void> {
    if (!this.cfg.pipeline.wrist_refine || !('refineIters' in this.grounder)) return
    const s = this.env.state()
    const names: string[] = []
    for (const c of recipe.controllers) {
      const k = c.type === 'PosAlign' && c.source === 'eef_tcp' ? keypointOf(c.target) : null
      if (k && k in this.store.kps && !(k in this.store.held) && !names.includes(k)) names.push(k)
    }
    for (const n of names) {
      const old = this.store.kps[n]!
      if (Math.hypot(old.pos[0] - s.tcp_pos[0], old.pos[1] - s.tcp_pos[1]) > 0.1) continue // not above it yet: a close-up is useless
      const obs = this.env.render('wrist')
      let neu: Keypoint
      try {
        const desc = recipe.keypoints.find((k) => k.name === n)?.description ?? this.task.keypoints[n] ?? ''
        neu = (await this.grounder.ground([{ name: n, description: desc }], obs))[n]!
      } catch (e) {
        if (!(e instanceof GroundingError || e instanceof AgentError)) throw e
        this.emit({ type: 'status', text: `wrist re-grounding of ${n} failed, keeping the scene estimate (${e.message})` })
        continue
      }
      const jump = norm([neu.pos[0] - old.pos[0], neu.pos[1] - old.pos[1], neu.pos[2] - old.pos[2]])
      if (jump > 0.06) {
        // implausible: keep the old estimate
        this.emit({ type: 'status', text: `wrist re-grounding of ${n} moved it ${(jump * 100).toFixed(0)} cm - rejected` })
        continue
      }
      this.store.kps[n] = neu
      this.res.wrist_refinements++
      if (this.env.hasKeypoint(n)) {
        const g = this.env.gtKeypoint(n)[0]
        this.res.refined_err_mm.push(norm([neu.pos[0] - g[0], neu.pos[1] - g[1], neu.pos[2] - g[2]]) * 1000)
      }
      const pixels = this.grounder.lastPixels
      this.emit({
        type: 'grounding', source: 'wrist close-up', image: (await this.hooks.overlayJpegBase64?.('wrist', pixels)) ?? '',
        keypoints: Object.fromEntries(Object.entries(this.store.kps).filter(([k]) => !(k in this.store.held)).map(([k, v]) => [k, {
          pos: round(v.pos, 4), normal: v.normal ? round(v.normal, 3) : null, pixel: pixels[k] ?? null,
        }])),
      })
    }
  }

  private async commitSkills(episodeOk: boolean): Promise<void> {
    // Learn: save NEW skills after a successful episode; update the stats of reused ones.
    if (!this.library || !this.infos.length || !this.planParams) return
    for (const info of this.infos) {
      const sid = info.subtask_id
      const name = info.skill_name
      const rec = info.recipe
      const declared = new Set(rec.params.map((p) => p.name))
      const values = Object.fromEntries(Object.entries(ParameterSetter.valuesFor(this.planParams, sid)).filter(([k]) => declared.has(k)))
      if (info.reused) {
        if (sid in this.finalOk) {
          await this.library.record(name, this.finalOk[sid]!, values)
          this.res.skills_reused.push(name)
        }
      } else if (episodeOk && (this.finalOk[sid] ?? false)) {
        await this.library.add(mkSkill({
          name, description: info.description.trim(), roles: Object.keys(info.role_bindings).sort(),
          controllers: generalize(rec.controllers, info.role_bindings), params: rec.params, defaults: values, uses: 1, successes: 1,
        }))
        this.res.skills_new.push(name)
      }
    }
    this.emit({ type: 'library', skills: this.library.api() })
  }

  /** Runtime hook: a stage converged -> update what the robot is holding (keypoint tracking). */
  private stageDone = (stage: { name: string }[]): void => {
    const grippers = stage.filter((c): c is Gripper => c instanceof Gripper)
    const actions = grippers.map((c) => c.action)
    if (actions.includes('close') && this.env.state().gripper_width >= this.monitor.minGraspWidth) this.store.onGrasp(Object.keys(this.store.kps), this.env.state())
    else if (actions.includes('open')) this.store.onRelease(this.env.state())
  }

  /** Horizontal direction along which the open fingers will lie when this subtask grasps. */
  private fingerDir(recipe: SkillRecipe, values: Record<string, number>): [number, number] {
    const st = this.env.state()
    const yaw = recipe.controllers.find((c) => c.type === 'YawAlign')
    if (yaw) {
      try {
        const names = recipe.keypoints.map((k) => k.name)
        const ctx: Context = { robot: this.env, state: st, keypoints: this.store.snapshot(names, st), cfg: this.cfg as unknown as ExecCfg, t_stage: 0, dt: 0.02 }
        const v = ctxVector(ctx, yaw.target!).slice(0, 2)
        if (Math.hypot(v[0]!, v[1]!) > 1e-6) {
          const n = Math.hypot(v[0]!, v[1]!)
          const u: [number, number] = [v[0]! / n, v[1]! / n]
          const ang = values[yaw.param!] ?? 90
          return Math.abs(ang - 90) < 45 ? [-u[1], u[0]] : u
        }
      } catch {
        /* keypoint missing: fall through to the gripper's own orientation */
      }
    }
    const e = [st.tcp_rot[1], st.tcp_rot[4]]
    const n = Math.hypot(e[0]!, e[1]!)
    return [e[0]! / n, e[1]! / n]
  }

  /** A top-down gripper cannot point opposite to a sideways-facing surface (e.g. the cap of a bottle lying down). */
  private checkGeometry(recipes: SkillRecipes, params: ParameterGroundings): string | null {
    for (const recipe of recipes.recipes) {
      const values = ParameterSetter.valuesFor(params, recipe.subtask_id)
      for (const c of recipe.controllers) {
        if (!(c.type === 'AxisAlign' && (c.source === 'eef_z' || c.source === 'eef_z_axis') && /(_normal|_norm)$/.test(c.target ?? ''))) continue
        const k = keypointOf(c.target)!
        const kp = this.store.kps[k]
        if (!kp || !kp.normal || k in this.store.held) continue
        const ang = values[c.param!] ?? 180
        if (ang > 120 && Math.abs(kp.normal[2]) < 0.6) {
          const n = kp.normal
          const sg = (x: number) => (x >= 0 ? '+' : '') + x.toFixed(2)
          return (
            `Surface check: keypoint '${k}' lies on a surface whose normal points SIDEWAYS (n = ${sg(n[0])}, ${sg(n[1])}, ${sg(n[2])} in world x, y, z). ` +
            `Aligning the gripper with it (AxisAlign eef_z vs ${c.target}, ${ang.toFixed(0)} deg) would make the gripper point horizontally, which this ` +
            'top-down gripper cannot do. Do NOT clear anything: re-plan the task and grasp/target a point on an ' +
            'UPWARD-facing surface instead (for an object lying on its side, define new keypoints such as ' +
            '`<obj>_body_center`: the top of its body, and `<obj>_cap_end`: its far end). To point the gripper ' +
            'straight down use AxisAlign(eef_z, world_z, 180) - never the measured normal of a curved surface.'
          )
        }
      }
    }
    return null
  }

  /** Clearance check at every grasp target: would a finger hit a neighbouring object? */
  private checkObstacles(recipes: SkillRecipes, params: ParameterGroundings): string | null {
    for (const recipe of recipes.recipes) {
      if (!recipe.controllers.some((c) => c.type === 'Gripper' && c.action === 'close')) continue
      const targets: string[] = []
      for (const c of recipe.controllers) {
        const k = c.type === 'PosAlign' && c.source === 'eef_tcp' ? keypointOf(c.target) : null
        if (k && k in this.store.kps && !(k in this.store.held) && !targets.includes(k)) targets.push(k)
      }
      const values = ParameterSetter.valuesFor(params, recipe.subtask_id)
      for (const k of targets) {
        const res = analyzeReach(this.env, this.store.kps[k]!.pos, this.fingerDir(recipe, values), this.env.profile.finger)
        if (res.blocked) {
          const nearby = Object.fromEntries(Object.entries(this.store.kps).filter(([n]) => n !== k).map(([n, kp]) => [n, kp.pos]))
          return describeReach(res, k, nearby)
        }
      }
    }
    return null
  }

  /** Run all subtasks; return a failure description or null. */
  private async executePlan(dec: Decomposition, recipes: SkillRecipes, params: ParameterGroundings, tag: string, checkObstacles = false): Promise<string | null> {
    const pc = this.cfg.pipeline
    const names = Object.fromEntries(dec.subtasks.map((s) => [s.id, s.name]))
    this.finalOk = {}
    this.monitor.reset()
    this.monitor.expectGrasp = !dec.clears_obstacle
    this.store.clear()
    try {
      await this.groundPlan(recipes)
    } catch (e) {
      if (e instanceof GroundingError || e instanceof AgentError) return `grounding failed: ${e.message}`
      throw e
    }
    if (checkObstacles && this.cfg.pipeline.obstacle_check) {
      const blocked = this.checkGeometry(recipes, params) || this.checkObstacles(recipes, params)
      if (blocked) return 'OBSTACLE: ' + blocked
    }
    this.res.subtasks_total += dec.subtasks.length
    for (const recipe of recipes.recipes) {
      const sid = recipe.subtask_id
      const name = names[sid]!
      const values = ParameterSetter.valuesFor(params, sid)
      const script = compileSubtask(recipe, name, values)
      const reqNames = recipe.keypoints.map((k) => k.name)
      for (let attempt = 0; attempt < 1 + pc.max_subtask_retries; attempt++) {
        if (this.env.state().t - this.tStart > MAX_EPISODE_SIM_SECONDS) return 'episode time budget exhausted'
        const snap = (): Record<string, Keypoint> => this.store.snapshot(reqNames, this.env.state())
        await this.wristRefine(recipe)
        const kps = snap()
        this.emit({ type: 'subtask_start', id: sid, name, attempt, script: scriptText(script) })
        const out = await this.runtime.runSubtask(script, snap, this.stageDone)
        const verdict = this.monitor.check(script, out)
        this.res.subtask_log.push({
          plan: tag, subtask: sid, name, attempt, reason: out.reason, sim_s: Math.round(out.sim_seconds * 100) / 100,
          gripper_mm: Math.round(out.gripper_width * 10000) / 10, ok: verdict.ok, verdict: verdict.reason, script: scriptText(script),
          keypoints: Object.fromEntries(Object.entries(kps).map(([k, v]) => [k, round(v.pos, 4)])),
        })
        this.emit({ type: 'subtask_end', id: sid, name, ok: verdict.ok, reason: out.reason, verdict: verdict.reason, sim_s: Math.round(out.sim_seconds * 100) / 100 })
        this.finalOk[sid] = verdict.ok
        if (verdict.ok) {
          this.res.subtasks_ok++
          break
        }
        if (attempt < pc.max_subtask_retries && out.reason === 'timeout') {
          this.res.retries++
          continue
        }
        return verdict.reason
      }
    }
    return null
  }

  // ------------------------------------------------------------------ episode
  /** reset=false continues from the simulator's current state (persistent session): the arm first returns home,
   *  objects stay wherever earlier commands left them. */
  async run(seed: number, reset = true): Promise<EpisodeResult> {
    const t0 = performance.now()
    const res = (this.res = newResult(this.task.name, seed))
    this.llm.usage = new Usage()
    for (const a of [this.decomposer, this.skillgen, this.paramset]) a.trace = []
    const pc = this.cfg.pipeline
    try {
      if (reset) this.env.reset(seed)
      else if (norm(this.env.state().q.map((q, i) => q - this.env.q_home[i]!)) > 0.05 || this.env.state().gripper_width < 0.87 * this.env.max_width) {
        this.emit({ type: 'status', text: 'returning to the home pose' })
        await this.runtime.goHome()
      }
      this.tStart = this.env.state().t
      this.startPos = Object.fromEntries(this.task.objects.map((o) => [o.name, [...this.env.objectPos(o.name)] as Vec3]))
      let failure: string | null = null
      let replansUsed = 0
      let obstacleRounds = 0
      let planNo = 0
      for (;;) {
        const { dec, recipes, params } = await this.plan(failure)
        let tries = 0
        for (;;) {
          failure = await this.executePlan(dec, recipes, params, `p${planNo}` + (tries ? `r${tries}` : ''),
            !dec.clears_obstacle && obstacleRounds < (pc.max_obstacle_rounds ?? 2))
          if (failure === null || failure.startsWith('OBSTACLE:') || tries >= (pc.max_regrounds ?? 0) || failure.includes('time budget')) break
          // targeted feedback: the plan is probably fine, the perception was not -> home, look again, re-run
          tries++
          res.regrounds++
          this.emit({ type: 'status', text: `${failure} - returning home to look again (attempt ${tries + 1})` })
          await this.runtime.goHome()
          if ('tempBoost' in this.grounder) (this.grounder as unknown as { tempBoost: number }).tempBoost = 0.4
        }
        if ('tempBoost' in this.grounder) (this.grounder as unknown as { tempBoost: number }).tempBoost = 0
        planNo++
        if (failure === null) {
          if (dec.clears_obstacle && planNo < 8) {
            // obstacle gone: plan the actual task again from the new scene
            await this.commitSkills(true)
            res.obstacles_cleared++
            this.emit({ type: 'status', text: 'obstacle cleared - looking at the scene again to plan the task' })
            await this.runtime.goHome()
            continue
          }
          break
        }
        if (failure.startsWith('OBSTACLE:') && planNo < 8) {
          obstacleRounds++
          res.obstacles.push(failure.slice('OBSTACLE:'.length).trim())
          this.emit({ type: 'obstacle', text: res.obstacles[res.obstacles.length - 1] })
          continue // `failure` is handed to the agents as planning context
        }
        res.error = failure
        if (replansUsed < pc.max_replans) {
          replansUsed++
          res.replans++
          this.emit({ type: 'replan', reason: failure })
          await this.runtime.goHome()
          const w = this.env.state().gripper_width
          failure = `The previous plan failed: ${failure}. The gripper is currently ${w > 0.06 ? 'open' : 'closed'} (opening ${(w * 1000).toFixed(0)} mm). Plan a recovery from the current scene.`
          continue
        }
        break
      }
      if (failure === null) res.error = ''
      await this.runtime.hold(1.0)
      const ev = evaluate(this.env, this.task, this.startPos)
      res.verified = ev.success !== null
      res.success = res.verified ? (ev.success as boolean) : res.error === ''
      res.predicates = ev.predicates
      await this.commitSkills(res.success)
    } catch (e) {
      if (e instanceof Aborted) throw e
      if (e instanceof Infeasible) {
        res.error = `cannot do this: ${e.message}`
        res.infeasible = true
        res.verified = false
        res.success = false
      } else {
        // keep benchmark runs going; the failure is recorded on the episode
        res.error = e instanceof Error && e.name === 'BedrockError' ? e.message : `${e instanceof Error ? e.constructor.name : 'Error'}: ${e instanceof Error ? e.message : String(e)}`
      }
    }
    const u = this.llm.usage
    res.llm_calls = u.nCalls
    res.llm_calls_by_agent = u.byAgent()
    res.input_tokens = u.inputTokens
    res.output_tokens = u.outputTokens
    res.cost_usd = u.cost(this.llm.pricing)
    res.llm_latency_s = u.latencyS
    res.wall_s = (performance.now() - t0) / 1000
    res.sim_s = this.env.state().t - this.tStart
    return res
  }
}

