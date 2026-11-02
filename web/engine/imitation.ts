/**
 * Video imitation: the arm follows a timed end-effector trajectory (TCP pose + gripper opening) retargeted from a
 * human hand in a video. Tracking uses the same prioritised differential IK as the task controllers: position first,
 * orientation in its null space, the home posture last. Physics stays on, so grasps and pushes happen for real.
 */
import { solveStack, type TaskTerm } from './controllers'
import { matMulT, matToRotvec, type Mat3, type Vec3 } from './linalg'
import type { MuJoCoEnv } from './env'

export interface ImitationTrajectory {
  /** seconds between samples */
  dt: number
  /** TCP target positions, robot frame (N x 3) */
  pos: number[][]
  /** TCP target rotations, row-major 3x3 whose columns are the tcp axes in the robot frame (N x 9) */
  rot: number[][]
  /** gripper opening command in metres (N) */
  width: number[]
  /** frames where the hand was really seen (others were filled in); only used for the report */
  seen?: boolean[]
  /** grasps found in the video: sample range and the object the hand closed on */
  grasps?: { start: number; end: number; object: string | null }[]
}

export interface ImitationOptions {
  /** seconds to move from the current pose to the first sample */
  preroll?: number
  /** seconds to hold after the last sample */
  hold?: number
  posGain?: number
  angGain?: number
  maxLinSpeed?: number
  maxAngSpeed?: number
}

export interface ImitationResult {
  samples: number
  duration_s: number
  /** mean / 95th percentile TCP position error while following the video (metres) */
  err_mean: number
  err_p95: number
  /** share of samples tracked within 2 cm */
  tracked: number
  grasps: { object: string | null; start_s: number; end_s: number; lifted: boolean; lift_m: number }[]
}

export interface ImitationHooks {
  /** called once when the preroll is over and the video's time zero starts */
  onStart?: () => void
  /** called about every 0.1 s of trajectory time */
  onProgress?: (t: number, err: number) => void
}

const smooth = (a: number): number => a * a * a * (10 + a * (-15 + 6 * a)) // minimum jerk

function rotvecToMat(r: ArrayLike<number>): Mat3 {
  const th = Math.hypot(r[0]!, r[1]!, r[2]!)
  if (th < 1e-12) return [1, 0, 0, 0, 1, 0, 0, 0, 1]
  const [x, y, z] = [r[0]! / th, r[1]! / th, r[2]! / th]
  const c = Math.cos(th)
  const s = Math.sin(th)
  const C = 1 - c
  return [
    c + x * x * C, x * y * C - z * s, x * z * C + y * s,
    y * x * C + z * s, c + y * y * C, y * z * C - x * s,
    z * x * C - y * s, z * y * C + x * s, c + z * z * C,
  ]
}
const matMul3 = (a: ArrayLike<number>, b: ArrayLike<number>): Mat3 => {
  const o = new Array<number>(9).fill(0)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j]! += a[i * 3 + k]! * b[k * 3 + j]!
  return o as Mat3
}
const transpose = (a: ArrayLike<number>): Mat3 => [a[0]!, a[3]!, a[6]!, a[1]!, a[4]!, a[7]!, a[2]!, a[5]!, a[8]!]

/** Rotation a fraction `k` of the way from R0 to R1 (geodesic). */
export function slerpMat(R0: ArrayLike<number>, R1: ArrayLike<number>, k: number): Mat3 {
  const d = matToRotvec(matMul3(transpose(R0), R1))
  return matMul3(R0, rotvecToMat([d[0] * k, d[1] * k, d[2] * k]))
}

