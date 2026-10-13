/**
 * Task-axis controllers (controllers/*.py): PosAlign, AxisAlign, YawAlign, Force, Gripper, the prioritised
 * null-space stack that combines them, and the controller library the Skill Generator agent is told about.
 *
 * Every controller speaks the symbolic vocabulary the agents use:
 *   points  : "eef_tcp" (live end-effector point) or a grounded keypoint (world-frame snapshot)
 *   vectors : "eef_x|eef_y|eef_z" (live tcp axes) or "<keypoint>_normal" (grounded surface normal)
 */
import {
  Mat, clipNorm, cross, dot, norm, normalize, svd, type Mat3, type Vec3, matTVec, col,
} from './linalg'
import type { ControllerSpec } from './schemas'

export interface RobotState {
  q: number[]
  dq: number[]
  tcp_pos: Vec3
  tcp_rot: Mat3
  gripper_width: number
  wrench: number[]
  t: number
}

/** What the runtime needs from any arm: read state, kinematics, and the command kinds. */
export interface RobotInterface {
  n_joints: number
  max_width: number
  force_sensor: boolean
  state(): RobotState
  jacobian(pointWorld: ArrayLike<number>): [Mat, Mat]
  jointLimits(): [number[], number[]]
  setJointTargets(q: ArrayLike<number>): void
  setGripper(width: number): void
  step(): void
  stepAsync(): Promise<void>
}

export interface Keypoint {
  name: string
  pos: Vec3 // world frame
  normal: Vec3 | null // unit vector, world frame
  axis: Vec3 | null // in-plane edge direction of the feature's face (unit, world frame)
  axis_sym: number // rotational symmetry of `axis` in degrees (90 for square faces)
}
export const mkKeypoint = (name: string, pos: Vec3, normal: Vec3 | null = null, axis: Vec3 | null = null, axisSym = 180): Keypoint => ({
  name, pos, normal, axis, axis_sym: axisSym,
})

/** One block of the stacked task: J dq = v with v = clip(gain * e, v_max). */
export interface TaskTerm {
  J: Mat
  e: Float64Array
  gain: number
  v_max: number
}

export interface ExecCfg {
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
  sim: { control_hz: number }
}

export interface Context {
  robot: RobotInterface
  state: RobotState
  keypoints: Record<string, Keypoint>
  cfg: ExecCfg
  t_stage: number
  dt: number
}

export class KeyError extends Error {}

export function ctxVector(ctx: Context, name: string): Vec3 {
  const R = ctx.state.tcp_rot
  switch (name) {
    case 'eef_x': case 'eef_x_axis': return col(R, 0)
    case 'eef_y': case 'eef_y_axis': return col(R, 1)
    case 'eef_z': case 'eef_z_axis': return col(R, 2)
    case 'world_z': case 'z': return [0, 0, 1]
    case 'world_x': case 'x': return [1, 0, 0]
    case 'world_y': case 'y': return [0, 1, 0]
  }
  if (name.includes('__to__')) {
    // direction between two grounded keypoints
    const [a, b] = name.split('__to__', 2) as [string, string]
    const ka = ctx.keypoints[a]
    const kb = ctx.keypoints[b]
    if (!ka || !kb) throw new KeyError(`vector '${name}': keypoint missing`)
    const v: Vec3 = [kb.pos[0] - ka.pos[0], kb.pos[1] - ka.pos[1], kb.pos[2] - ka.pos[2]]
    if (norm(v) < 1e-6) throw new KeyError(`vector '${name}' has zero length`)
    return normalize(v)
  }
  for (const suffix of ['_normal', '_norm']) {
    if (name.endsWith(suffix)) {
      const kp = ctx.keypoints[name.slice(0, -suffix.length)]
      if (kp && kp.normal) return kp.normal
    }
  }
  if (name.endsWith('_axis')) {
    const kp = ctx.keypoints[name.slice(0, -'_axis'.length)]
    if (kp && kp.axis) return kp.axis
  }
  throw new KeyError(`unknown vector '${name}'`)
}

export abstract class Controller {
  abstract readonly name: string
  priority = 1
  stage = 0
  /** Freeze anything that must be a snapshot (the eef_tcp target, held-object offsets). */
  onStageStart(ctx: Context): void {
    void ctx
  }
  abstract term(ctx: Context): TaskTerm | null
  abstract finished(ctx: Context): boolean
  gripperCommand(): number | null {
    return null
  }
  describe(): string {
    return this.name
  }
}

