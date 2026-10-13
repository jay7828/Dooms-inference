/** The four agents (agents/*.py): prompt + schema + validation with feedback retry. Model-agnostic: they talk to an LLM. */
import { controllerDoc, keypointsIn, referencedKeypoints, mkKeypoint, type Keypoint } from './controllers'
import type { MuJoCoEnv, Observation } from './env'
import type { AgentName, Block, ImageBlock, LLM } from './llm'
import {
  DecompositionSchema, ParameterGroundingsSchema, SkillPlanSchema, ValueError,
  type Decomposition, type KeypointRequest, type ParameterGroundings, type ParamSpec, type Schema, type SkillPlan,
  type SkillRecipe, type SkillRecipes,
} from './schemas'
import { NAME_RE, instantiate, type SkillLibrary } from './skills'
import type { RobotProfile } from './data'

export class AgentError extends Error {}
export class GroundingError extends Error {}

/**
 * System prompts of the model-backed agents. The Demo planner ignores them; a Bedrock implementation fills them in
 * (llm/prompts/*.md of the Dooms backend) before running with Claude.
 */
export const agentPrompts: Partial<Record<AgentName, string>> = {}
export const robotSpecs: Partial<Record<RobotProfile['id'], string>> = {}

export type Emit = (ev: Record<string, unknown>) => void

export interface AgentOptions {
  maxTokens?: number
  temperature?: number
}

export abstract class Agent<T> {
  abstract readonly name: AgentName
  abstract readonly schema: Schema<T>
  trace: Record<string, unknown>[] = []
  emit: Emit | null = null // optional callable for live UIs
  tempBoost = 0 // >0 on retries so a deterministic model does not repeat the same wrong answer
  readonly system: string

  constructor(protected llm: LLM, protected robot: RobotProfile, protected opts: AgentOptions = {}, name: AgentName) {
    this.system = (agentPrompts[name] ?? '') + (['task_decomposer', 'skill_generator', 'parameter_setter'].includes(name) ? '\n' + (robotSpecs[robot.id] ?? '') : '')
  }

  async call(content: Block[], validate?: (out: T) => T | void, attempts = 2, label = ''): Promise<T> {
    let last: unknown = null
    this.emit?.({ type: 'agent_start', agent: this.name, label })
    let blocks = content
    for (let i = 0; i < attempts; i++) {
      try {
        let out = await this.llm.structured<T>({
          agent: this.name, system: this.system, messages: [{ role: 'user', content: blocks }], schema: this.schema,
          maxTokens: this.opts.maxTokens ?? this.llm.agentDefaults?.[this.name]?.maxTokens ?? 2000,
          temperature: Math.min(1, (this.opts.temperature ?? this.llm.agentDefaults?.[this.name]?.temperature ?? 0) + this.tempBoost),
        })
        if (validate) {
          const v = validate(out)
          if (v !== undefined) out = v as Awaited<T>
        }
        this.trace.push({ agent: this.name, label, attempt: i, output: out })
        this.emit?.({ type: 'agent', agent: this.name, label, output: out })
        return out
      } catch (e) {
        if (!(e instanceof ValueError)) throw e
        last = e
        this.trace.push({ agent: this.name, label, attempt: i, rejected: e.message.slice(0, 800) })
        this.emit?.({ type: 'agent_rejected', agent: this.name, label, reason: e.message.slice(0, 300) })
        blocks = [...blocks, `\n\nYour previous answer was rejected: ${e.message.slice(0, 800)}\nCorrect it and answer again.`]
      }
    }
    throw new AgentError(`${this.name}: no valid answer after ${attempts} attempts: ${last instanceof Error ? last.message : String(last)}`)
  }
}

/** An image block over an Observation (PNG, produced only where a renderer exists). */
export const obsImage = (obs: Observation): ImageBlock => ({ type: 'image', mediaType: 'image/png', load: () => obs.png() })