/** Follow `traj` on `env` (async: paced by env.pace, Stop throws from there). */
export async function runImitation(env: MuJoCoEnv, traj: ImitationTrajectory, opts: ImitationOptions = {}, hooks: ImitationHooks = {}): Promise<ImitationResult> {
  const N = traj.pos.length
  if (N < 2) throw new Error('the trajectory needs at least two samples')
  const dt = env.control_dt
  const preroll = opts.preroll ?? 2.5
  const hold = opts.hold ?? 1.0
  const kp = opts.posGain ?? 10
  const kr = opts.angGain ?? 6
  const vmax = opts.maxLinSpeed ?? 1.2
  const wmax = opts.maxAngSpeed ?? 3.5
  const damping = env.cfg.execution.damping
  const n = env.n_joints
  const objects = env.task.objects.map((o) => o.name)
  const z0: Record<string, number> = Object.fromEntries(objects.map((o) => [o, env.objectPos(o)[2]]))
  const zMax: Record<number, number> = {}

  const s0 = env.state()
  const p0 = [...s0.tcp_pos]
  const R0 = [...s0.tcp_rot]
  const T = (N - 1) * traj.dt
  let qDes = s0.q.slice()
  const errs: number[] = new Array(N).fill(NaN)
  let lastProgress = -1
  let started = false

  const total = preroll + T + hold
  for (let t = 0; t <= total + 1e-9; t += dt) {
    let p: Vec3
    let R: Mat3
    let v: Vec3 = [0, 0, 0]
    let w: number
    let idx = -1
    if (t < preroll) {
      const k = smooth(t / preroll)
      const p1 = traj.pos[0]!
      p = [p0[0]! + (p1[0]! - p0[0]!) * k, p0[1]! + (p1[1]! - p0[1]!) * k, p0[2]! + (p1[2]! - p0[2]!) * k]
      R = slerpMat(R0, traj.rot[0]!, k)
      w = traj.width[0]!
    } else {
      if (!started) {
        started = true
        hooks.onStart?.()
      }
      const tau = Math.min(t - preroll, T)
      const f = tau / traj.dt
      const i = Math.min(Math.floor(f), N - 2)
      const a = Math.min(Math.max(f - i, 0), 1)
      const A = traj.pos[i]!
      const B = traj.pos[i + 1]!
      p = [A[0]! + (B[0]! - A[0]!) * a, A[1]! + (B[1]! - A[1]!) * a, A[2]! + (B[2]! - A[2]!) * a]
      if (t - preroll < T) v = [(B[0]! - A[0]!) / traj.dt, (B[1]! - A[1]!) / traj.dt, (B[2]! - A[2]!) / traj.dt]
      R = slerpMat(traj.rot[i]!, traj.rot[i + 1]!, a)
      w = traj.width[i]! + (traj.width[i + 1]! - traj.width[i]!) * a
      idx = Math.round(f)
      if (hooks.onProgress && tau - lastProgress >= 0.1) {
        lastProgress = tau
        const s = env.state()
        hooks.onProgress(tau, Math.hypot(p[0] - s.tcp_pos[0], p[1] - s.tcp_pos[1], p[2] - s.tcp_pos[2]))
      }
    }
    env.setGripper(w)
    const s = env.state()
    const [jp, jr] = env.jacobian(s.tcp_pos)
    const ep = [p[0] - s.tcp_pos[0], p[1] - s.tcp_pos[1], p[2] - s.tcp_pos[2]]
    if (idx >= 0 && idx < N && t - preroll <= T) {
      const e = Math.hypot(ep[0]!, ep[1]!, ep[2]!)
      errs[idx] = Number.isNaN(errs[idx]!) ? e : Math.max(errs[idx]!, e)
    }
    // feed-forward velocity rides on the error term: gain * (e + v / gain) = gain * e + v
    const levels: TaskTerm[][] = [
      [{ J: jp, e: new Float64Array([ep[0]! + v[0] / kp, ep[1]! + v[1] / kp, ep[2]! + v[2] / kp]), gain: kp, v_max: vmax }],
      [{ J: jr, e: new Float64Array(matToRotvec(matMulT(R, s.tcp_rot))), gain: kr, v_max: wmax }],
    ]
    const dq = solveStack(levels, n, damping, env.q_home.map((q, i) => q - s.q[i]!), 0.3, 3.0)
    qDes = qDes.map((q, i) => Math.min(Math.max(q + dq[i]! * dt, s.q[i]! - 0.15), s.q[i]! + 0.15))
    env.setJointTargets(qDes)
    await env.stepAsync()
    for (const [gi, g] of (traj.grasps ?? []).entries()) {
      if (!g.object || idx < g.start || idx > g.end + Math.round(0.5 / traj.dt)) continue
      zMax[gi] = Math.max(zMax[gi] ?? -Infinity, env.objectPos(g.object)[2])
    }
  }

  const tracked = errs.filter((e) => !Number.isNaN(e))
  const sorted = [...tracked].sort((a, b) => a - b)
  return {
    samples: N,
    duration_s: T,
    err_mean: tracked.reduce((a, b) => a + b, 0) / Math.max(tracked.length, 1),
    err_p95: sorted[Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length))] ?? 0,
    tracked: tracked.filter((e) => e < 0.02).length / Math.max(tracked.length, 1),
    grasps: (traj.grasps ?? []).map((g, gi) => {
      const lift = g.object && zMax[gi] !== undefined ? zMax[gi]! - z0[g.object]! : 0
      return { object: g.object, start_s: g.start * traj.dt, end_s: g.end * traj.dt, lifted: lift > 0.02, lift_m: lift }
    }),
  }
}
