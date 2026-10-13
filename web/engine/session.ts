/**
 * A Dooms simulation session that runs in the browser (worker): the counterpart of server/worker.py's session_main.
 * It speaks the same protocol as the WebSocket session - JSON commands in (load / reset / run / stop), JSON events and
 * binary pose / camera streams out - so the UI store and 3D viewer cannot tell the difference.
 */
import { OracleGrounder, type Grounder } from './agents'
import { taskForCommand } from './command'
import { DEFAULT_CONFIG, DEFAULT_ROBOT, TASKS, deepUpdate, getProfile, loadTask, profileSupports, type Config } from './data'
import { MuJoCoEnv, type CameraParams } from './env'
import { Aborted } from './execution'
import type { ImageCodec } from './imageOps'
import { NO_PRICING, type LLM } from './llm'
import type { MujocoApi } from './mujocoApi'
import type { AssetSource } from './mujocoLoader'
import { Pipeline, type EpisodeResult } from './pipeline'
import { ScriptedLLM } from './scriptedLlm'
import { exportScene } from './sceneExport'
import { SkillLibrary, type SkillStorage } from './skills'
import type { SceneData, StoredSkill } from '../types'
export { localConfig } from './localConfig'

/** Browser-side camera renderer (three.js on an OffscreenCanvas). Absent under Node and where WebGL is unavailable. */
export interface FrameRenderer {
  setScene(scene: SceneData): void
  updatePoses(poses: Float32Array): void
  /** Render an env camera (MuJoCo convention, see CameraParams) at the given size; returns the encoded image. */
  render(camera: CameraParams, opts: { width: number; height: number; mime: 'image/jpeg' | 'image/png'; quality?: number }): Promise<Uint8Array | null>
}

export interface SessionHost {
  event(ev: Record<string, unknown>): void
  pose(t: number, poses: Float32Array): void
  frame(jpeg: Uint8Array): void
}

export interface LlmContext {
  kind: string
  task: ReturnType<typeof loadTask>
  env: MuJoCoEnv
  pair: [string, string] | null
  msg: Record<string, unknown>
}
/** Create the model client for a planner kind (null: unknown kind). The Demo planner is built in; 'bedrock' is Claude. */
export type LlmFactory = (ctx: LlmContext) => LLM | null | Promise<LLM | null>

/** Claude, called from this very worker with the credentials that came with the run command: the Claude API or Amazon Bedrock. */
export async function bedrockFactory(ctx: LlmContext): Promise<LLM | null> {
  if (ctx.kind !== 'bedrock') return null
  const [{ bedrockFromMessage }, { registerPrompts }] = await Promise.all([import('./bedrock/client'), import('./prompts')])
  registerPrompts()
  // a Claude API key goes to api.anthropic.com; AWS keys or a Bedrock API key go to Amazon Bedrock
  if ((ctx.msg.credentials as { api_key?: string } | undefined)?.api_key) return (await import('./anthropic/client')).anthropicFromMessage(ctx.msg)
  return bedrockFromMessage(ctx.msg)
}

export interface SessionDeps {
  mj: MujocoApi
  assets: AssetSource
  host: SessionHost
  skillStorage: (robot: string) => SkillStorage
  renderer?: FrameRenderer | null
  llmFactory?: LlmFactory
  /** PNG decode/encode for vision grounding (default: OffscreenCanvas) */
  codec?: ImageCodec
  /** pace the simulation to wall-clock time (browser); tests turn it off */
  realtime?: boolean
}

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** Make every model call abortable: a network model (`llm.remote`) can take a minute, during which Stop must still work. */
export function makeCancellable(llm: LLM, isCancelled: () => boolean, pollMs = 100): LLM {
  if (!llm.remote) return llm // local planners are instant; the simulation loop checks the flag
  const original = llm.structured.bind(llm)
  llm.structured = (async (req: Parameters<LLM['structured']>[0]) => {
    if (isCancelled()) throw new Aborted()
    const call = original(req).then((value) => ({ value }))
    call.catch(() => undefined) // an abandoned call may still fail later; nobody is listening
    for (;;) {
      let done: { value: unknown } | null
      try {
        done = await Promise.race([call, wait(pollMs).then(() => null)])
      } catch (e) {
        if (isCancelled()) throw new Aborted()
        throw e
      }
      if (done) return done.value
      if (isCancelled()) {
        llm.abort?.() // drop the request on the wire too, not only its answer
        throw new Aborted()
      }
    }
  }) as LLM['structured']
  return llm
}