const f = (x: number, k: number, sign = false): string => (sign && x >= 0 ? '+' : '') + x.toFixed(k)
const deg = (r: number): number => (r * 180) / Math.PI

function perpBasis(u: Vec3): [Vec3, Vec3] {
  const a: Vec3 = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]
  const b1 = normalize(cross(u, a))
  const b2 = cross(u, b1)
  return [b1, b2]
}
/** B^T M for B = [b1 b2] (3x2) and M (3 x n) */
function btM(B: [Vec3, Vec3], M: Mat): Mat {
  const out = new Mat(2, M.cols)
  for (let k = 0; k < 2; k++)
    for (let j = 0; j < M.cols; j++) out.data[k * M.cols + j] = B[k]![0] * M.data[j]! + B[k]![1] * M.data[M.cols + j]! + B[k]![2] * M.data[2 * M.cols + j]!
  return out
}
const rowTimes = (n: ArrayLike<number>, M: Mat): Mat => {
  const out = new Mat(1, M.cols)
  for (let j = 0; j < M.cols; j++) out.data[j] = n[0]! * M.data[j]! + n[1]! * M.data[M.cols + j]! + n[2]! * M.data[2 * M.cols + j]!
  return out
}

export function axisVector(ctx: Context, axis: string): Vec3 {
  const sign = axis.startsWith('-') ? -1 : 1
  const v = ctxVector(ctx, axis.replace(/^[-+]+/, ''))
  return [sign * v[0], sign * v[1], sign * v[2]]
}

/** Drive `source` so that n . p_source = n . p_target + offset along task axis n. */
export class PosAlign extends Controller {
  readonly name = 'PosAlign'
  private rTcp: Vec3 = [0, 0, 0]
  private targetPos: Vec3 = [0, 0, 0]
  constructor(
    public source: string, public target: string, public axis: string, public offset: number, priority = 1, stage = 0,
  ) {
    super()
    this.priority = priority
    this.stage = stage
  }
  override onStageStart(ctx: Context): void {
    const s = ctx.state
    if (this.source === 'eef_tcp') this.rTcp = [0, 0, 0]
    else {
      const p0 = ctx.keypoints[this.source]!.pos
      this.rTcp = matTVec(s.tcp_rot, [p0[0] - s.tcp_pos[0], p0[1] - s.tcp_pos[1], p0[2] - s.tcp_pos[2]])
    }
    // target is a snapshot: live eef_tcp is frozen at stage start
    this.targetPos = this.target === 'eef_tcp' ? [...s.tcp_pos] : [...ctx.keypoints[this.target]!.pos]
  }
  private sourceNow(ctx: Context): Vec3 {
    const R = ctx.state.tcp_rot
    const r = this.rTcp
    const p = ctx.state.tcp_pos
    return [
      p[0] + R[0] * r[0] + R[1] * r[1] + R[2] * r[2],
      p[1] + R[3] * r[0] + R[4] * r[1] + R[5] * r[2],
      p[2] + R[6] * r[0] + R[7] * r[1] + R[8] * r[2],
    ]
  }
  private error(ctx: Context): { n: Vec3; e: number; p: Vec3 } {
    const n = axisVector(ctx, this.axis)
    const p = this.sourceNow(ctx)
    const t = this.targetPos
    return { n, e: n[0] * (t[0] - p[0]) + n[1] * (t[1] - p[1]) + n[2] * (t[2] - p[2]) + this.offset, p }
  }
  term(ctx: Context): TaskTerm {
    const { n, e, p } = this.error(ctx)
    const [jp] = ctx.robot.jacobian(p)
    const c = ctx.cfg.execution
    return { J: rowTimes(n, jp), e: new Float64Array([e]), gain: c.pos_gain, v_max: c.max_lin_speed }
  }
  finished(ctx: Context): boolean {
    return Math.abs(this.error(ctx).e) < ctx.cfg.execution.pos_tol
  }
  override describe(): string {
    return `PosAlign(${this.source}, ${this.target}, axis=${this.axis}, offset=${f(this.offset, 3, true)} m)`
  }
}

