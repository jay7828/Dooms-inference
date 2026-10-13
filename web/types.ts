/** Types for the Dooms Inference event stream and scene catalogue. */

export type AgentKey = 'task_decomposer' | 'skill_generator' | 'parameter_setter' | 'vision_grounder'
export type AgentStatus = 'idle' | 'run' | 'done'

export interface SceneInfo {
  name: string
  instruction: string
  objects: string[]
  examples: string[]
  /** Arms that support this scene. */
  robots: string[]
}

export interface RobotInfo {
  id: string
  label: string
  dof: number
  scenes: string[]
  force_sensor: boolean
  max_width: number
}

export interface DoomsConfig {
  scenes: SceneInfo[]
  robots: RobotInfo[]
  default_robot: string
  real_robots?: string[]
  /** Real arms need the Motion Desktop app. */
  real_robot?: { available: boolean; desktop_url?: string; reason?: string }
}

export interface SceneGeom {
  body: number
  type: 'plane' | 'box' | 'cylinder' | 'sphere' | 'mesh'
  size: number[]
  pos: number[]
  quat: number[]
  rgba: number[]
  mesh?: number
}
export interface SceneMesh {
  v: string
  f: string
  f32: boolean
}
export interface SceneView {
  pos: number[]
  target: number[]
  /** Size of keypoint markers relative to the Franka scene (small arms use smaller ones). */
  scale?: number
}
export interface SceneData {
  robot?: string
  view?: SceneView
  nbody: number
  geoms: SceneGeom[]
  meshes: Record<string, SceneMesh>
  poses: number[][]
}

export interface RecipeController {
  type: string
  source?: string | null
  target?: string | null
  axis?: string | null
  param?: string | null
  action?: string | null
  priority: number
  stage: number
}
export interface Recipe {
  subtask_id: number
  controllers: RecipeController[]
}
export interface SkillInfo {
  subtask_id: number
  skill: string
  reused: boolean
  description: string
}
export interface StoredSkill {
  name: string
  description: string
  roles: string[]
  uses: number
  successes: number
  controllers: string[]
}
export interface Keypoint {
  pos: number[]
  normal: number[] | null
  pixel: number[] | null
}
export interface Usage {
  calls: number
  input_tokens: number
  output_tokens: number
  cost: number
}
export interface RunResult {
  success: boolean
  verified: boolean
  infeasible: boolean
  error: string
  subtasks_ok: number
  subtasks_total: number
  replans: number
  obstacles_cleared: number
  llm_calls: number
  input_tokens: number
  output_tokens: number
  cost_usd: number
  sim_s: number
  grounding_err_mm_mean: number | null
  predicates: Record<string, boolean>
}

export type DoomsEvent =
  | { type: 'started'; instruction: string; planner: string; seed: number; verified: boolean; continuing: boolean; mode?: string; dry_run?: boolean }
  | { type: 'status'; text: string }
  | { type: 'agent_start'; agent: AgentKey; label?: string; usage?: Usage }
  | { type: 'agent_rejected'; agent: AgentKey; reason: string }
  | { type: 'agent'; agent: AgentKey; label?: string; output: Record<string, unknown>; usage?: Usage }
  | { type: 'recipes'; recipes: Recipe[]; skills: SkillInfo[] }
  | { type: 'library'; skills: StoredSkill[] }
  | { type: 'obstacle'; text: string }
  | { type: 'grounding'; image: string; keypoints: Record<string, Keypoint>; source?: string }
  | { type: 'subtask_start'; id: number; name: string }
  | { type: 'subtask_end'; id: number; name: string; ok: boolean; sim_s: number; verdict: string }
  | { type: 'replan'; reason: string }
  | { type: 'scene_state'; scene: string; seed: number; runs: number }
  | { type: 'done'; result: RunResult }
  | { type: 'error'; message: string; code?: string }
  | { type: 'ended' }
  | { type: 'stopped' }

export interface AwsCredentials {
  region: string
  access_key_id?: string
  secret_access_key?: string
  session_token?: string
  bearer_token?: string
}
export interface AwsConnection {
  mode: 'keys' | 'bearer'
  creds: AwsCredentials
  region: string
  model: string
  models: string[]
  identity: string
}