export class TaskDecomposer extends Agent<Decomposition> {
  readonly name = 'task_decomposer' as const
  readonly schema = DecompositionSchema
  constructor(llm: LLM, robot: RobotProfile, opts?: AgentOptions) {
    super(llm, robot, opts, 'task_decomposer')
  }
  run(instruction: string, obs: Observation, sceneContext: string, failureContext?: string | null): Promise<Decomposition> {
    let text = `Instruction: ${instruction}\n\nScene facts: ${sceneContext}\n`
    if (failureContext) text += `\nFAILURE CONTEXT: ${failureContext}\n`
    const check = (d: Decomposition): void => {
      if (!d.feasible) {
        if (d.reason.trim().length < 10) throw new ValueError('if the task is infeasible, explain why in `reason`')
        return
      }
      if (!(d.subtasks.length >= 2 && d.subtasks.length <= 12)) throw new ValueError('expected between 2 and 12 subtasks')
      d.subtasks.forEach((s, i) => (s.id = i + 1))
    }
    return this.call([text, obsImage(obs)], check, 2, 'decompose')
  }
}

const LIMITS: Record<string, [number, number]> = { m: [-1.0, 1.0], deg: [-360.0, 360.0], N: [0.5, 30.0] }

export class ParameterSetter extends Agent<ParameterGroundings> {
  readonly name = 'parameter_setter' as const
  readonly schema = ParameterGroundingsSchema
  constructor(llm: LLM, robot: RobotProfile, opts?: AgentOptions) {
    super(llm, robot, opts, 'parameter_setter')
  }
  run(
    instruction: string, subtasks: Decomposition, recipes: SkillRecipes, obs: Observation, sceneContext: string,
    failureContext?: string | null, hints?: Record<number, Record<string, number>>,
  ): Promise<ParameterGroundings> {
    const names = Object.fromEntries(subtasks.subtasks.map((s) => [s.id, s.name]))
    const lines: string[] = []
    for (const r of recipes.recipes) {
      lines.push(`Subtask ${r.subtask_id}: ${names[r.subtask_id]}`)
      for (const c of r.controllers) lines.push(`  stage ${c.stage} p${c.priority}: ` + JSON.stringify(Object.fromEntries(Object.entries(c).filter(([, v]) => v !== null))))
      for (const p of r.params) lines.push(`  PARAM ${p.name} [${p.unit}]: ${p.description}`)
      const h = hints?.[r.subtask_id]
      if (h && Object.keys(h).length)
        lines.push('  values that worked when this stored skill succeeded before (a starting point - adapt to THIS scene): ' + Object.entries(h).map(([k, v]) => `${k}=${Number(v.toPrecision(6))}`).join(', '))
    }
    let text = `Instruction: ${instruction}\n\nScene facts: ${sceneContext}\n\nSkill recipes:\n` + lines.join('\n')
    if (failureContext) text += `\n\nFAILURE CONTEXT: ${failureContext}`
    return this.call([text, obsImage(obs)], (g) => ParameterSetter.check(g, recipes), 2, 'parameters')
  }
  static check(g: ParameterGroundings, recipes: SkillRecipes): void {
    const have = new Map(g.values.map((v) => [`${v.subtask_id}:${v.name}`, v.value]))
    for (const r of recipes.recipes)
      for (const p of r.params) {
        const v = have.get(`${r.subtask_id}:${p.name}`)
        if (v === undefined) throw new ValueError(`missing value for subtask ${r.subtask_id} parameter ${p.name}`)
        const [lo, hi] = LIMITS[p.unit]!
        if (!(lo <= v && v <= hi)) throw new ValueError(`subtask ${r.subtask_id} ${p.name}=${v} is outside the plausible range ${lo}..${hi} ${p.unit}`)
      }
  }
  static valuesFor(g: ParameterGroundings, subtaskId: number): Record<string, number> {
    return Object.fromEntries(g.values.filter((v) => v.subtask_id === subtaskId).map((v) => [v.name, v.value]))
  }
}

