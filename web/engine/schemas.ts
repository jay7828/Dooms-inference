/**
 * The typed contract between the four agents (llm/schemas.py): TypeScript types plus a runtime validator and the JSON
 * Schema for each one, derived from one definition so a model's forced tool-call output can be checked and retried.
 */

/** Raised when a model answer does not fit a schema (the agent loop feeds the message back to the model). */
export class ValueError extends Error {}

export interface Field<T> {
  json: Record<string, unknown>
  parse(v: unknown, path: string): T
  readonly required: boolean
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

function field<T>(json: Record<string, unknown>, parse: (v: unknown, path: string) => T, required = true): Field<T> {
  return { json, parse, required }
}
const withDefault = <T>(f: Field<T>, def: T): Field<T> => ({
  json: { ...f.json, default: def },
  required: false,
  parse: (v, p) => (v === undefined || v === null ? structuredClone(def) : f.parse(v, p)),
})
const describe = <T>(f: Field<T>, description?: string): Field<T> => (description ? { ...f, json: { ...f.json, description } } : f)

export const s = {
  string: (description?: string, def?: string): Field<string> => {
    const f = describe(field({ type: 'string' }, (v, p) => {
      if (typeof v !== 'string') throw new ValueError(`${p}: expected a string`)
      return v
    }), description)
    return def === undefined ? f : withDefault(f, def)
  },
  number: (description?: string): Field<number> =>
    describe(field({ type: 'number' }, (v, p) => {
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new ValueError(`${p}: expected a number`)
      return v
    }), description),
  int: (description?: string, def?: number): Field<number> => {
    const f = describe(field({ type: 'integer' }, (v, p) => {
      if (typeof v !== 'number' || !Number.isInteger(v)) throw new ValueError(`${p}: expected an integer`)
      return v
    }), description)
    return def === undefined ? f : withDefault(f, def)
  },
  bool: (description?: string, def?: boolean): Field<boolean> => {
    const f = describe(field({ type: 'boolean' }, (v, p) => {
      if (typeof v !== 'boolean') throw new ValueError(`${p}: expected true or false`)
      return v
    }), description)
    return def === undefined ? f : withDefault(f, def)
  },
  enum: <T extends string>(values: readonly T[]): Field<T> =>
    field({ type: 'string', enum: [...values] }, (v, p) => {
      if (!values.includes(v as T)) throw new ValueError(`${p}: must be one of ${values.join(', ')}`)
      return v as T
    }),
  nullable: <T>(f: Field<T>, description?: string): Field<T | null> =>
    describe(field({ anyOf: [f.json, { type: 'null' }], default: null }, (v, p) => (v === undefined || v === null ? null : f.parse(v, p)), false), description),
  array: <T>(item: Field<T>, description?: string, optionalEmpty = false): Field<T[]> => {
    const f = describe(field({ type: 'array', items: item.json }, (v, p) => {
      if (!Array.isArray(v)) throw new ValueError(`${p}: expected a list`)
      return v.map((x, i) => item.parse(x, `${p}[${i}]`))
    }), description)
    return optionalEmpty ? withDefault(f, [] as T[]) : f
  },
  record: (description?: string): Field<Record<string, string>> =>
    describe(field({ type: 'object', additionalProperties: { type: 'string' } }, (v, p) => {
      if (!isObj(v)) throw new ValueError(`${p}: expected an object`)
      const out: Record<string, string> = {}
      for (const [k, x] of Object.entries(v)) {
        if (typeof x !== 'string') throw new ValueError(`${p}.${k}: expected a string`)
        out[k] = x
      }
      return out
    }), description),
  object: <S extends Record<string, Field<unknown>>>(shape: S, description?: string): Field<{ [K in keyof S]: S[K] extends Field<infer T> ? T : never }> =>
    describe(
      field(
        {
          type: 'object',
          properties: Object.fromEntries(Object.entries(shape).map(([k, f]) => [k, f.json])),
          required: Object.entries(shape).filter(([, f]) => f.required).map(([k]) => k),
        },
        (v, p) => {
          if (!isObj(v)) throw new ValueError(`${p || 'answer'}: expected an object`)
          const out: Record<string, unknown> = {}
          for (const [k, f] of Object.entries(shape)) {
            const x = v[k]
            if (x === undefined && f.required) throw new ValueError(`${p ? p + '.' : ''}${k}: field required`)
            out[k] = f.parse(x, `${p ? p + '.' : ''}${k}`)
          }
          return out as { [K in keyof S]: S[K] extends Field<infer T> ? T : never }
        },
      ),
      description,
    ),
}

export interface Schema<T> {
  name: string
  description: string
  jsonSchema: Record<string, unknown>
  parse(raw: unknown): T
}

function schema<T>(name: string, description: string, f: Field<T>): Schema<T> {
  return { name, description, jsonSchema: f.json, parse: (raw) => f.parse(raw, '') }
}

// ---- 01 Task Decomposer -------------------------------------------------------------------
const subtask = s.object({
  id: s.int('1-based order of execution'),
  name: s.string("short imperative name, e.g. 'Grasp the bottle'"),
  description: s.string('one sentence: what must be true when this subtask is done'),
})
export type Subtask = ReturnType<typeof subtask.parse>

const decomposition = s.object({
  observations: s.string(
    'what you see that matters for the plan: the pose/state of the relevant objects (upright, lying on its side, inside the box, out of reach...)', ''),
  feasible: s.bool('false only if a top-down parallel-jaw gripper truly cannot do the task', true),
  reason: s.string('if not feasible: why, in one or two sentences', ''),
  clears_obstacle: s.bool(
    'true when this plan ONLY removes an obstacle that blocks the task (e.g. pushes the box aside); the original task is planned again afterwards', false),
  subtasks: withDefault(s.array(subtask, 'empty only when not feasible'), [] as Subtask[]),
})
export type Decomposition = ReturnType<typeof decomposition.parse>
export const DecompositionSchema = schema('decomposition', 'The task split into ordered subtasks', decomposition)

// ---- 02 Skill Generator -------------------------------------------------------------------
const keypointRequest = s.object({
  name: s.string("keypoint name from the scene's keypoint vocabulary"),
  description: s.string(undefined, ''),
})
export type KeypointRequest = ReturnType<typeof keypointRequest.parse>

const paramSpec = s.object({
  name: s.string('symbolic parameter used by a controller, e.g. o_z, o_theta, f'),
  description: s.string('what it means physically, so a scene-aware agent can pick a number'),
  unit: s.enum(['m', 'deg', 'N'] as const),
})
export type ParamSpec = ReturnType<typeof paramSpec.parse>

const controllerSpec = s.object({
  type: s.enum(['PosAlign', 'AxisAlign', 'YawAlign', 'Force', 'Gripper'] as const),
  source: s.nullable(s.string(), 'PosAlign: point to move (eef_tcp or a held keypoint). AxisAlign: vector to rotate, e.g. eef_z. YawAlign: eef_y'),
  target: s.nullable(s.string(), 'PosAlign: static reference point. AxisAlign: reference vector'),
  axis: s.nullable(s.string(), 'PosAlign: x|y|z. Force: x|y|z|-x|-y|-z'),
  param: s.nullable(s.string(), 'name of the symbolic parameter that supplies the number'),
  action: s.nullable(s.enum(['open', 'close', 'width'] as const)),
  priority: s.int(undefined, 1),
  stage: s.int(undefined, 0),
})
export type ControllerSpec = ReturnType<typeof controllerSpec.parse>

const skillRecipe = s.object({
  subtask_id: s.int(),
  keypoints: s.array(keypointRequest, 'object keypoints that must be grounded in the scene (NOT eef_tcp / eef_z: those come from the robot)'),
  controllers: s.array(controllerSpec),
  params: s.array(paramSpec, 'every symbolic parameter referenced by the controllers'),
})
export type SkillRecipe = ReturnType<typeof skillRecipe.parse>

const skillRecipes = s.object({ recipes: s.array(skillRecipe) })
export type SkillRecipes = ReturnType<typeof skillRecipes.parse>

const skillChoice = s.object({
  subtask_id: s.int(),
  skill_name: s.string('name of a STORED skill to reuse, or a new snake_case name if you create one'),
  role_bindings: s.record(
    'role name -> keypoint name, e.g. {"obj": "bottle_cap", "dest": "box_inside"}. For a NEW skill, every object keypoint used by its controllers must appear here with a role name of your choice'),
  keypoints: s.array(keypointRequest, 'descriptions for keypoints you DEFINE (names not in the vocabulary); may be empty', true),
  description: s.string('NEW skills only: one general sentence about what the skill does, without mentioning specific objects', ''),
  recipe: s.nullable(skillRecipe, 'NEW skills only: the full recipe with concrete keypoint names; leave null when reusing a stored skill'),
})
export type SkillChoice = ReturnType<typeof skillChoice.parse>

const skillPlan = s.object({ choices: s.array(skillChoice) })
export type SkillPlan = ReturnType<typeof skillPlan.parse>
export const SkillPlanSchema = schema('skill_plan', 'One stored skill to reuse, or a new skill recipe, per subtask', skillPlan)

// ---- 03 Parameter Setter ------------------------------------------------------------------
const paramValue = s.object({
  subtask_id: s.int(),
  name: s.string(),
  value: s.number('metres, degrees or newtons according to the parameter\'s unit'),
  rationale: s.string('short justification', ''),
})
export type ParamValue = ReturnType<typeof paramValue.parse>

const parameterGroundings = s.object({ values: s.array(paramValue) })
export type ParameterGroundings = ReturnType<typeof parameterGroundings.parse>
export const ParameterGroundingsSchema = schema('parameter_groundings', 'Numeric values for every symbolic parameter', parameterGroundings)

// ---- 04 Vision Grounder -------------------------------------------------------------------
const pixelPoint = s.object({
  name: s.string(),
  u: s.number('horizontal pixel coordinate (x, increases to the right)'),
  v: s.number('vertical pixel coordinate (y, increases downward)'),
  visible: s.bool(undefined, true),
})
export type PixelPoint = ReturnType<typeof pixelPoint.parse>
const pixelPoints = s.object({ points: s.array(pixelPoint) })
export type PixelPoints = ReturnType<typeof pixelPoints.parse>
export const PixelPointsSchema = schema('pixel_points', 'Pixel coordinates of the requested keypoints', pixelPoints)

export const SkillRecipesSchema = schema('skill_recipes', 'Concrete recipes', skillRecipes)

// ---- constructors that mirror the pydantic defaults (used by the scripted planner) ------------
export const mkController = (c: Partial<ControllerSpec> & Pick<ControllerSpec, 'type'>): ControllerSpec => ({
  source: null, target: null, axis: null, param: null, action: null, priority: 1, stage: 0, ...c,
})
export const mkDecomposition = (d: Partial<Decomposition>): Decomposition => ({
  observations: '', feasible: true, reason: '', clears_obstacle: false, subtasks: [], ...d,
})
export const mkChoice = (c: Partial<SkillChoice> & Pick<SkillChoice, 'subtask_id' | 'skill_name'>): SkillChoice => ({
  role_bindings: {}, keypoints: [], description: '', recipe: null, ...c,
})
