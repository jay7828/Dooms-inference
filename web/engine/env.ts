/** MuJoCo implementation of the simulator + robot interface (Franka Panda or SO-ARM101): port of sim/mujoco_env.py. */
import {
  adaptTask, getProfile, type Config, type Dims, type RobotProfile, type TaskSpec,
} from './data'
import { dot, matTVec, matVec, norm, normalize, quatMul, type Mat3, type Vec3, Mat } from './linalg'
import type { DoubleBuffer, MjData, MjModel, MujocoApi } from './mujocoApi'
import { compileXml, mountRobot, type AssetSource } from './mujocoLoader'
import { DefaultRng } from './rng'
import { buildModelXml } from './sceneBuilder'
import { poses } from './sceneExport'

const ARM_JOINTS: Record<string, string[]> = {
  franka: [1, 2, 3, 4, 5, 6, 7].map((i) => `joint${i}`),
  so101: ['shoulder_pan', 'shoulder_lift', 'elbow_flex', 'wrist_flex', 'wrist_roll'],
}
const GRIPPER_CTRL_MAX = 255.0
// SO-ARM101 ready pose (pan, lift, elbow, wrist flex, wrist roll): hovers over the workspace, gripper pointing down
const SO101_HOME = [0.0, -0.59, 0.45, 1.55, 0.0]
const SO101_FIXED_PAD_X = -0.0115 // inner face of the fixed jaw in the `gripper` body frame (m)

export interface RobotState {
  q: number[]
  dq: number[]
  tcp_pos: Vec3
  tcp_rot: Mat3 // tcp frame in world; z axis points out of the gripper
  gripper_width: number
  wrench: number[] // (6,) force/torque at the wrist, world frame
  t: number
}

export interface CameraParams {
  name: string
  width: number
  height: number
  fx: number
  fy: number
  cx: number
  cy: number
  /** 4x4 row-major camera-to-world, camera frame = MuJoCo/OpenGL (x right, y up, z backward) */
  T_world_cam: number[]
}

/** What an agent sees. Pixels are produced lazily (and only where a renderer exists: the browser worker). */
export interface Observation {
  camera: CameraParams
  t: number
  /** PNG of the camera view, or null when this environment cannot render (Node tests). */
  png(): Promise<Uint8Array | null>
}

export const cameraFromFovy = (name: string, width: number, height: number, fovyDeg: number, T: number[]): CameraParams => {
  const f = (0.5 * height) / Math.tan((fovyDeg * Math.PI) / 360)
  return { name, width, height, fx: f, fy: f, cx: (width - 1) / 2, cy: (height - 1) / 2, T_world_cam: T }
}

/** Project a world point to pixels of a camera (MuJoCo convention: looks down -z, y up). */
export function projectPoint(cam: CameraParams, p: ArrayLike<number>): [number, number] {
  const T = cam.T_world_cam
  const d: Vec3 = [p[0]! - T[3]!, p[1]! - T[7]!, p[2]! - T[11]!]
  // camera coordinates = R^T d
  const x = T[0]! * d[0] + T[4]! * d[1] + T[8]! * d[2]
  const y = T[1]! * d[0] + T[5]! * d[1] + T[9]! * d[2]
  const z = T[2]! * d[0] + T[6]! * d[1] + T[10]! * d[2]
  const depth = -z
  return [(x / depth) * cam.fx + cam.cx, (-y / depth) * cam.fy + cam.cy]
}

export type PoseSink = (t: number, poses: Float32Array) => void

