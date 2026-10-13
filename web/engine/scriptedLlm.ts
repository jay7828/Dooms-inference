/**
 * The Demo planner: a scripted stand-in for Claude that returns a hand-written reference plan (llm/scripted.py), so the
 * whole stack runs without an AWS account. It implements the same LLM interface a Bedrock client would.
 */
import { referencedKeypoints } from './controllers'
import { FRANKA, type RobotProfile, type TaskSpec } from './data'
import type { MuJoCoEnv } from './env'
import { NO_PRICING, Usage, type LLM, type StructuredRequest } from './llm'
import {
  mkChoice, mkController, mkDecomposition,
  type ControllerSpec, type Decomposition, type KeypointRequest, type ParameterGroundings, type ParamSpec, type SkillChoice, type SkillPlan,
  type SkillRecipe, type SkillRecipes, type Subtask,
} from './schemas'
import type { Vec3 } from './linalg'

/** keypoints the planner defines itself (they are NOT in the scene vocabulary) */
const DEFINED: Record<string, string> = {
  table_free_spot: 'an empty spot of bare table, clear of all objects and the box',
  bottle_body_center: "the middle of the lying bottle's body, on its top surface",
  bottle_cap_end: 'the top of the cap at the far end of the lying bottle',
}

function keypointFor(task: TaskSpec, obj: string): string {
  for (const k of Object.keys(task.keypoints)) if (k.startsWith(obj)) return k
  throw new Error(`no keypoint for ${obj}`)
}

export interface ScriptNumbers {
  hover: number
  grasp: number
  lift: number
  hover_dest: number
  place_force: number | null
  place_z: number | null
  retract: number
}

/** Heights / offsets (m) of the reference plan for this arm. Franka values are the tuned originals; the SO-ARM101
 *  works a few centimetres above the table (its top-down reach ends near 0.08 m) so everything is small. */
export function scriptNumbers(profile: RobotProfile, obj: string, dest: string, lying: boolean): ScriptNumbers {
  const isCube = obj.startsWith('cube')
  if (profile.id === 'franka')
    return {
      hover: 0.12, grasp: isCube ? -0.014 : lying ? -0.02 : -0.016, lift: isCube || lying ? 0.15 : 0.2,
      hover_dest: lying ? 0.16 : isCube ? (dest === 'box' ? 0.2 : 0.12) : dest !== 'table' ? 0.3 : 0.26,
      place_force: 2.0, place_z: null, retract: 0.15,
    }
  const D = profile.dims
  const height = isCube ? D.cube : 2 * (D.bottle_half_h + D.cap_half_h) // held keypoint sits on the object's top
  const wall = 2 * D.tray_wall_half_h // wall height above the tray floor top
  const clear = 0.005
  const hoverDest = dest === 'box' ? height + wall + clear : dest === 'table' ? height + 0.012 : D.cube + 0.012
  return {
    hover: 0.03, grasp: isCube ? -0.007 : -0.012, lift: 0.03, hover_dest: hoverDest, place_force: null, place_z: height + 0.004, retract: 0.04,
  }
}

type Plan = { dec: Decomposition; rec: SkillRecipes | null; par: ParameterGroundings | null }

