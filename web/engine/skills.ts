/**
 * Skill library: reusable, object-agnostic subtask recipes (skills.py). A skill is a controller recipe written with
 * ROLES (obj, dest, ...) instead of concrete keypoint names, so "grasp_from_above" learned on a bottle also serves a
 * cube. The browser keeps one library per arm in IndexedDB (or in memory under Node).
 */
import type { ControllerSpec, ParamSpec } from './schemas'
import type { StoredSkill } from '../types'

const SUFFIXES = ['_normal', '_norm', '_axis']
export const NAME_RE = /^[a-z][a-z0-9_]{2,48}$/

export interface Skill {
  name: string
  description: string
  roles: string[]
  controllers: ControllerSpec[] // source/target use role names instead of keypoints
  params: ParamSpec[]
  defaults: Record<string, number> // values that worked last time (hints)
  uses: number
  successes: number
  created: string
}

export const mkSkill = (s: Pick<Skill, 'name' | 'description' | 'roles' | 'controllers' | 'params'> & Partial<Skill>): Skill => ({
  defaults: {}, uses: 0, successes: 0, created: '', ...s,
})

/** Rename keypoints inside a point/vector name (also handles <kp>_normal/_axis and A__to__B). */
export function mapName(name: string | null, mapping: Record<string, string>): string | null {
  if (!name) return name
  if (name.includes('__to__')) {
    const [a, b] = name.split('__to__', 2) as [string, string]
    return `${mapName(a, mapping)}__to__${mapName(b, mapping)}`
  }
  if (name in mapping) return mapping[name]!
  for (const suf of SUFFIXES) if (name.endsWith(suf) && name.slice(0, -suf.length) in mapping) return mapping[name.slice(0, -suf.length)]! + suf
  return name
}

export const remapControllers = (cs: ControllerSpec[], mapping: Record<string, string>): ControllerSpec[] =>
  cs.map((c) => ({ ...c, source: mapName(c.source, mapping), target: mapName(c.target, mapping) }))

export const instantiate = (skill: Skill, bindings: Record<string, string>): ControllerSpec[] => remapControllers(skill.controllers, bindings)

export const generalize = (controllers: ControllerSpec[], bindings: Record<string, string>): ControllerSpec[] =>
  remapControllers(controllers, Object.fromEntries(Object.entries(bindings).map(([role, kp]) => [kp, role])))

/** Persistence behind a SkillLibrary: one record per skill. */
export interface SkillStorage {
  list(): Promise<Skill[]>
  put(skill: Skill): Promise<void>
  clear(): Promise<void>
}

export class MemorySkillStorage implements SkillStorage {
  private map = new Map<string, Skill>()
  async list(): Promise<Skill[]> {
    return [...this.map.values()].map((s) => structuredClone(s))
  }
  async put(skill: Skill): Promise<void> {
    this.map.set(skill.name, structuredClone(skill))
  }
  async clear(): Promise<void> {
    this.map.clear()
  }
}

const pad = (n: number): string => String(n).padStart(2, '0')
const stamp = (d = new Date()): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
const num = (x: number): string => String(Number(x.toPrecision(6)))

export class SkillLibrary {
  skills: Record<string, Skill> = {}
  constructor(private storage: SkillStorage) {}

  async reload(): Promise<void> {
    this.skills = {}
    for (const s of (await this.storage.list()).sort((a, b) => a.name.localeCompare(b.name))) this.skills[s.name] = s
  }
  names(): string[] {
    return Object.keys(this.skills).sort()
  }
  get(name: string): Skill | undefined {
    return this.skills[name]
  }
  async add(s: Skill): Promise<void> {
    s.created = s.created || stamp()
    this.skills[s.name] = s
    await this.storage.put(s)
  }
  async record(name: string, success: boolean, values?: Record<string, number>): Promise<void> {
    const s = this.skills[name]
    if (!s) return
    s.uses += 1
    s.successes += success ? 1 : 0
    if (success && values) {
      const declared = new Set(s.params.map((p) => p.name))
      for (const [k, v] of Object.entries(values)) if (declared.has(k)) s.defaults[k] = v
    }
    await this.storage.put(s)
  }
  async clear(): Promise<number> {
    const n = Object.keys(this.skills).length
    await this.storage.clear()
    this.skills = {}
    return n
  }

  private static ctrlLine(c: ControllerSpec): string {
    const args = [c.source, c.target, c.axis, c.action, c.param].filter((x) => x)
    return `${c.type}(${args.join(', ')}) p${c.priority}${c.stage ? ` stage ${c.stage}` : ''}`
  }

  listing(): string {
    const all = Object.values(this.skills)
    if (!all.length) return 'STORED SKILLS: none yet. Create new skills (with a recipe) for every subtask.'
    const out = ['STORED SKILLS (reuse one whenever it fits the subtask: give its name and bind its roles to keypoints; only create a new skill when none fits):']
    for (const s of all) {
      const rate = s.uses ? `${s.successes}/${s.uses} successful` : 'not yet used'
      out.push(`- ${s.name}(roles: ${s.roles.join(', ')}) - ${s.description} [${rate}]`)
      out.push('    controllers: ' + s.controllers.map(SkillLibrary.ctrlLine).join('; '))
      if (Object.keys(s.defaults).length) out.push('    values that worked: ' + Object.entries(s.defaults).map(([k, v]) => `${k}=${num(v)}`).join(', '))
    }
    return out.join('\n')
  }

  /** The shape GET /api/skills returns. */
  api(): StoredSkill[] {
    return Object.values(this.skills).map((s) => ({
      name: s.name, description: s.description, roles: s.roles, uses: s.uses, successes: s.successes, created: s.created,
      defaults: s.defaults, controllers: s.controllers.map(SkillLibrary.ctrlLine),
    })) as StoredSkill[]
  }
}