export class MuJoCoEnv {
  readonly profile: RobotProfile
  readonly dims: Dims
  readonly max_width: number
  readonly force_sensor: boolean
  readonly task: TaskSpec
  readonly cfg: Config
  readonly model: MjModel
  readonly data: MjData
  readonly n_joints: number
  readonly control_dt: number
  readonly q_home: number[]
  /** callable(t, poses) every control tick (live 3D streaming) */
  poseSink: PoseSink | null = null
  /** invoked every `frameEvery` control ticks while stepping (agent-camera frames) */
  frameSink: (() => void) | null = null
  /** awaited after every control tick of an async run: pacing to wall-clock time, Stop checks, yielding */
  pace: (() => Promise<void> | void) | null = null
  frameEvery: number
  pushHint: Record<string, Vec3> = {}
  /** supplies agent-camera PNGs; set by the browser worker */
  imageProvider: ((camera: string) => Promise<Uint8Array | null>) | null = null

  private readonly mj: MujocoApi
  private readonly so: boolean
  private readonly jid: number[]
  private readonly qadr: number[]
  private readonly dadr: number[]
  private readonly hand: number
  private readonly tcp: number
  private jaw = -1
  private jawAdr = -1
  private ft = -1
  private fq: number[] = []
  private forceAdr = -1
  private torqueAdr = -1
  private jawTheta: number[] = []
  private jawWidth: number[] = []
  private readonly lo: number[]
  private readonly hi: number[]
  private readonly substeps: number
  private qDes: number[]
  private gripCtrl: number
  private tick = 0
  private jacP: DoubleBuffer
  private jacR: DoubleBuffer

  private constructor(mj: MujocoApi, model: MjModel, task: TaskSpec, cfg: Config, profile: RobotProfile) {
    this.mj = mj
    this.profile = profile
    this.dims = profile.dims
    this.max_width = profile.max_width
    this.force_sensor = profile.force_sensor
    this.task = adaptTask(task, profile)
    this.cfg = cfg
    this.model = model
    this.data = new mj.MjData(model)
    const so = (this.so = profile.id === 'so101')
    const id = (type: keyof MujocoApi['mjtObj'], name: string): number => {
      const i = mj.mj_name2id(model, mj.mjtObj[type].value, name)
      if (i < 0) throw new Error(`model has no ${type} '${name}'`)
      return i
    }
    this.n_joints = profile.dof
    this.jid = ARM_JOINTS[profile.id]!.map((n) => id('mjOBJ_JOINT', n))
    this.qadr = this.jid.map((j) => model.jnt_qposadr[j]!)
    this.dadr = this.jid.map((j) => model.jnt_dofadr[j]!)
    this.hand = id('mjOBJ_BODY', so ? 'gripper' : 'hand')
    this.tcp = id('mjOBJ_SITE', 'tcp')
    if (so) {
      this.jaw = id('mjOBJ_JOINT', 'gripper')
      this.jawAdr = model.jnt_qposadr[this.jaw]!
      this.buildJawTable(mj, id('mjOBJ_GEOM', 'moving_jaw_sph_tip1'))
    } else {
      this.fq = ['finger_joint1', 'finger_joint2'].map((n) => model.jnt_qposadr[id('mjOBJ_JOINT', n)]!)
      this.ft = id('mjOBJ_SITE', 'ft')
      this.forceAdr = model.sensor_adr[id('mjOBJ_SENSOR', 'wrist_force')]!
      this.torqueAdr = model.sensor_adr[id('mjOBJ_SENSOR', 'wrist_torque')]!
    }
    this.lo = this.jid.map((j) => model.jnt_range[j * 2]!)
    this.hi = this.jid.map((j) => model.jnt_range[j * 2 + 1]!)
    this.control_dt = 1 / cfg.sim.control_hz
    this.substeps = Math.max(1, Math.round(this.control_dt / model.opt.timestep))
    this.qDes = new Array(this.n_joints).fill(0)
    this.gripCtrl = so ? this.widthToJaw(this.max_width) : GRIPPER_CTRL_MAX
    this.frameEvery = Math.max(1, Math.round(cfg.sim.control_hz / (cfg.pipeline.video_fps ?? 20)))
    this.q_home = so ? [...SO101_HOME] : Array.from(model.key_qpos.subarray(0, 7))
    this.jacP = mj.DoubleBuffer.FromArray(new Float64Array(3 * model.nv))
    this.jacR = mj.DoubleBuffer.FromArray(new Float64Array(3 * model.nv))
  }