/** Rotate so the angle between `source` and `target` vectors equals `angle` (radians); rotation about `source` is free. */
export class AxisAlign extends Controller {
  readonly name = 'AxisAlign'
  private targetVec: Vec3 | null = null
  constructor(public source: string, public target: string, public angle: number, priority = 1, stage = 0) {
    super()
    this.priority = priority
    this.stage = stage
  }
  override onStageStart(ctx: Context): void {
    // snapshot target vector unless it is a live eef axis
    if (!this.target.startsWith('eef')) this.targetVec = [...ctxVector(ctx, this.target)]
  }
  private rotError(ctx: Context): { u: Vec3; e3: Vec3; phi: number } {
    const u = ctxVector(ctx, this.source)
    const v = this.targetVec ?? ctxVector(ctx, this.target)
    // desired direction t: v rotated by `angle` in the plane spanned by (v, u)
    const uv = dot(u, v)
    let w: Vec3 = [u[0] - uv * v[0], u[1] - uv * v[1], u[2] - uv * v[2]]
    if (norm(w) < 1e-6) w = perpBasis(v)[0]
    w = normalize(w)
    const ca = Math.cos(this.angle)
    const sa = Math.sin(this.angle)
    const t: Vec3 = [ca * v[0] + sa * w[0], ca * v[1] + sa * w[1], ca * v[2] + sa * w[2]]
    const c = cross(u, t)
    const sN = norm(c)
    const phi = Math.atan2(sN, dot(u, t))
    const axis: Vec3 = sN > 1e-8 ? [c[0] / sN, c[1] / sN, c[2] / sN] : perpBasis(u)[0]
    return { u, e3: [phi * axis[0], phi * axis[1], phi * axis[2]], phi }
  }
  term(ctx: Context): TaskTerm {
    const { u, e3 } = this.rotError(ctx)
    const B = perpBasis(u)
    const [, jr] = ctx.robot.jacobian(ctx.state.tcp_pos)
    const c = ctx.cfg.execution
    return { J: btM(B, jr), e: new Float64Array([dot(B[0], e3), dot(B[1], e3)]), gain: c.ang_gain, v_max: c.max_ang_speed }
  }
  finished(ctx: Context): boolean {
    return this.rotError(ctx).phi < ctx.cfg.execution.ang_tol
  }
  override describe(): string {
    return `AxisAlign(${this.source}, ${this.target}, angle=${f(deg(this.angle), 0)} deg)`
  }
}

const Z: Vec3 = [0, 0, 1]
const fold = (x: number, sym: number): number => {
  const m = (x + sym / 2) % sym
  return (m < 0 ? m + sym : m) - sym / 2 // python-style modulo
}

/** Turn the gripper about the vertical so eef_y makes `angle` with the object's top-face edge `<keypoint>_axis`. */
export class YawAlign extends Controller {
  readonly name = 'YawAlign'
  private t: Vec3 | null = null
  private sym = 180
  constructor(public source: string, public target: string, public angle: number, priority = 2, stage = 0) {
    super()
    this.priority = priority
    this.stage = stage
  }
  override onStageStart(ctx: Context): void {
    try {
      this.t = [...ctxVector(ctx, this.target)]
    } catch (e) {
      if (!(e instanceof KeyError)) throw e
      this.t = null // no edge direction (round object / open surface): nothing to align to
      return
    }
    const kp = this.target.endsWith('_axis') ? ctx.keypoints[this.target.slice(0, -'_axis'.length)] : undefined
    this.sym = kp ? kp.axis_sym : 180
  }
  private err(ctx: Context): number {
    if (!this.t) return 0
    let s = [...ctxVector(ctx, this.source)] as Vec3
    s[2] = 0
    const t: Vec3 = [this.t[0], this.t[1], 0]
    if (norm(s) < 1e-6 || norm(t) < 1e-6) return 0
    s = normalize(s)
    const tn = normalize(t)
    const phi = Math.atan2(dot(Z, cross(s, tn)), dot(s, tn))
    return fold(phi - this.angle, (this.sym * Math.PI) / 180)
  }
  term(ctx: Context): TaskTerm | null {
    if (!this.t) return null
    const [, jr] = ctx.robot.jacobian(ctx.state.tcp_pos)
    const c = ctx.cfg.execution
    return { J: rowTimes(Z, jr), e: new Float64Array([this.err(ctx)]), gain: c.ang_gain, v_max: c.max_ang_speed }
  }
  finished(ctx: Context): boolean {
    return Math.abs(this.err(ctx)) < ctx.cfg.execution.ang_tol
  }
  override describe(): string {
    return `YawAlign(${this.source}, ${this.target}, angle=${f(deg(this.angle), 0)} deg)`
  }
}

