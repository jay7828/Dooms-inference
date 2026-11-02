/** Episode monitor (monitor.py) and the ground-truth success predicates (bench/success_checks.py). */
import { LAB, type SuccessPredicate, type TaskSpec } from './data'
import type { MuJoCoEnv } from './env'
import { norm, type Vec3 } from './linalg'
import { tubeHalf } from './sceneBuilder'
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

/** Share of `src`'s liquid drops that sit inside beaker `dst` at the end. */
export function pouredFraction(env: MuJoCoEnv, src: string, dst: string): number {
  const drops = env.dropPositions(src)
  if (!drops.length) return 0
  const spec = env.task.objects.find((o) => o.name === dst)
  const b = env.objectPos(dst)
  const inner = (spec?.radius ?? LAB.big_r) - LAB.wall + 0.003 // + the corners of the polygonal wall
  const top = b[2] + (spec?.height ?? LAB.big_h) + 0.01
  return drops.filter((p) => Math.hypot(p[0] - b[0], p[1] - b[1]) < inner && p[2] > b[2] && p[2] < top).length / drops.length
}

const POURED_MIN = 0.6 // at least 60 % of the liquid must end up in the target beaker

/** The tube stands in the rack hole `slot` (a keypoint site): centred in the hole, lowered in, upright and still. */
function inSlot(env: MuJoCoEnv, tube: string, slot: string): boolean {
  const t = env.objectPos(tube)
  const [s] = env.gtKeypoint(slot)
  const bottom = t[2] - tubeHalf() - LAB.tube_r
  return Math.hypot(t[0] - s[0], t[1] - s[1]) < LAB.hole / 2 && bottom < s[2] - 0.03 && env.bodyAxisZ(tube)[2] > 0.95 && calm(env, tube)
}

export function evaluate(env: MuJoCoEnv, task: TaskSpec, start?: Record<string, Vec3>): { success: boolean | null; predicates: Record<string, boolean> } {
  const results: Record<string, boolean> = {}
  for (const p of task.success as SuccessPredicate[]) {
    const check: Record<SuccessPredicate['type'], () => boolean> = {
      outside: () => outside(env, p.object, p.target, start), inside: () => inside(env, p.object, p.target), on_top: () => onTop(env, p.object, p.target),
      poured: () => pouredFraction(env, p.object, p.target) >= POURED_MIN, in_slot: () => inSlot(env, p.object, p.target),
    }
    results[`${p.type}(${p.object},${p.target})`] = check[p.type]()
  }
  const vals = Object.values(results)
  return { success: vals.length ? vals.every(Boolean) : null, predicates: results }
}