  /** Mount the arm's assets, compile the task's model and settle the scene. */
  static async create(
    mj: MujocoApi, assets: AssetSource, task: TaskSpec, cfg: Config, robot?: string | RobotProfile | null,
  ): Promise<MuJoCoEnv> {
    const profile = typeof robot === 'object' && robot ? robot : getProfile(robot)
    const adapted = adaptTask(task, profile)
    const base = await mountRobot(mj, assets, profile.id)
    const model = compileXml(mj, profile.id, buildModelXml(base, adapted, cfg, profile))
    return new MuJoCoEnv(mj, model, task, cfg, profile)
  }

  // ---------------------------------------------------------------- SO-ARM101 jaw <-> opening width
  /** One moving jaw on a hinge: opening width = distance from the fixed jaw's inner face to the moving jaw's fingertip
   *  along the opening direction; tabulated once so it can be inverted. */
  private buildJawTable(mj: MujocoApi, tip: number): void {
    const m = this.model
    const d = new mj.MjData(m)
    const lo = m.jnt_range[this.jaw * 2]!
    const hi = m.jnt_range[this.jaw * 2 + 1]!
    const N = 181
    let run = -Infinity
    for (let i = 0; i < N; i++) {
      const th = lo + ((hi - lo) * i) / (N - 1)
      d.qpos[this.jawAdr] = th // every other (arm) joint stays at its zero reference
      mj.mj_kinematics(m, d)
      const R = d.xmat.subarray(this.hand * 9, this.hand * 9 + 9)
      const dg = [0, 1, 2].map((k) => d.geom_xpos[tip * 3 + k]! - d.xpos[this.hand * 3 + k]!)
      const local = matTVec(R, dg)
      run = Math.max(run, local[0] - SO101_FIXED_PAD_X)
      this.jawTheta.push(th)
      this.jawWidth.push(run) // monotone in the usable range
    }
    d.delete()
  }