const BIAS_SECONDS = 0.2 // stand still and average the wrist wrench before creeping
const CONFIRM_TICKS = 3 // consecutive over-threshold ticks required (rejects transients)

/** Guarded move: advance along `axis` slowly until the wrist force along it changed by `value` newtons. */
export class Force extends Controller {
  readonly name = 'Force'
  private acc: number[][] = []
  private bias: number[] | null = null
  private hits = 0
  private contact = false
  constructor(public axis: string, public value: number, priority = 1, stage = 0) {
    super()
    this.priority = priority
    this.stage = stage
  }
  private reset(): void {
    this.acc = []
    this.bias = null
    this.hits = 0
    this.contact = false
  }
  override onStageStart(ctx: Context): void {
    void ctx
    this.reset()
  }
  private delta(ctx: Context): number {
    const n = axisVector(ctx, this.axis)
    const w = ctx.state.wrench
    const b = this.bias!
    return Math.abs(n[0] * (w[0]! - b[0]!) + n[1] * (w[1]! - b[1]!) + n[2] * (w[2]! - b[2]!))
  }
  private update(ctx: Context): void {
    if (this.contact) return
    const w = ctx.state.wrench.slice(0, 3)
    if (ctx.t_stage < BIAS_SECONDS) {
      this.acc.push(w)
      return
    }
    if (this.bias === null)
      this.bias = this.acc.length ? [0, 1, 2].map((k) => this.acc.reduce((a, r) => a + r[k]!, 0) / this.acc.length) : w
    this.hits = this.delta(ctx) >= this.value ? this.hits + 1 : 0
    this.contact = this.hits >= CONFIRM_TICKS
  }
  term(ctx: Context): TaskTerm | null {
    this.update(ctx)
    if (this.contact || this.bias === null) return null
    const n = axisVector(ctx, this.axis)
    const [jp] = ctx.robot.jacobian(ctx.state.tcp_pos)
    const speed = ctx.cfg.execution.force_approach_speed
    return { J: rowTimes(n, jp), e: new Float64Array([1]), gain: speed, v_max: speed }
  }
  finished(ctx: Context): boolean {
    void ctx
    return this.contact
  }
  override describe(): string {
    return `Force(axis=${this.axis}, contact>=${f(this.value, 1)} N)`
  }
}

/** Open / close / set width. Finished once the fingers stop moving. */
export class Gripper extends Controller {
  readonly name = 'Gripper'
  width: number | null
  private prevW: number | null = null
  private still = 0
  constructor(public action: string = 'open', private given: number | null = null, priority = 1, stage = 0) {
    super()
    this.width = action === 'close' ? 0 : given // open / unset: the robot's full opening, set at stage start
    this.priority = priority
    this.stage = stage
  }
  override onStageStart(ctx: Context): void {
    this.prevW = null
    this.still = 0
    if (this.action === 'open' || this.width === null)
      this.width = this.given === null || this.action === 'open' ? ctx.robot.max_width : this.given
  }
  override gripperCommand(): number | null {
    return this.width
  }
  term(): TaskTerm | null {
    return null
  }
  finished(ctx: Context): boolean {
    const w = ctx.state.gripper_width
    if (this.prevW !== null && Math.abs(w - this.prevW) < 1e-4) this.still++
    else this.still = 0
    this.prevW = w
    return ctx.t_stage > 0.3 && this.still >= 8
  }
  override describe(): string {
    return `Gripper(${this.action}` + (this.width !== null ? `, width=${f(this.width, 3)} m)` : ')')
  }
}

// ------------------------------------------------------------------------------------------------ prioritised stack

/** Damped pseudo-inverse of JN plus an exact projector onto its row space (for the next null space). */
function svdLevel(JN: Mat, lam: number, tol = 1e-3): { P: Mat; rowSpace: Mat } {
  const { U, s, V } = svd(JN)
  const n = JN.cols
  const m = JN.rows
  const P = new Mat(n, m)
  const rowSpace = new Mat(n, n)
  for (let k = 0; k < s.length; k++) {
    const sk = s[k]!
    if (sk > 1e-12) {
      const w = sk / (sk * sk + lam * lam)
      for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) P.data[i * m + j]! += V.data[i * V.cols + k]! * w * U.data[j * U.cols + k]!
    }
    if (sk > tol) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) rowSpace.data[i * n + j]! += V.data[i * V.cols + k]! * V.data[j * V.cols + k]!
  }
  return { P, rowSpace }
}