export const unsupportedPlanner = (kind: string): string =>
  `unknown planner '${kind}'`

export class SessionCore {
  private env: MuJoCoEnv | null = null
  private scene: string | null = null
  private robot: string = DEFAULT_ROBOT
  private seed = 0
  private runs = 0
  private cancelled = false
  private chain: Promise<void> = Promise.resolve()
  private baseCfg: Config = DEFAULT_CONFIG
  private frameBusy = false
  private lastFrameAt = 0
  private renderMs = 0

  constructor(private deps: SessionDeps) {}

  /** Commands run one at a time, in order; `stop` jumps the queue. */
  submit(msg: Record<string, unknown>): Promise<void> {
    if (msg.type === 'stop') {
      this.cancelled = true
      return Promise.resolve()
    }
    return this.enqueue(() => this.handle(msg))
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(fn)
    this.chain = next.then(() => undefined, () => undefined)
    return next
  }

  stop(): void {
    this.cancelled = true
  }

  private put(ev: Record<string, unknown>): void {
    this.deps.host.event(ev)
  }

  // ---------------------------------------------------------------- environment
  private async ensureEnv(scene: string, seed: number, forceReset: boolean, robot: string): Promise<MuJoCoEnv> {
    const profile = getProfile(robot)
    if (!profileSupports(profile, scene)) throw new Error(`the ${profile.label} does not support the '${scene}' scene`)
    const fresh = !this.env || this.scene !== scene || this.robot !== robot
    if (fresh) {
      this.env?.close()
      this.env = null
      this.env = await MuJoCoEnv.create(this.deps.mj, this.deps.assets, loadTask(scene), this.baseCfg, profile)
      this.scene = scene
      this.robot = robot
      this.deps.renderer?.setScene({ ...exportScene(this.env.model, this.env.data), robot: robot } as SceneData)
      this.env.imageProvider = async (camera) => this.renderImage(camera, 'image/png')
    }
    if (fresh || forceReset) {
      this.env!.reset(seed)
      this.seed = seed
      this.runs = 0
    }
    return this.env!
  }

  private async renderImage(camera: string, mime: 'image/jpeg' | 'image/png', quality = 0.75, size?: [number, number]): Promise<Uint8Array | null> {
    const env = this.env
    const r = this.deps.renderer
    if (!env || !r) return null
    const obs = env.render(camera)
    r.updatePoses(env.poseSnapshot().poses)
    return r.render(obs.camera, { width: size?.[0] ?? obs.camera.width, height: size?.[1] ?? obs.camera.height, mime, quality })
  }

  private async pushState(env: MuJoCoEnv): Promise<void> {
    const snap = env.poseSnapshot()
    this.deps.host.pose(snap.t, snap.poses)
    const jpg = await this.renderImage('scene', 'image/jpeg', 0.75, [480, 360])
    if (jpg) this.deps.host.frame(jpg)
  }

  private sceneState(): void {
    this.put({ type: 'scene_state', scene: this.scene, robot: this.robot, seed: this.seed, runs: this.runs })
  }

  /** GET /api/scene/{name}: renderable geometry + initial poses for `seed` (resets the world like the server's scene env). */
  sceneData(name: string, seed: number, robot: string): Promise<SceneData> {
    return this.enqueue(async () => {
      if (!TASKS[name]) throw new Error('unknown scene')
      const env = await this.ensureEnv(name, seed, true, robot)
      return { ...exportScene(env.model, env.data), view: getProfile(robot).view, robot } as SceneData
    })
  }

