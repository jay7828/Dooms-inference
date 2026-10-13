/**
 * Static data of the Dooms backend, ported to TypeScript: default config (configs/default.yaml), robot profiles
 * (robots.py) and task definitions (configs/tasks/*.yaml).
 */

export type Range = [number, number]

export interface Dims {
  bottle_r: number
  bottle_half_h: number
  cap_r: number
  cap_half_h: number
  tray_half: number
  tray_floor: number
  tray_wall_t: number
  tray_wall_half_h: number
  cube: number
}
const DEFAULT_DIMS: Dims = {
  bottle_r: 0.022, bottle_half_h: 0.07, cap_r: 0.012, cap_half_h: 0.016,
  tray_half: 0.09, tray_floor: 0.012, tray_wall_t: 0.008, tray_wall_half_h: 0.025, cube: 0.04,
}
export const bottleLen = (d: Dims): number => 2 * (d.bottle_half_h + d.cap_half_h)
export const capTopZ = (d: Dims): number => d.bottle_half_h + 2 * d.cap_half_h

export interface Finger {
  center: number
  length: number
  width: number
  max_z: number
}

export interface Config {
  sim: {
    timestep: number
    control_hz: number
    settle_seconds: number
    cameras: {
      scene: { pos: number[]; lookat: number[]; fovy: number; width: number; height: number }
      wrist: { fovy: number; width: number; height: number }
    }
  }
  execution: {
    max_subtask_seconds: number
    max_lin_speed: number
    max_ang_speed: number
    pos_gain: number
    ang_gain: number
    pos_tol: number
    ang_tol: number
    damping: number
    force_approach_speed: number
  }
  pipeline: {
    grounding: 'vlm' | 'oracle'
    refine_iters: number
    skill_library_dir: string | null
    wrist_refine: boolean
    obstacle_check: boolean
    max_obstacle_rounds: number
    max_regrounds: number
    max_subtask_retries: number
    max_replans: number
    record_video: boolean
    video_fps: number
    use_decomposer?: boolean
  }
  robot?: string
}

export const DEFAULT_CONFIG: Config = {
  sim: {
    timestep: 0.002,
    control_hz: 50,
    settle_seconds: 0.6,
    cameras: {
      scene: { pos: [0.95, -0.55, 0.8], lookat: [0.45, 0.0, 0.06], fovy: 55, width: 640, height: 480 },
      wrist: { fovy: 75, width: 320, height: 240 },
    },
  },
  execution: {
    max_subtask_seconds: 10.0, max_lin_speed: 0.3, max_ang_speed: 1.2, pos_gain: 5.0, ang_gain: 4.0,
    pos_tol: 0.006, ang_tol: 0.05, damping: 0.02, force_approach_speed: 0.04,
  },
  pipeline: {
    grounding: 'vlm', refine_iters: 1, skill_library_dir: null, wrist_refine: true, obstacle_check: true,
    max_obstacle_rounds: 2, max_regrounds: 2, max_subtask_retries: 0, max_replans: 1, record_video: true, video_fps: 20,
  },
}

export function deepUpdate<T>(base: T, patch: unknown): T {
  const out: Record<string, unknown> = structuredClone(base) as Record<string, unknown>
  for (const [k, v] of Object.entries((patch ?? {}) as Record<string, unknown>)) {
    const cur = out[k]
    if (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur)) out[k] = deepUpdate(cur, v)
    else out[k] = v
  }
  return out as T
}

// ------------------------------------------------------------------------------------------------ robots

export type RobotId = 'franka' | 'so101'

export interface RobotProfile {
  id: RobotId
  label: string
  dof: number
  max_width: number
  grasp_min_width: number
  force_sensor: boolean
  dims: Dims
  scenes: string[]
  table_center: [number, number]
  table_half: [number, number]
  remap: [number, number, number] | null
  max_radius: number | null
  min_separation: number | null
  scene_cam: { pos: number[]; lookat: number[]; fovy: number }
  view: { pos: number[]; target: number[]; scale?: number }
  finger: Finger
  exec: Partial<Config['execution']>
  pipeline: Partial<Config['pipeline']>
}