/** levels[0] has the highest priority. Returns joint velocity (rad/s). */
export function solveStack(levels: TaskTerm[][], n: number, damping: number, qPostErr: ArrayLike<number> | null = null, postGain = 0.5, dqMax = 1.5): Float64Array {
  let N = Mat.eye(n)
  let dq = new Float64Array(n)
  for (const terms of levels) {
    if (!terms.length) continue
    const J = Mat.vstack(terms.map((t) => t.J))
    const vParts: number[] = []
    for (const t of terms) {
      const e = new Float64Array(t.e.length)
      for (let i = 0; i < e.length; i++) e[i] = t.gain * t.e[i]!
      vParts.push(...clipNorm(e, t.v_max))
    }
    const JN = J.mul(N)
    const { P, rowSpace } = svdLevel(JN, damping)
    const Jdq = J.mulVec(dq)
    const resid = new Float64Array(vParts.length)
    for (let i = 0; i < resid.length; i++) resid[i] = vParts[i]! - Jdq[i]!
    const inc = P.mulVec(resid)
    dq = dq.map((x, i) => x + inc[i]!)
    N = N.sub(rowSpace)
  }
  if (qPostErr) {
    // lowest priority: keep the arm near its home posture
    const g = new Float64Array(n)
    for (let i = 0; i < n; i++) g[i] = postGain * qPostErr[i]!
    const inc = N.mulVec(g)
    dq = dq.map((x, i) => x + inc[i]!)
  }
  let peak = 0
  for (const x of dq) peak = Math.max(peak, Math.abs(x))
  return peak <= dqMax ? dq : dq.map((x) => x * (dqMax / peak))
}

// ------------------------------------------------------------------------------------------------ library

export const CONTROLLER_LIBRARY_DOC = `\
Controller library (all controllers run simultaneously inside a stage; stages run in order).

PosAlign(source, target, axis, offset)
  Moves the point \`source\` so that, along task axis \`axis\`, it sits \`offset\` metres from \`target\`
  (n . p_source = n . p_target + offset). \`axis\` is one of x, y, z (world axes; z is up).
  \`source\` is the point the robot moves: either eef_tcp (the gripper's fingertip centre) or an object
  keypoint that is currently held in the gripper. \`target\` is a static point: an object keypoint, or
  eef_tcp (= where the gripper is at the start of the stage, useful for relative moves).
  To reach a 3D position you use three PosAlign controllers (x, y, z).
  offset parameter names: o_x, o_y, o_z (metres). Positive offset = source ABOVE / beyond target.

AxisAlign(source, target, angle)
  Rotates so that the angle between the direction vectors \`source\` and \`target\` equals \`angle\`
  (degrees). Vectors: eef_z (direction the gripper points; the fingers point along +eef_z),
  or <keypoint>_normal (surface normal of a grounded keypoint, pointing away from the surface),
  or <A>__to__<B> (the direction from keypoint A to keypoint B, e.g. bottle_body_center__to__bottle_cap_end = the
  long axis of a bottle lying on the table; both keypoints get grounded).
  angle 180 makes them anti-parallel. To point the gripper STRAIGHT DOWN use AxisAlign(eef_z, world_z, 180): this is the
  robust choice (world_z is the exact up vector). Use <keypoint>_normal only for a genuinely tilted flat surface; the
  measured normal of a curved surface (a cylinder lying down, a ball) is unreliable. Parameter name: o_theta (degrees).

YawAlign(source, target, angle)
  Turns the gripper about the vertical so that the direction \`source\` (eef_y = the direction along which the
  fingers open and close) makes \`angle\` degrees with the horizontal edge direction \`target\` = <keypoint>_axis
  of that keypoint's top face, or \`target\` = <A>__to__<B> (any two keypoints; only its horizontal direction
  counts). angle 90 = fingers close across the edge = grasp the flat sides of a box-like
  object. Square faces are treated as 90 degree symmetric. Needed for boxy objects (cubes); NOT needed for
  round ones (bottles). Parameter name: o_yaw (degrees). Use priority 2 together with AxisAlign.

Force(axis, value)
  Guarded move: creeps along \`axis\` (x, y, z, or negative like -z) until a contact force of \`value\`
  newtons is felt at the wrist. Use it to lower something until it touches a surface.
  Parameter name: f (newtons, typically 2-5).

Gripper(action)
  action = open | close | width. \`open\` releases, \`close\` grasps whatever is between the fingers,
  \`width\` sets an explicit opening in metres (parameter name g). Max opening {max_width} m.

Relative moves: PosAlign(eef_tcp, eef_tcp, axis, offset) moves the gripper by \`offset\` along \`axis\` from where it is
when the stage starts (lift, retract, sideways push). With the gripper closed this is how an object is pushed.

Priorities: controllers with a smaller \`priority\` number take precedence (null-space projection);
use the same number for controllers that should be equally important (typically all PosAlign of a
stage share priority 1; orientation AxisAlign gets priority 2 unless orientation is critical).
Stages: \`stage\` 0,1,2... run one after another; a stage ends when all its controllers converged.
Use a later stage when one action must finish before another starts (e.g. open the gripper THEN retract).
`