const EEF_VECTORS = new Set(['eef_x', 'eef_y', 'eef_z', 'eef_x_axis', 'eef_y_axis', 'eef_z_axis', 'world_x', 'world_y', 'world_z'])
const UNIT: Record<string, ParamSpec['unit']> = { PosAlign: 'm', AxisAlign: 'deg', YawAlign: 'deg', Force: 'N', Gripper: 'm' }
const KP_NAME_RE = /^[a-z][a-z0-9_]{1,40}$/

export interface SkillInfo {
  subtask_id: number
  skill_name: string
  reused: boolean
  role_bindings: Record<string, string>
  description: string
  recipe: SkillRecipe
}

/** Chooses, per subtask, a STORED skill to reuse or defines a new one; returns concrete recipes. */
export class SkillGenerator extends Agent<SkillPlan> {
  readonly name = 'skill_generator' as const
  readonly schema = SkillPlanSchema
  constructor(llm: LLM, robot: RobotProfile, opts?: AgentOptions) {
    super(llm, robot, opts, 'skill_generator')
  }

  async run(
    instruction: string, subtasks: Decomposition, vocab: Record<string, string>, library: SkillLibrary | null,
    failureContext?: string | null,
  ): Promise<{ recipes: SkillRecipes; infos: SkillInfo[] }> {
    const st = subtasks.subtasks.map((s) => `${s.id}. ${s.name} - ${s.description}`).join('\n')
    const kp = Object.entries(vocab).map(([k, v]) => `- ${k}: ${v}`).join('\n')
    const libText = library ? library.listing() : 'STORED SKILLS: none (library disabled). Create new skills.'
    let text =
      `Instruction: ${instruction}\n\nSubtasks:\n${st}\n\nScene keypoint vocabulary ` +
      `(known keypoints you can use directly; each also has a <name>_normal surface-normal vector). You may also ` +
      `DEFINE new keypoints for places/things not listed:\n${kp}\n\n${libText}\n\n` +
      `${controllerDoc(this.robot.max_width, this.robot.force_sensor)}`
    if (failureContext) text += `\nFAILURE CONTEXT: ${failureContext}\n`
    const force = this.robot.force_sensor
    const plan = await this.call([text], (p) => void SkillGenerator.assemble(p, subtasks, vocab, library, force), 3, 'recipes')
    return SkillGenerator.assemble(plan, subtasks, vocab, library, force)
  }

  /** Turn the agent's choices into concrete recipes (instantiating stored skills), validating everything. */
  static assemble(
    plan: SkillPlan, subtasks: Decomposition, vocab: Record<string, string>, library: SkillLibrary | null, allowForce = true,
  ): { recipes: SkillRecipes; infos: SkillInfo[] } {
    if (JSON.stringify(plan.choices.map((c) => c.subtask_id)) !== JSON.stringify(subtasks.subtasks.map((s) => s.id)))
      throw new ValueError('need exactly one choice per subtask, in order, with matching subtask_id')
    const recipes: SkillRecipe[] = []
    const infos: Omit<SkillInfo, 'recipe'>[] = []
    // a keypoint defined in ANY choice is valid for the whole plan (the agent often defines it once)
    const planDefined = new Map<string, KeypointRequest>()
    for (const c of plan.choices) for (const k of c.keypoints) if (!(k.name in vocab)) planDefined.set(k.name, k)
    for (let ch of plan.choices) {
      const sid = ch.subtask_id
      const defined = [...planDefined.values()]
      let recipe: SkillRecipe
      if (ch.recipe === null) {
        // ---- reuse a stored skill
        const sk = library?.get(ch.skill_name)
        if (!sk)
          throw new ValueError(
            `subtask ${sid}: '${ch.skill_name}' is not a stored skill (${library ? JSON.stringify(library.names()) : 'library disabled'}). Reuse one of those, or CREATE a new skill by providing \`recipe\` (and a new name).`,
          )
        const missing = sk.roles.filter((r) => !(r in ch.role_bindings))
        if (missing.length) throw new ValueError(`subtask ${sid}: skill '${sk.name}' needs role_bindings for ${JSON.stringify(missing)}`)
        recipe = { subtask_id: sid, keypoints: defined, controllers: instantiate(sk, ch.role_bindings), params: sk.params.map((p) => ({ ...p })) }
      } else {
        // ---- create a new skill
        if (library && library.names().includes(ch.skill_name)) {
          // keep both: the new one becomes a variant
          let n = 2
          while (library.names().includes(`${ch.skill_name}_v${n}`)) n++
          ch = { ...ch, skill_name: `${ch.skill_name}_v${n}` }
        }
        if (!NAME_RE.test(ch.skill_name)) throw new ValueError(`subtask ${sid}: skill names are lowercase snake_case (3-48 chars)`)
        if (ch.description.trim().length < 15) throw new ValueError(`subtask ${sid}: a new skill needs a general one-sentence \`description\``)
        const nr = ch.recipe as SkillRecipe
        recipe = { ...nr, subtask_id: sid, keypoints: [...nr.keypoints, ...defined] }
        const bound = new Set(Object.values(ch.role_bindings))
        const unbound = referencedKeypoints(recipe.controllers).filter((k) => !bound.has(k))
        if (unbound.length)
          throw new ValueError(`subtask ${sid}: put every object keypoint used by the new skill into role_bindings (role name -> keypoint); missing: ${JSON.stringify(unbound)}`)
      }
      recipes.push(recipe)
      infos.push({ subtask_id: sid, skill_name: ch.skill_name, reused: ch.recipe === null, role_bindings: { ...ch.role_bindings }, description: ch.description })
    }
    const out: SkillRecipes = { recipes }
    SkillGenerator.check(out, subtasks, vocab, allowForce)
    return { recipes: out, infos: infos.map((info, i) => ({ ...info, recipe: structuredClone(out.recipes[i]!) })) }
  }