export const FRANKA: RobotProfile = {
  id: 'franka', label: 'Franka Panda', dof: 7, max_width: 0.08, grasp_min_width: 0.008, force_sensor: true,
  dims: DEFAULT_DIMS,
  scenes: ['sandbox', 'sandbox_fallen', 'sandbox_blocked', 'put_bottle_in_box', 'put_cube_in_box', 'stack_cubes'],
  table_center: [0.45, 0.0], table_half: [0.6, 0.65], remap: null, max_radius: null, min_separation: null,
  scene_cam: { pos: [0.95, -0.55, 0.8], lookat: [0.45, 0.0, 0.06], fovy: 55 },
  view: { pos: [1.62, -1.15, 1.2], target: [0.42, 0.02, 0.1] },
  finger: { center: 0.052, length: 0.03, width: 0.034, max_z: 0.15 },
  exec: {}, pipeline: {},
}

export const SO101: RobotProfile = {
  id: 'so101', label: 'SO-ARM101', dof: 5, max_width: 0.055, grasp_min_width: 0.011, force_sensor: false,
  dims: {
    bottle_r: 0.013, bottle_half_h: 0.017, cap_r: 0.007, cap_half_h: 0.006,
    tray_half: 0.055, tray_floor: 0.006, tray_wall_t: 0.005, tray_wall_half_h: 0.009, cube: 0.025,
  },
  scenes: ['sandbox', 'put_bottle_in_box', 'put_cube_in_box', 'stack_cubes'],
  table_center: [0.2, 0.0], table_half: [0.42, 0.42],
  remap: [0.205, 0.5, 0.5], max_radius: 0.27, min_separation: 0.092,
  scene_cam: { pos: [0.48, -0.36, 0.34], lookat: [0.17, 0.0, 0.01], fovy: 55 },
  view: { pos: [0.72, -0.58, 0.46], target: [0.15, 0.0, 0.03], scale: 0.45 },
  finger: { center: 0.03, length: 0.02, width: 0.02, max_z: 0.06 },
  exec: { max_lin_speed: 0.12, max_ang_speed: 1.0, pos_tol: 0.0025, force_approach_speed: 0.02 },
  pipeline: { wrist_refine: false },
}

export const PROFILES: Record<RobotId, RobotProfile> = { franka: FRANKA, so101: SO101 }
export const DEFAULT_ROBOT: RobotId = 'franka'

export function getProfile(robot?: string | null): RobotProfile {
  const p = PROFILES[(robot || DEFAULT_ROBOT) as RobotId]
  if (!p) throw new Error(`unknown robot '${robot}' (choose from ${Object.keys(PROFILES).sort().join(', ')})`)
  return p
}
export const profileSupports = (p: RobotProfile, scene: string): boolean => p.scenes.includes(scene)
export const profileSummary = (p: RobotProfile) => ({
  id: p.id, label: p.label, dof: p.dof, scenes: [...p.scenes], force_sensor: p.force_sensor, max_width: p.max_width,
})

// ------------------------------------------------------------------------------------------------ tasks

export interface ObjectSpec {
  name: string
  type: 'bottle' | 'tray' | 'cube'
  x_range: Range
  y_range: Range
  yaw_range: Range
  color: [number, number, number]
  size: number
  lying: boolean
}
export interface SuccessPredicate {
  type: 'inside' | 'on_top' | 'outside'
  object: string
  target: string
}
export interface TaskSpec {
  name: string
  instruction: string
  objects: ObjectSpec[]
  keypoints: Record<string, string>
  scene_context: string
  success: SuccessPredicate[]
  min_object_separation: number
  seed_variation: boolean
}

type ObjIn = Partial<ObjectSpec> & Pick<ObjectSpec, 'name' | 'type' | 'x_range' | 'y_range'>
const obj = (o: ObjIn): ObjectSpec => ({ yaw_range: [0, 0], color: [0.5, 0.5, 0.5], size: 0.04, lying: false, ...o })
const BOTTLE_COLOR: [number, number, number] = [0.45, 0.7, 0.95]
const BOX_COLOR: [number, number, number] = [0.22, 0.22, 0.24]
const RED: [number, number, number] = [0.85, 0.15, 0.15]
const BLUE: [number, number, number] = [0.15, 0.3, 0.9]