export function referencePlan(task: TaskSpec, pair: [string, string] | null, lyingIn: boolean, profile: RobotProfile = FRANKA): Plan {
  const [obj, dest] = pair ?? [task.success[0]!.object, task.success[0]!.target]
  const num = scriptNumbers(profile, obj, dest, lyingIn && obj === 'bottle')
  const force = profile.force_sensor
  // Franka: align with the grounded surface normal (tuned). Other arms: the exact world up vector, because the measured
  // normal of a small top face (a 1.4 cm cap) is several degrees off and the gripper would chase it.
  const NRM = (k: string): string => (profile.id === 'franka' ? `${k}_normal` : 'world_z')
  const lying = lyingIn && obj === 'bottle'
  const K = lying ? `${obj}_body_center` : keypointFor(task, obj)
  const KE = `${obj}_cap_end`
  const D = dest === 'box' ? 'box_inside' : dest === 'table' ? 'table_free_spot' : keypointFor(task, dest)
  const nice = obj.replace(/_/g, ' ')
  if (lying && dest === 'box')
    return {
      dec: mkDecomposition({
        observations: `The ${nice} is lying on its side (about 0.17 m long).`, feasible: false,
        reason: `The ${nice} is lying down and is longer than the box's inner width (0.148 m); a top-down parallel gripper cannot stand it up or fit it inside. It can only be moved on the table.`,
        subtasks: [],
      }),
      rec: null, par: null,
    }
  const names = [
    lying ? `Approach the lying ${nice} from above` : `Approach ${nice} for pre-grasp`,
    lying ? `Grasp the lying ${nice} across its body` : `Grasp the ${nice}`,
    `Lift the ${nice} up`, `Move over the ${dest.replace(/_/g, ' ')}`, `Place down the ${nice}`, 'Release and retract',
  ]
  const subtasks: Subtask[] = names.map((n, i) => ({ id: i + 1, name: n, description: n }))
  const C = mkController
  const xyz = (src: string, tgt: string, nm: Record<string, string>, stage = 0): ControllerSpec[] =>
    (['x', 'y', 'z'] as const).filter((a) => a in nm).map((a) => C({ type: 'PosAlign', source: src, target: tgt, axis: a, param: nm[a]!, priority: 1, stage }))
  const P = (name: string, description: string, unit: ParamSpec['unit']): ParamSpec => ({ name, description, unit })
  const isCube = obj.startsWith('cube')
  const grasp_yaw = isCube || lying // boxy or lying objects: fingers across the width
  const yawTarget = lying ? `${K}__to__${KE}` : `${K}_axis`
  const destCube = D.startsWith('cube')
  const dyaw = destCube ? [C({ type: 'YawAlign', source: 'eef_y', target: `${D}_axis`, param: 'o_yaw', priority: 2 })] : []
  const dyp = destCube ? [P('o_yaw', 'finger direction vs destination edge', 'deg')] : []
  const downD = C({ type: 'AxisAlign', source: 'eef_z', target: NRM(D), param: 'o_theta', priority: 2 })
  const yaw = grasp_yaw ? [C({ type: 'YawAlign', source: 'eef_y', target: yawTarget, param: 'o_yaw', priority: 2 })] : []
  const yp = grasp_yaw ? [P('o_yaw', 'finger direction vs object edge / long axis', 'deg')] : []
  const xy = (): ParamSpec[] => [P('o_x', 'x offset', 'm'), P('o_y', 'y offset', 'm')]
  const recipes: SkillRecipe[] = [
    {
      subtask_id: 1, keypoints: [],
      params: [...xy(), P('o_z', 'hover height above the grasp point', 'm'), P('o_theta', 'angle between gripper axis and surface normal', 'deg'), ...yp],
      controllers: [...xyz('eef_tcp', K, { x: 'o_x', y: 'o_y', z: 'o_z' }), C({ type: 'AxisAlign', source: 'eef_z', target: NRM(K), param: 'o_theta', priority: 2 }), ...yaw],
    },
    {
      subtask_id: 2, keypoints: [],
      params: [...xy(), P('o_d', 'signed z offset of the fingertips from the keypoint (negative = below)', 'm'), P('o_theta', 'gripper vs normal angle', 'deg'), ...yp],
      controllers: [...xyz('eef_tcp', K, { x: 'o_x', y: 'o_y', z: 'o_d' }), C({ type: 'AxisAlign', source: 'eef_z', target: NRM(K), param: 'o_theta', priority: 2 }), ...yaw, C({ type: 'Gripper', action: 'close', stage: 1 })],
    },
    {
      subtask_id: 3, keypoints: [],
      params: [...xy(), P('o_z', 'lift height', 'm'), P('o_theta', 'angle', 'deg')],
      controllers: [...xyz(K, K, { x: 'o_x', y: 'o_y', z: 'o_z' }), C({ type: 'AxisAlign', source: 'eef_z', target: NRM(K), param: 'o_theta', priority: 2 })],
    },
    {
      subtask_id: 4, keypoints: [],
      params: [...xy(), P('o_z', 'hover height of the held keypoint over the destination', 'm'), P('o_theta', 'angle', 'deg'), ...dyp],
      controllers: [...xyz(K, D, { x: 'o_x', y: 'o_y', z: 'o_z' }), downD, ...dyaw],
    },
    force
      ? {
        subtask_id: 5, keypoints: [],
        params: [...xy(), P('f', 'contact force', 'N'), P('o_theta', 'angle', 'deg'), ...dyp],
        controllers: [...xyz(K, D, { x: 'o_x', y: 'o_y' }), C({ type: 'Force', axis: '-z', param: 'f' }), downD, ...dyaw],
      }
      : {
        subtask_id: 5, keypoints: [],
        params: [...xy(), P('o_z', 'height of the held keypoint above the destination surface', 'm'), P('o_theta', 'angle', 'deg'), ...dyp],
        controllers: [...xyz(K, D, { x: 'o_x', y: 'o_y', z: 'o_z' }), downD, ...dyaw],
      },
    {
      subtask_id: 6, keypoints: [], params: [P('o_z', 'retract height', 'm')],
      controllers: [C({ type: 'Gripper', action: 'open', stage: 0 }), C({ type: 'PosAlign', source: 'eef_tcp', target: 'eef_tcp', axis: 'z', param: 'o_z', stage: 1 })],
    },
  ]
  const values: Record<number, Record<string, number>> = {
    1: { o_x: 0, o_y: 0, o_z: num.hover, o_theta: 180, ...(grasp_yaw ? { o_yaw: 90 } : {}) },
    2: { o_x: 0, o_y: 0, o_d: num.grasp, o_theta: 180, ...(grasp_yaw ? { o_yaw: 90 } : {}) },
    3: { o_x: 0, o_y: 0, o_z: num.lift, o_theta: 180 },
    4: { o_x: 0, o_y: 0, o_z: num.hover_dest, o_theta: 180, ...(destCube ? { o_yaw: 90 } : {}) },
    5: { o_x: 0, o_y: 0, ...(force ? { f: num.place_force! } : { o_z: num.place_z! }), o_theta: 180, ...(destCube ? { o_yaw: 90 } : {}) },
    6: { o_z: num.retract },
  }
  const par: ParameterGroundings = {
    values: Object.entries(values).flatMap(([s, d]) => Object.entries(d).map(([n, v]) => ({ subtask_id: Number(s), name: n, value: Number(v), rationale: 'reference' }))),
  }
  for (const r of recipes) // keypoints the planner defines itself are declared with a description
    r.keypoints = referencedKeypoints(r.controllers).filter((n) => n in DEFINED).map((n) => ({ name: n, description: DEFINED[n]! }))
  const observations = lying ? `The ${nice} is lying on its side on the table.` : `The ${nice} is standing / resting normally.`
  return { dec: mkDecomposition({ observations, subtasks }), rec: { recipes }, par }
}

