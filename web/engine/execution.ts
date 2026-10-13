/** Compiler (recipe + numbers -> staged controllers) and Runtime (the 50 Hz control loop): execution/*.py */
import {
  Controller, PosAlign, buildController, solveStack, type Context, type ExecCfg, type Keypoint, type RobotInterface,
  type TaskTerm,
} from './controllers'
import { matMulT, matToRotvec } from './linalg'
import type { SkillRecipe } from './schemas'

/** Raised inside the sim loop when the user presses Stop. */
export class Aborted extends Error {
  constructor() {
    super('aborted')
  }
}

export interface SubtaskScript {
  subtaskId: number
  name: string
  stages: Controller[][]
  values: Record<string, number>
}

export function scriptText(s: SubtaskScript): string {
  const lines = [`# subtask ${s.subtaskId}: ${s.name}`]
  s.stages.forEach((stage, i) => {
    lines.push(`stage ${i}:`)
    for (const c of [...stage].sort((a, b) => a.priority - b.priority)) lines.push(`  [p${c.priority}] ${c.describe()}`)
  })
  return lines.join('\n')
}

export function compileSubtask(recipe: SkillRecipe, name: string, values: Record<string, number>): SubtaskScript {
  const missing = recipe.controllers.filter((c) => c.param && !(c.param in values)).map((c) => c.param!)
  if (missing.length) throw new Error(`subtask ${recipe.subtask_id}: no value for parameters ${JSON.stringify([...new Set(missing)].sort())}`)
  const controllers = recipe.controllers.map((spec) => buildController(spec, values))
  const nStages = 1 + controllers.reduce((m, c) => Math.max(m, c.stage), 0)
  const stages: Controller[][] = []
  for (let s = 0; s < nStages; s++) stages.push(controllers.filter((c) => c.stage === s))
  return { subtaskId: recipe.subtask_id, name, stages: stages.filter((s) => s.length), values: { ...values } }
}

const STALL_SECONDS = 2.0 // a stage that has not moved (position or orientation) for this long is stuck
const STALL_MOVE = 0.003 // ... 'moved' meaning more than 3 mm of end-effector pose change

export interface SubtaskResult {
  subtask_id: number
  name: string
  success: boolean
  reason: string
  sim_seconds: number
  stages_done: number
  gripper_width: number
}

export type KeypointProvider = Record<string, Keypoint> | (() => Record<string, Keypoint>)

export class Runtime {
  readonly dt: number
  private qDes: number[] | null = null

  constructor(public robot: RobotInterface, public cfg: ExecCfg, public qHome: number[]) {
    this.dt = 1 / cfg.sim.control_hz
  }

  async hold(seconds = 0.2): Promise<void> {
    const n = Math.trunc(seconds / this.dt)
    for (let i = 0; i < n; i++) {
      this.servo([])
      await this.robot.stepAsync()
    }
  }

  private holdTerms(s: ReturnType<RobotInterface['state']>, pHold: number[], RHold: number[]): TaskTerm[] {
    const c = this.cfg.execution
    const [jp, jr] = this.robot.jacobian(s.tcp_pos)
    const eRot = matToRotvec(matMulT(RHold, s.tcp_rot))
    return [
      { J: jp, e: new Float64Array([pHold[0]! - s.tcp_pos[0], pHold[1]! - s.tcp_pos[1], pHold[2]! - s.tcp_pos[2]]), gain: c.pos_gain, v_max: c.max_lin_speed },
      { J: jr, e: new Float64Array(eRot), gain: c.ang_gain, v_max: c.max_ang_speed },
    ]
  }

  /** Recovery motion: open the gripper and return to the home posture (clears the camera's view). */
  async goHome(seconds = 2.5): Promise<void> {
    await this.liftClear()
    this.robot.setGripper(this.robot.max_width)
    const q0 = this.robot.state().q.slice()
    const n = Math.trunc(seconds / this.dt)
    for (let i = 1; i <= n; i++) {
      const a = i / n
      const k = a * a * (3 - 2 * a)
      this.robot.setJointTargets(q0.map((q, j) => q + (this.qHome[j]! - q) * k))
      await this.robot.stepAsync()
    }
    this.qDes = null
    await this.hold(0.3)
  }

  /** A gripper resting low (beside an object) first rises straight up: swinging home through joint space from there
   *  can sweep it through the table or the objects. */
  private async liftClear(below = 0.06, by = 0.04, seconds = 1.5): Promise<void> {
    const s = this.robot.state()
    if (s.tcp_pos[2] >= below) return
    const ctl = new PosAlign('eef_tcp', 'eef_tcp', 'z', by, 1, 0)
    const saved = this.cfg
    this.cfg = { ...this.cfg, execution: { ...this.cfg.execution, max_subtask_seconds: seconds } }
    try {
      await this.runSubtask({ subtaskId: 0, name: 'lift clear', stages: [[ctl]], values: {} }, {})
    } catch (e) {
      if (e instanceof Aborted) throw e // best effort otherwise: the joint-space move follows anyway
    } finally {
      this.cfg = saved
    }
  }