const KP_BOTTLE_CAP = "the top of the bottle's small cap (a top-down grasp point only while the bottle STANDS upright; on a bottle lying on its side this surface faces sideways)"
const KP_BOX = "centre of the box's interior floor"

const WATER_BOTTLE_CTX =
  'Objects on the table: a water bottle (about 0.17 m long and 0.045 m wide, with a narrow cap end about 0.03 m long and 0.024 m wide), a red cube and a blue cube (0.04 m on each side), and an open tray called "the box" (about 0.18 m x 0.18 m, 0.05 m tall walls).'
const BASE_CTX = 'Robot base is at the world origin, x forward, z up, table top at z=0.'

const TASK_LIST: TaskSpec[] = [
  {
    name: 'put_bottle_in_box', instruction: 'put the bottle into the box',
    objects: [
      obj({ name: 'bottle', type: 'bottle', x_range: [0.42, 0.56], y_range: [0.08, 0.24], color: BOTTLE_COLOR }),
      obj({ name: 'box', type: 'tray', x_range: [0.4, 0.55], y_range: [-0.3, -0.14], color: BOX_COLOR }),
    ],
    keypoints: { bottle_cap: KP_BOTTLE_CAP, box_inside: KP_BOX },
    scene_context: `${BASE_CTX} The bottle is a water bottle about 0.17 m long and 0.045 m wide, with a narrow cap end about 0.03 m long and 0.024 m wide. The box is an open tray about 0.18 m x 0.18 m with 0.05 m tall walls. The parallel gripper opens to at most 0.08 m.`,
    success: [{ type: 'inside', object: 'bottle', target: 'box' }], min_object_separation: 0.16, seed_variation: true,
  },
  {
    name: 'put_cube_in_box', instruction: 'put the red cube into the box',
    objects: [
      obj({ name: 'cube_red', type: 'cube', x_range: [0.42, 0.56], y_range: [0.08, 0.24], yaw_range: [-0.4, 0.4], color: RED, size: 0.04 }),
      obj({ name: 'box', type: 'tray', x_range: [0.4, 0.55], y_range: [-0.3, -0.14], color: BOX_COLOR }),
    ],
    keypoints: { cube_red_top: 'centre of the top face of the red cube', box_inside: KP_BOX },
    scene_context: `${BASE_CTX} The red cube is 0.04 m on each side. The box is an open tray about 0.18 m x 0.18 m with 0.05 m tall walls. The parallel gripper opens to at most 0.08 m.`,
    success: [{ type: 'inside', object: 'cube_red', target: 'box' }], min_object_separation: 0.16, seed_variation: true,
  },
  {
    name: 'sandbox', instruction: 'put the bottle into the box',
    objects: [
      obj({ name: 'bottle', type: 'bottle', x_range: [0.48, 0.58], y_range: [0.14, 0.26], color: BOTTLE_COLOR }),
      obj({ name: 'cube_red', type: 'cube', x_range: [0.32, 0.42], y_range: [0.1, 0.22], yaw_range: [-0.4, 0.4], color: RED, size: 0.04 }),
      obj({ name: 'cube_blue', type: 'cube', x_range: [0.32, 0.42], y_range: [-0.1, 0.02], yaw_range: [-0.4, 0.4], color: BLUE, size: 0.04 }),
      obj({ name: 'box', type: 'tray', x_range: [0.46, 0.56], y_range: [-0.3, -0.19], color: BOX_COLOR }),
    ],
    keypoints: {
      bottle_cap: KP_BOTTLE_CAP, box_inside: KP_BOX,
      cube_red_top: 'centre of the top face of the red cube', cube_blue_top: 'centre of the top face of the blue cube',
    },
    scene_context: `${BASE_CTX} ${WATER_BOTTLE_CTX} The parallel gripper opens to at most 0.08 m.`,
    success: [], min_object_separation: 0.11, seed_variation: true,
  },
  {
    name: 'sandbox_blocked', instruction: 'pick up the bottle and put it on the table',
    objects: [
      obj({ name: 'bottle', type: 'bottle', lying: true, x_range: [0.5, 0.5], y_range: [0.1, 0.1], yaw_range: [1.5708, 1.5708], color: BOTTLE_COLOR }),
      obj({ name: 'box', type: 'tray', x_range: [0.5, 0.5], y_range: [0.23, 0.23], color: BOX_COLOR }),
      obj({ name: 'cube_red', type: 'cube', x_range: [0.34, 0.34], y_range: [-0.14, -0.14], color: RED, size: 0.04 }),
      obj({ name: 'cube_blue', type: 'cube', x_range: [0.34, 0.34], y_range: [-0.28, -0.28], color: BLUE, size: 0.04 }),
    ],
    keypoints: {
      bottle_body_center: "the middle of the bottle's body, on its top surface", box_inside: KP_BOX,
      cube_red_top: 'centre of the top face of the red cube', cube_blue_top: 'centre of the top face of the blue cube',
    },
    scene_context: `${BASE_CTX} Objects on the table: a water bottle (about 0.17 m long and 0.045 m wide), a red cube and a blue cube (0.04 m on each side), and an open tray called "the box" (about 0.18 m x 0.18 m, 0.05 m tall walls, about 0.65 kg, it slides when pushed). The parallel gripper opens to at most 0.08 m; its fingers need about 6 cm of free space on each side of whatever it grasps. The robot can reach the middle of the table in front of it (x 0.3 to 0.65 m, y -0.35 to 0.35 m).`,
    success: [], min_object_separation: 0.05, seed_variation: true,
  },
  {
    name: 'sandbox_fallen', instruction: 'put the bottle into the box',
    objects: [
      obj({ name: 'bottle', type: 'bottle', lying: true, x_range: [0.46, 0.56], y_range: [0.1, 0.22], yaw_range: [-1.2, 1.2], color: BOTTLE_COLOR }),
      obj({ name: 'cube_red', type: 'cube', x_range: [0.32, 0.42], y_range: [0.1, 0.22], yaw_range: [-0.4, 0.4], color: RED, size: 0.04 }),
      obj({ name: 'cube_blue', type: 'cube', x_range: [0.32, 0.42], y_range: [-0.1, 0.02], yaw_range: [-0.4, 0.4], color: BLUE, size: 0.04 }),
      obj({ name: 'box', type: 'tray', x_range: [0.46, 0.56], y_range: [-0.3, -0.19], color: BOX_COLOR }),
    ],
    keypoints: {
      bottle_cap: KP_BOTTLE_CAP, box_inside: KP_BOX,
      cube_red_top: 'centre of the top face of the red cube', cube_blue_top: 'centre of the top face of the blue cube',
    },
    scene_context: `${BASE_CTX} ${WATER_BOTTLE_CTX} The parallel gripper opens to at most 0.08 m.`,
    success: [], min_object_separation: 0.11, seed_variation: true,
  },
  {
    name: 'stack_cubes', instruction: 'stack the red cube on top of the blue cube',
    objects: [
      obj({ name: 'cube_red', type: 'cube', x_range: [0.42, 0.56], y_range: [0.1, 0.25], yaw_range: [-0.4, 0.4], color: RED, size: 0.04 }),
      obj({ name: 'cube_blue', type: 'cube', x_range: [0.42, 0.56], y_range: [-0.25, -0.1], yaw_range: [-0.4, 0.4], color: BLUE, size: 0.04 }),
    ],
    keypoints: { cube_red_top: 'centre of the top face of the red cube', cube_blue_top: 'centre of the top face of the blue cube' },
    scene_context: `${BASE_CTX} Both cubes are 0.04 m on each side. The parallel gripper opens to at most 0.08 m.`,
    success: [{ type: 'on_top', object: 'cube_red', target: 'cube_blue' }], min_object_separation: 0.16, seed_variation: true,
  },
]
export const TASKS: Record<string, TaskSpec> = Object.fromEntries(TASK_LIST.map((t) => [t.name, t]))