/** Collapse the 6 reference subtasks into ONE subtask with sequential stages (what a planner without a decomposer has
 *  to produce). Parameter names are made unique per original subtask. */
export function mergePlan(dec: Decomposition, rec: SkillRecipes | null, par: ParameterGroundings | null): Plan {
  if (!dec.feasible || !rec || !par) return { dec, rec, par }
  const controllers: ControllerSpec[] = []
  const params: ParamSpec[] = []
  const values: ParameterGroundings['values'] = []
  const kps = new Map<string, KeypointRequest>()
  let offset = 0
  for (const r of rec.recipes) {
    const nStages = 1 + Math.max(...r.controllers.map((c) => c.stage))
    for (const c of r.controllers) controllers.push({ ...c, stage: c.stage + offset, param: c.param ? `${c.param}_${r.subtask_id}` : null })
    params.push(...r.params.map((p) => ({ ...p, name: `${p.name}_${r.subtask_id}` })))
    values.push(...par.values.filter((v) => v.subtask_id === r.subtask_id).map((v) => ({ ...v, subtask_id: 1, name: `${v.name}_${r.subtask_id}` })))
    for (const k of r.keypoints) kps.set(k.name, k)
    offset += nStages
  }
  const one = mkDecomposition({ observations: dec.observations, subtasks: [{ ...dec.subtasks[0]!, name: 'Complete the task' }] })
  return { dec: one, rec: { recipes: [{ subtask_id: 1, keypoints: [...kps.values()], controllers, params }] }, par: { values } }
}