  private servo(levels: TaskTerm[][]): void {
    const s = this.robot.state()
    if (this.qDes === null) this.qDes = s.q.slice()
    const c = this.cfg.execution
    const n = this.robot.n_joints
    const dq = levels.length
      ? solveStack(levels, n, c.damping, this.qHome.map((q, i) => q - s.q[i]!))
      : new Float64Array(n) // nothing to track (e.g. gripper-only stage): hold the pose
    // integrate the target, but never let it run far ahead of the measured joints
    const prev = this.qDes
    this.qDes = prev.map((q, i) => Math.min(Math.max(q + dq[i]! * this.dt, s.q[i]! - 0.12), s.q[i]! + 0.12))
    this.robot.setJointTargets(this.qDes)
  }

  /** `keypoints`: a dict, or a callable returning the current keypoint snapshot (re-read at every stage). */
  async runSubtask(script: SubtaskScript, provider: KeypointProvider, onStageDone?: (stage: Controller[]) => void): Promise<SubtaskResult> {
    this.qDes = null
    const c = this.cfg.execution
    const t0 = this.robot.state().t
    let stagesDone = 0
    const fail = (s: ReturnType<RobotInterface['state']>, why: string): SubtaskResult => ({
      subtask_id: script.subtaskId, name: script.name, success: false, reason: why, sim_seconds: s.t - t0, stages_done: stagesDone,
      gripper_width: s.gripper_width,
    })
    const mkCtx = (s: ReturnType<RobotInterface['state']>, kps: Record<string, Keypoint>, ts: number): Context =>
      ({ robot: this.robot, state: s, keypoints: kps, cfg: this.cfg, t_stage: ts, dt: this.dt })
    const windowLen = Math.trunc(STALL_SECONDS / this.dt)
    for (const stage of script.stages) {
      const keypoints = typeof provider === 'function' ? provider() : provider
      const ctx0 = mkCtx(this.robot.state(), keypoints, 0)
      for (const ctl of stage) ctl.onStageStart(ctx0)
      const grip = stage.map((ctl) => ctl.gripperCommand()).filter((g): g is number => g !== null)
      if (grip.length) this.robot.setGripper(grip[grip.length - 1]!)
      let okTicks = 0
      let ts = 0
      const window: number[][] = [] // recent end-effector pose, to notice "stuck"
      const s0 = this.robot.state()
      const pHold = [...s0.tcp_pos]
      const RHold = [...s0.tcp_rot]
      for (;;) {
        const s = this.robot.state()
        if (s.t - t0 > c.max_subtask_seconds) {
          const tctx = mkCtx(s, keypoints, ts)
          const stuck = stage.filter((ctl) => !ctl.finished(tctx)).map((ctl) => ctl.describe())
          return fail(s, 'timeout' + (stuck.length ? ` (not converged: ${stuck.join('; ')})` : ''))
        }
        window.push([...s.tcp_pos, ...s.tcp_rot.map((x) => 0.1 * x)]) // 1 rad of rotation ~ 0.1 m
        if (window.length > windowLen) window.shift()
        if (window.length === windowLen && ts > STALL_SECONDS + 0.5) {
          const tctx = mkCtx(s, keypoints, ts)
          const stuck = stage.filter((ctl) => !ctl.finished(tctx)).map((ctl) => ctl.describe())
          if (stuck.length) {
            let ptp = 0
            for (let k = 0; k < window[0]!.length; k++) {
              let lo = Infinity
              let hi = -Infinity
              for (const w of window) {
                lo = Math.min(lo, w[k]!)
                hi = Math.max(hi, w[k]!)
              }
              ptp = Math.max(ptp, hi - lo)
            }
            if (ptp < STALL_MOVE)
              return fail(s, `stalled: no progress for 2 s, the target is probably out of reach or blocked (not converged: ${stuck.join('; ')})`)
          }
        }
        const ctx = mkCtx(s, keypoints, ts)
        const terms = stage.map((ctl) => [ctl.priority, ctl.term(ctx)] as const)
        const prios = [...new Set(terms.map(([p]) => p))].sort((a, b) => a - b)
        const levels = prios.map((pr) => terms.filter(([p, t]) => p === pr && t !== null).map(([, t]) => t!)).filter((lv) => lv.length)
        if (levels.length) levels.push(this.holdTerms(s, pHold, RHold)) // lowest priority: axes nobody commands stay put
        this.servo(levels)
        await this.robot.stepAsync()
        ts += this.dt
        const done = stage.every((ctl) => ctl.finished(mkCtx(this.robot.state(), keypoints, ts)))
        okTicks = done ? okTicks + 1 : 0
        if (okTicks >= 3) break
      }
      stagesDone++
      onStageDone?.(stage)
    }
    const s = this.robot.state()
    return {
      subtask_id: script.subtaskId, name: script.name, success: true, reason: 'converged', sim_seconds: s.t - t0,
      stages_done: stagesDone, gripper_width: s.gripper_width,
    }
  }
}