/** Scene order of GET /api/config: sandbox variants first, the rest alphabetical. */
export const SCENE_ORDER = ['sandbox', 'sandbox_fallen', 'sandbox_blocked', ...Object.keys(TASKS).filter((n) => !n.startsWith('sandbox')).sort()]

export const EXAMPLES: Record<string, string[]> = {
  sandbox_blocked: ['pick up the bottle and put it on the table', 'put the bottle on the table away from the box'],
  sandbox_fallen: ['pick up the bottle and put it on the table away from the box', 'put the bottle into the box', 'put the blue cube into the box'],
  sandbox: ['put the bottle into the box', 'put the blue cube into the box', 'stack the red cube on top of the blue cube', 'put the blue cube on the red cube'],
}

export function loadTask(name: string): TaskSpec {
  const t = TASKS[name]
  if (!t) throw new Error(`unknown scene '${name}'`)
  return structuredClone(t)
}

/** The task as this arm sees it: placement remapped into its workspace, sizes + description rewritten for its scale. */
export function adaptTask(task: TaskSpec, profile: RobotProfile): TaskSpec {
  if (!profile.remap) return task
  const [x0, kx, ky] = profile.remap
  const d = profile.dims
  const objects = task.objects.map((o) => {
    let xr: Range = [x0 + (o.x_range[0] - 0.45) * kx, x0 + (o.x_range[1] - 0.45) * kx]
    const yr: Range = [o.y_range[0] * ky, o.y_range[1] * ky]
    if (profile.max_radius) {
      const ymax = Math.max(Math.abs(yr[0]), Math.abs(yr[1]))
      const xHi = Math.sqrt(Math.max(profile.max_radius ** 2 - ymax ** 2, 0))
      if (xr[1] > xHi) xr = [Math.min(xr[0], xHi), xHi]
    }
    return { ...o, x_range: xr, y_range: yr, ...(o.type === 'cube' ? { size: d.cube } : {}) }
  })
  return {
    ...task, objects, scene_context: sceneContext(task, profile),
    min_object_separation: profile.min_separation || task.min_object_separation,
  }
}