function footprints(env: MuJoCoEnv, task: TaskSpec, skip: Set<string>): [[number, number], number][] {
  // (centre, half-extent) circles for the other objects; a lying bottle becomes a few circles along its axis
  const out: [[number, number], number][] = []
  for (const o of task.objects) {
    if (skip.has(o.name)) continue
    const c = env.objectPos(o.name)
    if (o.type === 'tray') out.push([[c[0], c[1]], 0.13])
    else if (o.type === 'bottle') {
      if (env.bottleLying(o.name)) {
        const a = env.bodyAxisZ(o.name)
        for (let i = 0; i < 5; i++) {
          const t = -0.08 + (0.16 * i) / 4
          out.push([[c[0] + a[0] * t, c[1] + a[1] * t], 0.035])
        }
      } else out.push([[c[0], c[1]], 0.035])
    } else out.push([[c[0], c[1]], 0.045])
  }
  return out
}

/** Demo-planner answer to an OBSTACLE report: push the blocking object away, on a feasible side. */
export function clearReferencePlan(task: TaskSpec, env: MuJoCoEnv, pair: [string, string] | null): Plan {
  const obj = pair ? pair[0] : task.success[0]!.object
  const tgt = env.gtKeypoint(obj === 'bottle' && env.bottleLying() ? `${obj}_body_center` : keypointFor(task, obj))[0]
  const cands = task.objects.filter((o) => o.name !== obj)
  let blocker = cands[0]!
  let bestD = Infinity
  for (const o of cands) {
    const p = env.objectPos(o.name)
    const dd = Math.hypot(p[0] - tgt[0], p[1] - tgt[1])
    if (dd < bestD) [blocker, bestD] = [o, dd]
  }
  const bp = env.objectPos(blocker.name)
  const c: [number, number] = [bp[0], bp[1]]
  const half = blocker.type === 'tray' ? 0.09 : 0.02
  const others = footprints(env, task, new Set([blocker.name]))
  let best: { score: number; d: [number, number]; L: number; S: [number, number] } | null = null
  for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][])
    for (const L of [0.16, 0.22]) {
      const S: [number, number] = [c[0] - d[0] * (half + 0.035), c[1] - d[1] * (half + 0.035)]
      const path: [number, number][] = Array.from({ length: 9 }, (_, i) => [S[0] + d[0] * L * (i / 8), S[1] + d[1] * L * (i / 8)])
      if (!path.every((p) => p[0] >= 0.3 && p[0] <= 0.64 && Math.abs(p[1]) <= 0.34)) continue
      if (path.some((p) => others.some(([oc, r]) => Math.hypot(p[0] - oc[0], p[1] - oc[1]) < r + 0.03))) continue
      const end: [number, number] = [c[0] + d[0] * L, c[1] + d[1] * L]
      const score = Math.hypot(end[0] - tgt[0], end[1] - tgt[1]) - 0.3 * L
      if (best === null || score > best.score) best = { score, d, L, S }
    }
  if (best === null)
    return {
      dec: mkDecomposition({
        observations: 'Something blocks the grasp but there is no free side to push it from.', feasible: false,
        reason: 'An object blocks the gripper and it cannot be pushed away from any side.', subtasks: [],
      }),
      rec: null, par: null,
    }
  const { d, L, S } = best
  const name = `${blocker.name}_push_start`
  env.pushHint = { [name]: [S[0], S[1], 0] as Vec3 }
  const nice = blocker.name.replace(/_/g, ' ')
  const stNames = [
    `Move above the push start point beside the ${nice}`, `Lower the closed gripper beside the ${nice}`, `Push the ${nice} away from the ${obj}`, 'Retract upward',
  ]
  const subtasks: Subtask[] = stNames.map((n, i) => ({ id: i + 1, name: n, description: n }))
  const P = (n: string, dsc: string, u: ParamSpec['unit']): ParamSpec => ({ name: n, description: dsc, unit: u })
  const C = mkController
  const kp: KeypointRequest[] = [{
    name, description: `a bare-table point just outside the ${nice}'s wall, on the side opposite to the direction it should be pushed`,
  }]
  const xy = (src: string, tg: string): ControllerSpec[] => [
    C({ type: 'PosAlign', source: src, target: tg, axis: 'x', param: 'o_x' }), C({ type: 'PosAlign', source: src, target: tg, axis: 'y', param: 'o_y' }),
  ]
  const recipes: SkillRecipe[] = [
    {
      subtask_id: 1, keypoints: kp,
      params: [P('o_x', 'x offset', 'm'), P('o_y', 'y offset', 'm'), P('o_z', 'hover height', 'm'), P('o_theta', 'angle', 'deg')],
      controllers: [...xy('eef_tcp', name), C({ type: 'PosAlign', source: 'eef_tcp', target: name, axis: 'z', param: 'o_z' }),
        C({ type: 'AxisAlign', source: 'eef_z', target: `${name}_normal`, param: 'o_theta', priority: 2 }), C({ type: 'Gripper', action: 'close', stage: 1 })],
    },
    {
      subtask_id: 2, keypoints: kp, params: [P('o_x', 'x offset', 'm'), P('o_y', 'y offset', 'm'), P('o_z', 'tcp height above the table', 'm')],
      controllers: [...xy('eef_tcp', name), C({ type: 'PosAlign', source: 'eef_tcp', target: name, axis: 'z', param: 'o_z' })],
    },
    {
      subtask_id: 3, keypoints: [], params: [P('o_x', 'x displacement', 'm'), P('o_y', 'y displacement', 'm'), P('o_z', 'z displacement', 'm')],
      controllers: [...xy('eef_tcp', 'eef_tcp'), C({ type: 'PosAlign', source: 'eef_tcp', target: 'eef_tcp', axis: 'z', param: 'o_z' })],
    },
    {
      subtask_id: 4, keypoints: [], params: [P('o_z', 'retract height', 'm')],
      controllers: [C({ type: 'PosAlign', source: 'eef_tcp', target: 'eef_tcp', axis: 'z', param: 'o_z' })],
    },
  ]
  const vals: Record<number, Record<string, number>> = {
    1: { o_x: 0, o_y: 0, o_z: 0.1, o_theta: 180 }, 2: { o_x: 0, o_y: 0, o_z: 0.03 }, 3: { o_x: d[0] * L, o_y: d[1] * L, o_z: 0 }, 4: { o_z: 0.12 },
  }
  const par: ParameterGroundings = {
    values: Object.entries(vals).flatMap(([s, dd]) => Object.entries(dd).map(([n, v]) => ({ subtask_id: Number(s), name: n, value: Number(v), rationale: 'push plan' }))),
  }
  const sg = (x: number) => (x >= 0 ? '+' : '-') + Math.abs(x).toFixed(0)
  const dec = mkDecomposition({
    observations: `The ${nice} is right beside the ${obj}: the gripper's fingers would hit it. I will push the ${nice} ${(L * 100).toFixed(0)} cm along (${sg(d[0])}, ${sg(d[1])}) first.`,
    clears_obstacle: true, subtasks,
  })
  return { dec, rec: { recipes }, par }
}