/** CONTROLLER_LIBRARY_DOC for one robot: its gripper opening, and without the Force controller if it has no sensor. */
export function controllerDoc(maxWidth = 0.08, forceSensor = true): string {
  let doc = CONTROLLER_LIBRARY_DOC
  if (!forceSensor) {
    const a = doc.indexOf('Force(axis, value)')
    const b = doc.indexOf('Gripper(action)')
    doc = doc.slice(0, a) + 'Force: NOT AVAILABLE on this robot (no force sensor). Lower onto surfaces with a small PosAlign z offset instead.\n\n' + doc.slice(b)
  }
  return doc.replace('{max_width}', String(Number(maxWidth.toPrecision(6))))
}

/** Instantiate a controller from a ControllerSpec and resolved numeric parameters. */
export function buildController(spec: ControllerSpec, values: Record<string, number>): Controller {
  const val = (dflt?: number): number => {
    if (spec.param === null) {
      if (dflt === undefined) throw new Error(`${spec.type} needs a parameter`)
      return dflt
    }
    return values[spec.param]!
  }
  const rad = (d: number) => (d * Math.PI) / 180
  switch (spec.type) {
    case 'PosAlign': return new PosAlign(spec.source!, spec.target!, spec.axis ?? 'z', val(0), spec.priority, spec.stage)
    case 'AxisAlign': return new AxisAlign(spec.source!, spec.target!, rad(val(180)), spec.priority, spec.stage)
    case 'YawAlign': return new YawAlign(spec.source!, spec.target!, rad(val(90)), spec.priority, spec.stage)
    case 'Force': return new Force(spec.axis ?? '-z', val(3), spec.priority, spec.stage)
    case 'Gripper': return new Gripper(spec.action ?? 'open', spec.param ? (values[spec.param] ?? null) : null, spec.priority, spec.stage)
  }
}

export const NON_KEYPOINT_NAMES = new Set([
  'eef_tcp', 'eef_x', 'eef_y', 'eef_z', 'eef_x_axis', 'eef_y_axis', 'eef_z_axis', 'world_x', 'world_y', 'world_z', 'x', 'y', 'z',
])
const VECTOR_SUFFIXES = ['_normal', '_norm', '_axis']

/** Object keypoint a symbolic point/vector name refers to (null for built-in eef/world names). */
export function keypointOf(name: string | null | undefined): string | null {
  if (!name || NON_KEYPOINT_NAMES.has(name)) return null
  for (const suf of VECTOR_SUFFIXES) if (name.endsWith(suf)) return name.slice(0, -suf.length)
  return name
}

/** Object keypoints a point/vector name depends on. `A__to__B` depends on both. */
export function keypointsIn(name: string | null | undefined): string[] {
  if (!name || NON_KEYPOINT_NAMES.has(name)) return []
  if (name.includes('__to__')) {
    const [a, b] = name.split('__to__', 2) as [string, string]
    return [keypointOf(a), keypointOf(b)].filter((k): k is string => !!k)
  }
  const k = keypointOf(name)
  return k ? [k] : []
}

export function referencedKeypoints(controllers: { source: string | null; target: string | null }[]): string[] {
  const seen: string[] = []
  for (const c of controllers)
    for (const n of [c.source, c.target]) for (const k of keypointsIn(n)) if (!seen.includes(k)) seen.push(k)
  return seen
}