  static check(r: SkillRecipes, subtasks: Decomposition, vocab: Record<string, string>, allowForce = true): void {
    if (JSON.stringify(r.recipes.map((x) => x.subtask_id)) !== JSON.stringify(subtasks.subtasks.map((s) => s.id)))
      throw new ValueError('need exactly one recipe per subtask, in order, with matching subtask_id')
    for (const rec of r.recipes) {
      const defined = new Map<string, string>()
      for (const k of rec.keypoints) if (!(k.name in vocab)) defined.set(k.name, k.description.trim())
      for (const [name, desc] of defined) {
        if (!KP_NAME_RE.test(name) || /(_normal|_norm|_axis)$/.test(name))
          throw new ValueError(`subtask ${rec.subtask_id}: '${name}' is not a valid new keypoint name (lowercase snake_case, must not end with _normal/_axis)`)
        if (desc.length < 8)
          throw new ValueError(`subtask ${rec.subtask_id}: new keypoint '${name}' needs a precise description of what the vision system should point at`)
      }
      for (const c of rec.controllers) {
        const sid = rec.subtask_id
        if (c.type === 'Force' && !allowForce)
          throw new ValueError(`subtask ${sid}: this robot has NO force sensor, so the Force controller is not available. Lower onto surfaces with PosAlign and a small z offset instead (e.g. hold the object's keypoint at its own height + 0.003 m above the surface).`)
        if ((c.type === 'PosAlign' || c.type === 'AxisAlign' || c.type === 'YawAlign') && !(c.source && c.target)) throw new ValueError(`subtask ${sid}: ${c.type} needs source and target`)
        if (c.type === 'PosAlign' && !['x', 'y', 'z'].includes(c.axis || 'z')) throw new ValueError(`subtask ${sid}: PosAlign axis must be x, y or z`)
        if (c.type === 'Force' && !['x', 'y', 'z'].includes((c.axis || '').replace(/^[-+]+/, ''))) throw new ValueError(`subtask ${sid}: Force axis must be one of x,y,z,-x,-y,-z`)
        if (c.type === 'Gripper' && c.action === null) throw new ValueError(`subtask ${sid}: Gripper needs action open|close|width`)
        if (c.type === 'Gripper' && c.action === 'width' && !c.param) throw new ValueError(`subtask ${sid}: Gripper width needs a param`)
        if (['PosAlign', 'AxisAlign', 'YawAlign', 'Force'].includes(c.type) && !c.param) throw new ValueError(`subtask ${sid}: ${c.type} needs a symbolic param`)
        for (const n of [c.source, c.target]) {
          for (const k of keypointsIn(n))
            if (!(k in vocab) && !defined.has(k))
              throw new ValueError(
                `subtask ${sid}: unknown keypoint '${k}'. Use one of ${JSON.stringify(Object.keys(vocab).sort())} (plus eef_tcp, eef_z), or DEFINE a new one: add {"name": "...", "description": "..."} to the \`keypoints\` list of one of your choices (a definition anywhere in the plan counts for all subtasks; it works for reused skills too) with a precise description of what to point at, e.g. 'an empty spot on the table to the right of the box'.`,
              )
          if (c.type === 'YawAlign' && n !== 'eef_y' && n !== 'eef_y_axis' && !(n ?? '').endsWith('_axis') && !(n ?? '').includes('__to__'))
            throw new ValueError(`subtask ${sid}: YawAlign source must be eef_y and target <keypoint>_axis`)
          if (c.type === 'AxisAlign' && !EEF_VECTORS.has(n ?? '') && !/(_normal|_norm)$/.test(n ?? '') && !(n ?? '').includes('__to__'))
            throw new ValueError(`subtask ${sid}: AxisAlign vectors must be eef_z or <keypoint>_normal`)
        }
      }
      const motion = ['PosAlign', 'AxisAlign', 'YawAlign', 'Force']
      for (const g of rec.controllers.filter((c) => c.type === 'Gripper' && c.action === 'close'))
        if (rec.controllers.some((c) => motion.includes(c.type) && c.stage === g.stage))
          throw new ValueError(`subtask ${rec.subtask_id}: Gripper(close) is in the same stage as motion controllers, so the fingers would close during the motion. Put the motion in stage 0 and Gripper(close) in stage 1.`)
      for (const c of rec.controllers)
        if (c.type === 'PosAlign' && c.source === 'eef_tcp' && c.target === 'eef_tcp' && c.axis === 'z' && c.stage === 0 &&
          rec.controllers.some((g) => g.type === 'Gripper' && g.action === 'open' && g.stage === 0))
          throw new ValueError(`subtask ${rec.subtask_id}: retracting in the same stage as Gripper(open) would drag the object along. Open in stage 0, retract in stage 1.`)
      // repair: request exactly the object keypoints the controllers reference; declare undeclared params
      rec.keypoints = referencedKeypoints(rec.controllers).map((k) => ({ name: k, description: vocab[k] || defined.get(k) || '' }))
      const declared = new Set(rec.params.map((p) => p.name))
      for (const c of rec.controllers)
        if (c.param && !declared.has(c.param)) {
          rec.params.push({ name: c.param, description: `${c.type} parameter`, unit: UNIT[c.type]! })
          declared.add(c.param)
        }
    }
  }
}

// ------------------------------------------------------------------------------------------------ grounding

export interface Grounder {
  trace: Record<string, unknown>[]
  lastPixels: Record<string, [number, number]>
  ground(requests: KeypointRequest[], obs: Observation): Promise<Record<string, Keypoint>>
}

/** Ground-truth keypoints straight from the simulator (ablation / upper bound; what the browser Demo planner uses). */
export class OracleGrounder implements Grounder {
  readonly name = 'oracle_grounder'
  trace: Record<string, unknown>[] = []
  lastPixels: Record<string, [number, number]> = {}
  constructor(private env: MuJoCoEnv) {}
  async ground(requests: KeypointRequest[]): Promise<Record<string, Keypoint>> {
    const out: Record<string, Keypoint> = {}
    for (const r of requests) {
      if (!this.env.hasKeypoint(r.name)) throw new GroundingError(`oracle grounding only knows simulator keypoints, not '${r.name}' - use Vision grounding`)
      const [pos, normal] = this.env.visibleKeypoint(r.name)
      const [axis, sym] = this.env.gtAxis(r.name)
      out[r.name] = mkKeypoint(r.name, pos, normal, axis, sym)
    }
    return out
  }
}