const PUSH_SKILLS: Record<number, string> = { 1: 'move_above_push_start', 2: 'lower_closed_gripper', 3: 'push_along_table', 4: 'retract_up' }
const PUSH_DESC: Record<string, string> = {
  move_above_push_start: 'Move the gripper above a start point on the table and close it into a pusher, pointing down.',
  lower_closed_gripper: 'Lower the closed gripper to a low height (beside an object) without moving sideways.',
  push_along_table: 'Slide the closed gripper horizontally by a set displacement to push whatever is in front of it.',
  retract_up: 'Lift the gripper straight up.',
}

function pushToPlan(rec: SkillRecipes, libraryNames: Set<string>): SkillPlan {
  const choices: SkillChoice[] = rec.recipes.map((r) => {
    const name = PUSH_SKILLS[r.subtask_id]!
    const refs = referencedKeypoints(r.controllers)
    const bindings: Record<string, string> = refs.length ? { start: refs[0]! } : {}
    return libraryNames.has(name)
      ? mkChoice({ subtask_id: r.subtask_id, skill_name: name, role_bindings: bindings, keypoints: r.keypoints })
      : mkChoice({ subtask_id: r.subtask_id, skill_name: name, role_bindings: bindings, keypoints: [], description: PUSH_DESC[name]!, recipe: r })
  })
  return { choices }
}