function sceneContext(task: TaskSpec, profile: RobotProfile): string {
  const d = profile.dims
  const cm = (v: number) => `${(v * 100).toFixed(1)} cm`
  const parts = ['Robot base is at the world origin, x forward, z up, table top at z=0.']
  const what: string[] = []
  const types = new Set(task.objects.map((o) => o.type))
  if (types.has('bottle'))
    what.push(`a small bottle (${cm(bottleLen(d))} tall and ${cm(2 * d.bottle_r)} wide, with a narrow cap on top ${cm(2 * d.cap_half_h)} tall and ${cm(2 * d.cap_r)} wide)`)
  const cubes = task.objects.filter((o) => o.type === 'cube')
  if (cubes.length) {
    const names = cubes.length > 1
      ? cubes.map((o) => `${o.name.replace('cube_', '')} cube`).join(' and ')
      : cubes[0]!.name !== 'cube' ? `a ${cubes[0]!.name.replace('cube_', '')} cube` : 'a cube'
    what.push(`${names} (${cm(d.cube)} on each side)`)
  }
  if (types.has('tray'))
    what.push(`an open tray called "the box" (${cm(2 * d.tray_half)} x ${cm(2 * d.tray_half)}, ${cm(d.tray_floor + 2 * d.tray_wall_half_h)} tall walls, light enough to slide when pushed)`)
  if (what.length) parts.push('Objects on the table: ' + what.join(', ') + '.')
  parts.push(`The gripper opens to at most ${(profile.max_width * 100).toFixed(1)} cm.`)
  return parts.join(' ')
}

/** cfg with this arm's execution / pipeline overrides merged in and the robot id recorded. */
export const applyProfile = (cfg: Config, p: RobotProfile): Config => deepUpdate(cfg, { robot: p.id, execution: { ...p.exec }, pipeline: { ...p.pipeline } })
