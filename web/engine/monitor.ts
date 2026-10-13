/** Episode monitor (monitor.py) and the ground-truth success predicates (bench/success_checks.py). */
import type { SuccessPredicate, TaskSpec } from './data'
import type { MuJoCoEnv } from './env'
import { norm, type Vec3 } from './linalg'
import { Gripper } from './controllers'
import type { SubtaskResult, SubtaskScript } from './execution'

export interface Verdict {
  ok: boolean
  reason: string
}

const GRASP_MIN_WIDTH = 0.008 // closed gripper narrower than this = nothing in the fingers

export class Monitor {
  holding = false
  expectGrasp = true // false in obstacle-clearing plans: the closed gripper is a pusher, not a grasp
  constructor(public minGraspWidth: number = GRASP_MIN_WIDTH) {}
  reset(): void {
    this.holding = false
  }
  check(script: SubtaskScript, res: SubtaskResult): Verdict {
    const actions = script.stages.flatMap((st) => st.filter((c): c is Gripper => c instanceof Gripper).map((c) => c.action))
    if (!res.success) return { ok: false, reason: `subtask '${res.name}' did not finish (${res.reason} after ${res.sim_seconds.toFixed(1)}s)` }
    if (actions.includes('close') && !this.expectGrasp) return { ok: true, reason: '' }
    if (actions.includes('close')) {
      if (res.gripper_width < this.minGraspWidth) return { ok: false, reason: `grasp missed: gripper closed to ${(res.gripper_width * 1000).toFixed(1)} mm on nothing` }
      this.holding = true
    } else if (actions.includes('open')) this.holding = false
    else if (this.holding && res.gripper_width < this.minGraspWidth) return { ok: false, reason: 'the held object was dropped during the motion' }
    return { ok: true, reason: '' }
  }
}

const calm = (env: MuJoCoEnv, obj: string): boolean => norm(env.objectVel(obj)) < 0.05

function inside(env: MuJoCoEnv, obj: string, box: string): boolean {
  const o = env.objectPos(obj)
  const b = env.objectPos(box)
  const D = env.dims
  const inner = D.tray_half - D.tray_wall_t
  return Math.abs(o[0] - b[0]) < inner && Math.abs(o[1] - b[1]) < inner && o[2] < (0.11 * D.tray_half) / 0.09 && calm(env, obj)
}

function onTop(env: MuJoCoEnv, obj: string, base: string, size?: number): boolean {
  const o = env.objectPos(obj)
  const b = env.objectPos(base)
  const sz = size || env.dims.cube
  return Math.hypot(o[0] - b[0], o[1] - b[1]) < 0.6 * sz && Math.abs(o[2] - b[2] - sz) < 0.3 * sz && calm(env, obj)
}

function outside(env: MuJoCoEnv, obj: string, box: string, start?: Record<string, Vec3>): boolean {
  const o = env.objectPos(obj)
  const b = env.objectPos(box)
  const s = start?.[obj]
  if (s && Math.hypot(o[0] - s[0], o[1] - s[1]) < 0.06) return false // it never moved: 'outside' was already true
  const clear = env.dims.tray_half + 0.015
  return (Math.abs(o[0] - b[0]) > clear || Math.abs(o[1] - b[1]) > clear) && o[2] < 0.1 && calm(env, obj)
}

export function evaluate(env: MuJoCoEnv, task: TaskSpec, start?: Record<string, Vec3>): { success: boolean | null; predicates: Record<string, boolean> } {
  const results: Record<string, boolean> = {}
  for (const p of task.success as SuccessPredicate[]) {
    results[`${p.type}(${p.object},${p.target})`] =
      p.type === 'outside' ? outside(env, p.object, p.target, start) : p.type === 'inside' ? inside(env, p.object, p.target) : onTop(env, p.object, p.target)
  }
  const vals = Object.values(results)
  return { success: vals.length ? vals.every(Boolean) : null, predicates: results }
}