const SKILL_NAMES: Record<number, string> = {
  1: 'approach_above', 2: 'grasp_from_above', 3: 'lift_held', 4: 'move_over', 5: 'place_down_on_contact', 6: 'release_and_retract',
}
const SKILL_DESC: Record<string, string> = {
  approach_above: "Move the gripper above a target point and point it straight down, aligned with the target's edges.",
  grasp_from_above: 'Lower the open gripper onto a target point from above and close the fingers on it.',
  lift_held: 'Lift the object held in the gripper straight up while keeping it level.',
  move_over: 'Carry the held object over a destination point and hover above it, aligned with its edges.',
  place_down_on_contact: 'Lower the held object onto the surface below until contact is felt.',
  release_and_retract: 'Open the gripper to let go, then move straight up away from the object.',
  approach_above_aligned: "Move the gripper above a boxy target and point it down with the fingers aligned to the target's edges.",
  grasp_from_above_aligned: "Lower onto a boxy target from above with the fingers aligned to its faces and close the gripper.",
  move_over_aligned: 'Carry the held object over a boxy destination and hover above it, edges aligned.',
  place_down_on_contact_aligned: 'Lower the held object onto a boxy destination, edges aligned, until contact is felt.',
  place_down_to_height: 'Lower the held object over the destination to a set height above its surface (no force sensing).',
  place_down_to_height_aligned: 'Lower the held object onto a boxy destination, edges aligned, to a set height above its surface.',
  approach_above_long_axis: 'Move the gripper above a lying elongated object with the fingers turned across its long axis.',
  grasp_from_above_long_axis: 'Lower onto a lying elongated object from above across its width and close the fingers.',
}

/** Express the reference recipes as skill choices: reuse a stored skill when its name is in the library. */
function toPlan(rec: SkillRecipes, task: TaskSpec, pair: [string, string] | null, lying: boolean, libraryNames: Set<string>, force: boolean): SkillPlan {
  const [obj, dest] = pair ?? [task.success[0]!.object, task.success[0]!.target]
  const K = lying && obj === 'bottle' ? `${obj}_body_center` : keypointFor(task, obj)
  const D = dest === 'box' ? 'box_inside' : dest === 'table' ? 'table_free_spot' : keypointFor(task, dest)
  const roles: Record<string, string> = { obj: K, dest: D, obj_end: `${obj}_cap_end` }
  const choices = rec.recipes.map((r) => {
    const aligned = r.controllers.some((c) => c.type === 'YawAlign')
    const baseName = force || r.subtask_id !== 5 ? SKILL_NAMES[r.subtask_id]! : 'place_down_to_height'
    const name = baseName + (lying && (r.subtask_id === 1 || r.subtask_id === 2) ? '_long_axis' : aligned ? '_aligned' : '')
    const refs = referencedKeypoints(r.controllers)
    const bindings = Object.fromEntries(Object.entries(roles).filter(([, kp]) => refs.includes(kp)))
    const defined = r.keypoints.filter((k) => k.name in DEFINED)
    return libraryNames.has(name)
      ? mkChoice({ subtask_id: r.subtask_id, skill_name: name, role_bindings: bindings, keypoints: defined })
      : mkChoice({ subtask_id: r.subtask_id, skill_name: name, role_bindings: bindings, keypoints: [], description: SKILL_DESC[name]!, recipe: r })
  })
  return { choices }
}