  private interp(x: number, xs: number[], ys: number[]): number {
    if (x <= xs[0]!) return ys[0]!
    if (x >= xs[xs.length - 1]!) return ys[ys.length - 1]!
    let lo = 0
    let hi = xs.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (xs[mid]! <= x) lo = mid
      else hi = mid
    }
    const t = (x - xs[lo]!) / (xs[hi]! - xs[lo]!)
    return ys[lo]! + t * (ys[hi]! - ys[lo]!)
  }

  private widthToJaw(width: number): number {
    return this.interp(Math.min(Math.max(width, this.jawWidth[0]!), this.max_width), this.jawWidth, this.jawTheta)
  }

  private gripperWidth(): number {
    if (this.so) return this.interp(this.data.qpos[this.jawAdr]!, this.jawTheta, this.jawWidth)
    const q = this.data.qpos
    return q[this.fq[0]!]! + q[this.fq[1]!]!
  }

  // ---------------------------------------------------------------- scene
  reset(seed: number): void {
    const m = this.model
    const d = this.data
    const mj = this.mj
    const rng = new DefaultRng(seed)
    if (this.so) {
      mj.mj_resetData(m, d)
      this.qadr.forEach((a, i) => (d.qpos[a] = this.q_home[i]!))
      d.qpos[this.jawAdr] = this.widthToJaw(this.max_width)
    } else {
      mj.mj_resetDataKeyframe(m, d, mj.mj_name2id(m, mj.mjtObj.mjOBJ_KEY.value, 'home'))
    }
    const placed: [number, number][] = []
    for (const o of this.task.objects) {
      let x = 0
      let y = 0
      for (let k = 0; k < 200; k++) {
        x = rng.uniform(o.x_range[0], o.x_range[1])
        y = rng.uniform(o.y_range[0], o.y_range[1])
        if (placed.every(([px, py]) => Math.hypot(x - px, y - py) >= this.task.min_object_separation)) break
      }
      placed.push([x, y])
      const yaw = rng.uniform(o.yaw_range[0], o.yaw_range[1])
      let quat: number[] = [Math.cos(yaw / 2), 0, 0, Math.sin(yaw / 2)]
      const bid = mj.mj_name2id(m, mj.mjtObj.mjOBJ_BODY.value, o.name)
      const adr = m.jnt_qposadr[mj.mj_name2id(m, mj.mjtObj.mjOBJ_JOINT.value, `${o.name}_free`)]!
      let z = m.body_pos[bid * 3 + 2]!
      if (o.type === 'bottle' && o.lying) {
        // knocked over: axis horizontal, resting on its side
        const roll = [Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), 0, 0]
        quat = quatMul([Math.cos(yaw / 2), 0, 0, Math.sin(yaw / 2)], roll)
        z = this.dims.bottle_r + 0.002
      }
      d.qpos.set([x, y, z, ...quat], adr)
    }
    mj.mj_forward(m, d)
    this.qDes = [...this.q_home]
    this.gripCtrl = this.so ? this.widthToJaw(this.max_width) : GRIPPER_CTRL_MAX
    this.pushHint = {}
    this.tick = 0
    this.applyCtrl()
    const n = Math.trunc(this.cfg.sim.settle_seconds / m.opt.timestep)
    for (let i = 0; i < n; i++) mj.mj_step(m, d)
  }

  // ---------------------------------------------------------------- RobotInterface
  state(): RobotState {
    const d = this.data
    const wrench = [0, 0, 0, 0, 0, 0] // arms without a wrist sensor report zeros
    if (this.force_sensor) {
      const R = d.site_xmat.subarray(this.ft * 9, this.ft * 9 + 9)
      const f = matVec(R, d.sensordata.subarray(this.forceAdr, this.forceAdr + 3))
      const t = matVec(R, d.sensordata.subarray(this.torqueAdr, this.torqueAdr + 3))
      wrench.splice(0, 6, ...f, ...t)
    }
    const qpos = d.qpos
    const qvel = d.qvel
    return {
      q: this.qadr.map((a) => qpos[a]!),
      dq: this.dadr.map((a) => qvel[a]!),
      tcp_pos: Array.from(d.site_xpos.subarray(this.tcp * 3, this.tcp * 3 + 3)) as Vec3,
      tcp_rot: Array.from(d.site_xmat.subarray(this.tcp * 9, this.tcp * 9 + 9)) as Mat3,
      gripper_width: this.gripperWidth(), wrench, t: d.time,
    }
  }

  /** (3,n) linear and (3,n) angular Jacobians of the end-effector body at a world point. */
  jacobian(point: ArrayLike<number>): [Mat, Mat] {
    const nv = this.model.nv
    this.mj.mj_jac(this.model, this.data, this.jacP, this.jacR, Float64Array.from(point as ArrayLike<number>), this.hand)
    const jp = this.jacP.GetView()
    const jr = this.jacR.GetView()
    const n = this.n_joints
    const P = new Mat(3, n)
    const R = new Mat(3, n)
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < n; c++) {
        P.data[r * n + c] = jp[r * nv + this.dadr[c]!]!
        R.data[r * n + c] = jr[r * nv + this.dadr[c]!]!
      }
    return [P, R]
  }

  jointLimits(): [number[], number[]] {
    return [this.lo, this.hi]
  }

  setJointTargets(q: ArrayLike<number>): void {
    this.qDes = this.qDes.map((_, i) => Math.min(Math.max(q[i]!, this.lo[i]!), this.hi[i]!))
  }

  setGripper(width: number): void {
    if (this.so) this.gripCtrl = this.widthToJaw(width) // jaw angle (rad)
    else this.gripCtrl = Math.min(Math.max(width / this.max_width, 0), 1) * GRIPPER_CTRL_MAX
  }

  private applyCtrl(): void {
    const c = this.data.ctrl
    for (let i = 0; i < this.n_joints; i++) c[i] = this.qDes[i]!
    c[this.n_joints] = this.gripCtrl
  }

  /** Advance one control period (physics only, synchronous). */
  step(): void {
    this.applyCtrl()
    for (let i = 0; i < this.substeps; i++) this.mj.mj_step(this.model, this.data)
    this.tick++
    if (this.poseSink) this.poseSink(this.data.time, poses(this.model, this.data))
    if (this.frameSink && this.tick % this.frameEvery === 0) this.frameSink()
  }

  /** step(), then give the host a chance to pace, honour Stop and yield to the event loop. */
  async stepAsync(): Promise<void> {
    this.step()
    if (this.pace) await this.pace()
  }

  /** Snapshot of all body poses (nbody x 7 float32) and the sim time. */
  poseSnapshot(): { t: number; poses: Float32Array } {
    return { t: this.data.time, poses: poses(this.model, this.data) }
  }

  // ---------------------------------------------------------------- SimEnv
  private id(type: keyof MujocoApi['mjtObj'], name: string): number {
    return this.mj.mj_name2id(this.model, this.mj.mjtObj[type].value, name)
  }

  render(camera = 'scene'): Observation {
    const cc = this.cfg.sim.cameras[camera as 'scene' | 'wrist']
    const name = `${camera}_cam`
    const cid = this.id('mjOBJ_CAMERA', name)
    if (cid < 0) throw new Error(`no camera '${name}'`)
    const R = this.data.cam_xmat.subarray(cid * 9, cid * 9 + 9)
    const p = this.data.cam_xpos.subarray(cid * 3, cid * 3 + 3)
    const T = [R[0]!, R[1]!, R[2]!, p[0]!, R[3]!, R[4]!, R[5]!, p[1]!, R[6]!, R[7]!, R[8]!, p[2]!, 0, 0, 0, 1]
    const cam = cameraFromFovy(camera, cc.width, cc.height, this.model.cam_fovy[cid]!, T)
    return { camera: cam, t: this.data.time, png: async () => (this.imageProvider ? this.imageProvider(camera) : null) }
  }

  /**
   * Top-down height map around (cx, cy): hm[iy * n + ix] = height of the highest table-level object surface in that
   * cell (-Infinity if nothing). Replaces the depth-camera height map of perception/clearance.py: rays are cast
   * straight down from above the workspace, ignoring the arm (which lives in visual group 2).
   */
  heightMap(cx: number, cy: number, half: number, res: number, maxZ: number): { hm: Float64Array; n: number; zTable: number } | null {
    const n = Math.trunc((2 * half) / res)
    const hm = new Float64Array(n * n).fill(-Infinity)
    const pnt = new Float64Array(3)
    const vec = new Float64Array([0, 0, -1])
    const groups = new Uint8Array([1, 0, 0, 0, 0, 0]) // object / table / floor geoms (group 0); the arm is group 2
    const geomId = new Int32Array(1)
    const normal = new Float64Array(3)
    const top = 0.5
    let hits = 0
    const zs: number[] = []
    for (let iy = 0; iy < n; iy++)
      for (let ix = 0; ix < n; ix++) {
        pnt[0] = cx - half + (ix + 0.5) * res
        pnt[1] = cy - half + (iy + 0.5) * res
        pnt[2] = top
        const dist = this.mj.mj_ray(this.model, this.data, pnt, vec, groups, 1, -1, geomId, normal)
        if (dist < 0) continue
        const z = Math.min(top - dist, maxZ)
        hm[iy * n + ix] = z
        zs.push(z)
        hits++
      }
    if (hits < 200) return null
    // the table is the most common height
    const bins = new Map<number, number>()
    for (const z of zs) {
      if (z <= -0.05 || z >= maxZ) continue
      const b = Math.floor((z + 0.05) / 0.002)
      bins.set(b, (bins.get(b) ?? 0) + 1)
    }
    let best = 0
    let bestCount = -1
    for (const [b, c] of bins) if (c > bestCount || (c === bestCount && b < best)) [best, bestCount] = [b, c]
    return { hm, n, zTable: -0.05 + best * 0.002 + 0.001 }
  }

  private rayPnt = new Float64Array(3)
  private rayVec = new Float64Array(3)
  private rayGeom = new Int32Array(1)
  private rayNormal = new Float64Array(3)
  private static readonly VISIBLE_GROUPS = new Uint8Array([1, 1, 1, 0, 0, 0]) // what a camera renders: objects, table, the arm's visuals

  /**
   * Distance along the world-frame ray (origin, unit dir) to the first rendered surface, or null for sky. This is the
   * browser's depth image: the WASM build has no depth renderer, but one ray per pixel gives the same number.
   */
  castRay(origin: ArrayLike<number>, dir: ArrayLike<number>): number | null {
    for (let i = 0; i < 3; i++) {
      this.rayPnt[i] = origin[i]!
      this.rayVec[i] = dir[i]!
    }
    const d = this.mj.mj_ray(this.model, this.data, this.rayPnt, this.rayVec, MuJoCoEnv.VISIBLE_GROUPS, 1, -1, this.rayGeom, this.rayNormal)
    return d < 0 ? null : d
  }

  /** A reachable bare-table point far from every object (used by oracle grounding / the demo planner). */
  freeTableSpot(): Vec3 {
    const objs = this.task.objects.map((o) => this.objectPos(o.name).slice(0, 2))
    const k = this.dims.tray_half / 0.09 // keep-out radii scale with the arm's objects
    const clear = this.task.objects.map((o) => (o.type === 'tray' ? 0.14 : 0.08) * k)
    let best: Vec3 = [0, 0, 0]
    let bestScore = -1e9
    const [x0, x1, y1] = this.profile.id === 'franka' ? [0.34, 0.62, 0.34] : [0.11, 0.26, 0.15]
    for (let i = 0; i < 15; i++) {
      const x = x0 + ((x1 - x0) * i) / 14
      for (let j = 0; j < 35; j++) {
        const y = -y1 + ((2 * y1) * j) / 34
        let score = Math.min(...objs.map((p, idx) => Math.hypot(x - p[0]!, y - p[1]!) - clear[idx]!))
        score -= 0.15 * Math.abs(y) // prefer spots near the middle of the workspace
        if (score > bestScore) {
          best = [x, y, 0]
          bestScore = score
        }
      }
    }
    return best
  }

  private bottleFrame(name: string): [Vec3, Vec3] | null {
    for (const o of this.task.objects) {
      if (o.type === 'bottle' && (name === `${o.name}_body_center` || name === `${o.name}_cap_end`)) {
        const bid = this.id('mjOBJ_BODY', o.name)
        const x = this.data.xmat
        return [
          Array.from(this.data.xpos.subarray(bid * 3, bid * 3 + 3)) as Vec3,
          [x[bid * 9 + 2]!, x[bid * 9 + 5]!, x[bid * 9 + 8]!], // centre, axis (cap side)
        ]
      }
    }
    return null
  }

  bottleLying(name = 'bottle'): boolean {
    const bid = this.id('mjOBJ_BODY', name)
    return Math.abs(this.data.xmat[bid * 9 + 8]!) < 0.5
  }

  /** Ground-truth (position, normal) of a named keypoint; used for oracle grounding + eval only. */
  gtKeypoint(name: string): [Vec3, Vec3] {
    const hint = this.pushHint[name]
    if (hint) return [[...hint] as Vec3, [0, 0, 1]]
    const frame = this.bottleFrame(name)
    if (frame) {
      // surface points on a (possibly lying) bottle
      const [c, a] = frame
      const D = this.dims
      const up: Vec3 = [0, 0, 1]
      const dd = dot(up, a)
      const perpRaw: Vec3 = [up[0] - dd * a[0], up[1] - dd * a[1], up[2] - dd * a[2]]
      const lying = norm(perpRaw) > 1e-3
      const perp: Vec3 = lying ? normalize(perpRaw) : up
      if (name.endsWith('_body_center'))
        return lying
          ? [[c[0] + D.bottle_r * perp[0], c[1] + D.bottle_r * perp[1], c[2] + D.bottle_r * perp[2]], up]
          : [[c[0] + a[0] * D.bottle_half_h, c[1] + a[1] * D.bottle_half_h, c[2] + a[2] * D.bottle_half_h], a]
      const k = D.bottle_half_h + D.cap_half_h
      const base: Vec3 = [c[0] + a[0] * k, c[1] + a[1] * k, c[2] + a[2] * k]
      return lying
        ? [[base[0] + D.cap_r * perp[0], base[1] + D.cap_r * perp[1], base[2] + D.cap_r * perp[2]], up]
        : [[base[0] + a[0] * D.cap_half_h, base[1] + a[1] * D.cap_half_h, base[2] + a[2] * D.cap_half_h], a]
    }
    if (name === 'table_free_spot') return [this.freeTableSpot(), [0, 0, 1]]
    const sid = this.id('mjOBJ_SITE', name)
    if (sid < 0) throw new Error(`unknown keypoint '${name}'`)
    const x = this.data.site_xmat
    return [
      Array.from(this.data.site_xpos.subarray(sid * 3, sid * 3 + 3)) as Vec3,
      [x[sid * 9 + 2]!, x[sid * 9 + 5]!, x[sid * 9 + 8]!],
    ]
  }

  /** Like gtKeypoint, but a tray that already holds something is aimed at its visible empty floor. */
  visibleKeypoint(name: string): [Vec3, Vec3] {
    const [p0, normal] = this.gtKeypoint(name)
    let pos = p0
    if (name === 'box_inside') {
      const box = this.objectPos('box')
      const th = this.dims.tray_half
      const inside = this.task.objects
        .filter((o) => o.name !== 'box')
        .map((o) => this.objectPos(o.name))
        .filter((p) => Math.abs(p[0] - box[0]) < th && Math.abs(p[1] - box[1]) < th && p[2] < 0.1)
      if (inside.length) {
        const dy = inside.reduce((a, p) => a + (p[1] - box[1]), 0) / inside.length
        pos = [pos[0], pos[1] + (dy > 0 ? -0.55 : 0.55) * th, pos[2]]
      }
    }
    return [pos, normal]
  }

  /** In-plane edge axis + symmetry for boxy keypoints (cube tops); null / 180 for round ones. */
  gtAxis(name: string): [Vec3 | null, number] {
    if (!name.startsWith('cube')) return [null, 180]
    const sid = this.id('mjOBJ_SITE', name)
    const x = this.data.site_xmat
    return [[x[sid * 9]!, x[sid * 9 + 3]!, x[sid * 9 + 6]!], 90]
  }

  objectPos(name: string): Vec3 {
    const b = this.id('mjOBJ_BODY', name)
    return Array.from(this.data.xpos.subarray(b * 3, b * 3 + 3)) as Vec3
  }

  objectVel(name: string): Vec3 {
    const b = this.id('mjOBJ_BODY', name)
    return Array.from(this.data.cvel.subarray(b * 6 + 3, b * 6 + 6)) as Vec3
  }

  hasKeypoint(name: string): boolean {
    return name === 'table_free_spot' || name in this.pushHint || this.bottleFrame(name) !== null || this.id('mjOBJ_SITE', name) >= 0
  }

  /** x axis of the body frame, used by the demo planner to footprint a lying bottle */
  bodyAxisZ(name: string): Vec3 {
    const b = this.id('mjOBJ_BODY', name)
    const x = this.data.xmat
    return [x[b * 9 + 2]!, x[b * 9 + 5]!, x[b * 9 + 8]!]
  }

  close(): void {
    this.jacP.delete()
    this.jacR.delete()
    this.data.delete()
    this.model.delete()
  }
}