  // ---------------------------------------------------------------- protocol
  private async handle(msg: Record<string, unknown>): Promise<void> {
    const kind = msg.type
    this.cancelled = false // a Stop pressed while idle must not abort this command
    try {
      if (kind === 'load' || kind === 'reset') {
        const env = await this.ensureEnv(String(msg.scene), Number(msg.seed ?? 0), kind === 'reset', String(msg.robot || DEFAULT_ROBOT))
        await this.pushState(env)
        this.sceneState()
      } else if (kind === 'run') await this.run(msg)
    } catch (e) {
      if (e instanceof Aborted) {
        this.put({ type: 'stopped' })
        this.sceneState()
      } else {
        const name = e instanceof Error ? e.constructor.name : 'Error'
        this.put({ type: 'error', message: name === 'BedrockError' ? (e as Error).message : `${name}: ${e instanceof Error ? e.message : String(e)}`, trace: e instanceof Error ? (e.stack ?? '').slice(-1500) : '' })
      }
    } finally {
      if (kind === 'run') this.put({ type: 'ended' })
    }
  }

  private async run(msg: Record<string, unknown>): Promise<void> {
    const robot = String(msg.robot || DEFAULT_ROBOT)
    const scene = String(msg.scene)
    const env = await this.ensureEnv(scene, Number(msg.seed ?? 0), false, robot)
    const vision = msg.grounding === 'vlm' && String(msg.llm ?? 'scripted') === 'bedrock' // the Demo planner has no eyes: it grounds from the simulator
    const cfg = deepUpdate(this.baseCfg, { pipeline: { grounding: vision ? 'vlm' : 'oracle', record_video: false, skill_library_dir: msg.skills === false ? null : `library-${robot}` } })
    const text = String(msg.instruction ?? '').trim()
    const base = loadTask(scene)
    const { task, pair } = taskForCommand(base, text || base.instruction)
    const kind = String(msg.llm ?? 'scripted')
    if (kind === 'scripted' && pair === null && !base.success.length) {
      this.put({
        type: 'error',
        message: "The demo planner needs a command that names two objects, e.g. 'put the bottle into the box' or 'stack the red cube on the blue cube'. Free-form commands need the Claude (Bedrock) planner.",
      })
      return
    }
    if (vision && !this.deps.renderer) {
      this.put({
        type: 'error',
        message: 'Vision grounding needs the in-browser camera renderer (WebGL in a web worker), which this browser does not provide. Choose Oracle grounding.',
      })
      return
    }
    const ctx: LlmContext = { kind, task, env, pair, msg }
    const made = (await this.deps.llmFactory?.(ctx)) ?? (kind === 'scripted' ? new ScriptedLLM(task, env, pair) : await bedrockFactory(ctx))
    if (!made) throw new Error(unsupportedPlanner(kind))
    const llm = makeCancellable(made, () => this.cancelled)

    let library: SkillLibrary | null = null
    if (cfg.pipeline.skill_library_dir) {
      library = new SkillLibrary(this.deps.skillStorage(robot))
      await library.reload()
    }

    const speed = Number(msg.speed ?? 1)
    const realtime = this.deps.realtime !== false
    const clock = { t: env.data.time, wall: performance.now(), yielded: performance.now() }
    env.pace = async () => {
      if (this.cancelled) throw new Aborted()
      const t = env.data.time
      let now = performance.now()
      if (realtime && speed > 0) {
        // pace the simulation to wall-clock time
        const due = clock.wall + ((t - clock.t) / speed) * 1000
        if (due > now) {
          await wait(due - now)
          now = performance.now()
          clock.yielded = now
          if (this.cancelled) throw new Aborted()
        }
        clock.wall = now
      }
      clock.t = t
      if (now - clock.yielded > 20) {
        await wait(0) // let a Stop message (and camera-frame encoding) through
        clock.yielded = performance.now()
        if (this.cancelled) throw new Aborted()
      }
    }
    env.poseSink = (t, P) => this.deps.host.pose(t, P)
    env.frameEvery = 5
    env.frameSink = () => void this.streamFrame()

    const emit = (ev: Record<string, unknown>): void => {
      if (ev.type === 'agent' || ev.type === 'agent_start' || ev.type === 'agent_rejected') {
        const u = llm.usage
        ev = { ...ev, usage: { calls: u.nCalls, input_tokens: u.inputTokens, output_tokens: u.outputTokens, cost: u.cost(llm.pricing ?? NO_PRICING) } }
      }
      this.put(ev)
      clock.wall = performance.now() // LLM latency must not be "caught up" by fast-forwarding the sim
    }

    this.put({
      type: 'started', instruction: task.instruction, planner: kind, seed: this.seed, verified: task.success.length > 0,
      model: llm.defaultModel, continuing: this.runs > 0,
    })
    let res: EpisodeResult
    try {
      let grounder: Grounder = new OracleGrounder(env)
      if (vision) {
        const [{ VisionGrounder }, { browserCodec }] = await Promise.all([import('./vision'), import('./imageOps')])
        grounder = new VisionGrounder(llm, env.profile, env, this.deps.codec ?? browserCodec, cfg.pipeline.refine_iters)
      }
      const pipeline = new Pipeline(env, llm, cfg, task, {
        emit, library, grounder,
        hooks: {
          sceneJpegBase64: async () => toBase64((await this.renderImage('scene', 'image/jpeg', 0.85, [640, 480])) ?? new Uint8Array()),
          overlayJpegBase64: async (camera, pixels) => {
            // the same image the grounder saw (state has not changed since), with its answers drawn on
            try {
              const png = await this.renderImage(camera, 'image/png')
              if (!png) return ''
              const { browserCodec, drawPoints } = await import('./imageOps')
              const codec = this.deps.codec ?? browserCodec
              return toBase64(await codec.encode(drawPoints(await codec.decode(png), pixels), 'image/jpeg', 0.85))
            } catch {
              return ''
            }
          },
        },
      })
      res = await pipeline.run(this.seed, false)
    } finally {
      env.poseSink = null
      env.frameSink = null
      env.pace = null
    }
    this.runs++
    const d = { ...res, subtask_log: res.subtask_log.map((l) => Object.fromEntries(Object.entries(l).filter(([k]) => k !== 'script'))) } as EpisodeResult & { grounding_err_mm_mean: number | null }
    d.grounding_err_mm_mean = res.grounding_err_mm.length ? res.grounding_err_mm.reduce((a, b) => a + b, 0) / res.grounding_err_mm.length : null
    this.put({ type: 'done', result: d })
    this.sceneState()
  }

  /** Render the agents' camera and send it without stalling the simulation (one frame in flight at a time). */
  private async streamFrame(): Promise<void> {
    // at most ~10 frames per wall-clock second, and never more than a quarter of the worker's time: software WebGL can
    // take longer than a control tick to draw one
    const now = performance.now()
    if (this.frameBusy || !this.deps.renderer || !this.env || now - this.lastFrameAt < Math.max(90, 4 * this.renderMs)) return
    this.lastFrameAt = now
    this.frameBusy = true
    try {
      const t0 = performance.now()
      const jpg = await this.renderImage('scene', 'image/jpeg', 0.75, [480, 360])
      this.renderMs = performance.now() - t0
      if (jpg) this.deps.host.frame(jpg)
    } finally {
      this.frameBusy = false
    }
  }

  async listSkills(robot: string): Promise<StoredSkill[]> {
    const lib = new SkillLibrary(this.deps.skillStorage(robot))
    await lib.reload()
    return lib.api()
  }

  dispose(): void {
    this.env?.close()
    this.env = null
  }
}

export function toBase64(u8: Uint8Array): string {
  let s = ''
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000))
  return btoa(s)
}