function mergedToPlan(rec: SkillRecipes): SkillPlan {
  const r = rec.recipes[0]!
  const refs = referencedKeypoints(r.controllers)
  let h = 0
  for (const ch of refs.join(',')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return {
    choices: [mkChoice({
      subtask_id: 1, skill_name: `do_the_whole_task_${h % 9999}`, role_bindings: Object.fromEntries(refs.map((k) => [k, k])),
      description: 'One-off plan for the whole task.', recipe: r,
    })],
  }
}

export class ScriptedLLM implements LLM {
  usage = new Usage()
  readonly defaultModel = 'scripted'
  readonly pricing = NO_PRICING
  private plansCache: [Plan, Plan, boolean] | null = null
  private mode: 'task' | 'clear' = 'task'
  private clear: Plan | null = null

  constructor(private task: TaskSpec, private env: MuJoCoEnv, private pair: [string, string] | null = null) {}

  private plans(): [Plan, Plan, boolean] {
    // built lazily, from the scene as it is when planning starts (after any reset)
    if (!this.plansCache) {
      const lying = this.task.objects.some((o) => o.type === 'bottle' && o.lying) && this.env.bottleLying()
      const full = referencePlan(this.task, this.pair, lying, this.env.profile)
      this.plansCache = [full, mergePlan(full.dec, full.rec, full.par), lying]
    }
    return this.plansCache
  }

  private single = (text: string): boolean => !text.includes('\n2. ') && !text.includes('Subtask 2:')

  async structured<T>(req: StructuredRequest<T>): Promise<T> {
    const t0 = performance.now()
    const first = req.messages[req.messages.length - 1]!.content[0]
    const text = typeof first === 'string' ? first : ''
    let out: unknown
    switch (req.agent) {
      case 'task_decomposer':
        if (text.includes('OBSTACLE')) {
          // the pipeline reported a blocked grasp
          this.mode = 'clear'
          this.clear = clearReferencePlan(this.task, this.env, this.pair)
          out = this.clear.dec
        } else {
          this.mode = 'task'
          out = this.plans()[0].dec
        }
        break
      case 'skill_generator': {
        const names = new Set(Array.from(text.matchAll(/^- (\w+)\(roles:/gm), (m) => m[1]!))
        if (this.mode === 'clear') out = pushToPlan(this.clear!.rec!, names)
        else {
          const p = this.plans()
          out = this.single(text) ? mergedToPlan(p[1].rec!) : toPlan(p[0].rec!, this.task, this.pair, p[2], names, this.env.profile.force_sensor)
        }
        break
      }
      case 'parameter_setter':
        out = this.mode === 'clear' ? this.clear!.par : this.single(text) ? this.plans()[1].par : this.plans()[0].par
        break
      default:
        throw new Error('the Demo planner grounds with ground-truth keypoints; it has no vision pointing')
    }
    const parsed = req.schema.parse(JSON.parse(JSON.stringify(out)))
    this.usage.add({ agent: req.agent, model: 'mock', input_tokens: 0, output_tokens: 0, latency_s: (performance.now() - t0) / 1000, ok: true })
    return parsed
  }
}

