/**
 * Video -> robot geometry, no browser APIs (unit-testable under Node):
 *   hand keypoints (MediaPipe) -> 3D camera frame (hand size, or a depth video when there is one)
 *   -> table plane and a world frame on it -> objects on the table -> robot base placement
 *   -> TCP pose + gripper opening per frame (retargeting) -> grasp correction near contact.
 *
 * Camera frame: OpenCV (x right, y down, z forward). World frame: on the table top, z up, x pointing away from the
 * camera. Robot frame: the Dooms convention (base at the origin, x forward, z up, table top at z = 0).
 */

export type V3 = [number, number, number]
export type M3 = [number, number, number, number, number, number, number, number, number] // row-major

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
export const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const len = (a: V3): number => Math.hypot(a[0], a[1], a[2])
export const unit = (a: V3): V3 => {
  const n = len(a)
  return n > 1e-12 ? [a[0] / n, a[1] / n, a[2] / n] : [0, 0, 0]
}
export const mid = (a: V3, b: V3): V3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
const clamp = (x: number, lo: number, hi: number): number => Math.min(Math.max(x, lo), hi)
const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}
export const percentile = (xs: number[], p: number): number => {
  const s = [...xs].sort((a, b) => a - b)
  return s[clamp(Math.round(p * (s.length - 1)), 0, s.length - 1)]!
}
/** rows of R applied to v */
export const mv = (R: M3, v: V3): V3 => [
  R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2],
]
/** matrix whose columns are a, b, c */
export const fromCols = (a: V3, b: V3, c: V3): M3 => [a[0], b[0], c[0], a[1], b[1], c[1], a[2], b[2], c[2]]
const rotZ = (yaw: number): M3 => {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return [c, -s, 0, s, c, 0, 0, 0, 1]
}
const mm = (a: M3, b: M3): M3 => {
  const o = new Array<number>(9).fill(0)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j]! += a[i * 3 + k]! * b[k * 3 + j]!
  return o as M3
}

/** Rotation matrix (row-major) -> quaternion (w x y z), the same formula as mju_mat2Quat. */
export function quatFromMat(m: M3): [number, number, number, number] {
  const tr = m[0] + m[4] + m[8]
  let q: [number, number, number, number]
  if (tr > 0) q = [1 + tr, m[7] - m[5], m[2] - m[6], m[3] - m[1]]
  else if (m[0] > m[4] && m[0] > m[8]) q = [m[7] - m[5], 1 + m[0] - m[4] - m[8], m[1] + m[3], m[2] + m[6]]
  else if (m[4] > m[8]) q = [m[2] - m[6], m[1] + m[3], 1 + m[4] - m[0] - m[8], m[5] + m[7]]
  else q = [m[3] - m[1], m[2] + m[6], m[5] + m[7], 1 + m[8] - m[0] - m[4]]
  const n = Math.hypot(...q)
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n]
}

// ------------------------------------------------------------------------------------------------ camera

export interface Intrinsics {
  width: number
  height: number
  fx: number
  fy: number
  cx: number
  cy: number
}
/** Pinhole intrinsics from the horizontal field of view (phones film at roughly 65-75 degrees). */
export function intrinsicsFromFov(width: number, height: number, hfovDeg: number): Intrinsics {
  const f = (0.5 * width) / Math.tan((hfovDeg * Math.PI) / 360)
  return { width, height, fx: f, fy: f, cx: width / 2, cy: height / 2 }
}
export const ray = (K: Intrinsics, u: number, v: number): V3 => unit([(u - K.cx) / K.fx, (v - K.cy) / K.fy, 1])
export const backproject = (K: Intrinsics, u: number, v: number, z: number): V3 => [((u - K.cx) / K.fx) * z, ((v - K.cy) / K.fy) * z, z]
export const project = (K: Intrinsics, p: V3): [number, number] => [K.fx * (p[0] / p[2]) + K.cx, K.fy * (p[1] / p[2]) + K.cy]

// ------------------------------------------------------------------------------------------------ hand lifting

/** MediaPipe hand landmark indices used here. */
export const H = { WRIST: 0, THUMB_TIP: 4, INDEX_MCP: 5, INDEX_TIP: 8, MIDDLE_MCP: 9, MIDDLE_TIP: 12, RING_MCP: 13, PINKY_MCP: 17 } as const
const PALM = [0, 5, 9, 13, 17]

export interface HandObs {
  /** 21 landmarks in pixels */
  image: [number, number][]
  /** 21 landmarks in metres around the hand's centre (MediaPipe world landmarks, camera-aligned axes) */
  world: V3[]
}

function solve3(A: number[][], b: number[]): V3 | null {
  const [a, c, e] = [A[0]!, A[1]!, A[2]!]
  const det = a[0]! * (c[1]! * e[2]! - c[2]! * e[1]!) - a[1]! * (c[0]! * e[2]! - c[2]! * e[0]!) + a[2]! * (c[0]! * e[1]! - c[1]! * e[0]!)
  if (Math.abs(det) < 1e-12) return null
  const col = (i: number, v: number[]): number[][] => A.map((r, k) => r.map((x, j) => (j === i ? v[k]! : x)))
  const d = (M: number[][]): number => M[0]![0]! * (M[1]![1]! * M[2]![2]! - M[1]![2]! * M[2]![1]!) - M[0]![1]! * (M[1]![0]! * M[2]![2]! - M[1]![2]! * M[2]![0]!) + M[0]![2]! * (M[1]![0]! * M[2]![1]! - M[1]![1]! * M[2]![0]!)
  return [d(col(0, b)) / det, d(col(1, b)) / det, d(col(2, b)) / det]
}

/**
 * Translation t that puts the metric hand model (world landmarks W) where the image landmarks are: for every
 * landmark, (W + t) projects to its pixel. Linear least squares in t; the hand's known size fixes the depth.
 * MediaPipe's z sign is tried both ways and the better fit wins.
 */
export function handTranslation(obs: HandObs, K: Intrinsics): { t: V3; flipZ: boolean; rms: number } | null {
  let best: { t: V3; flipZ: boolean; rms: number } | null = null
  for (const flipZ of [false, true]) {
    const AtA = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    const Atb = [0, 0, 0]
    const push = (row: number[], rhs: number): void => {
      for (let i = 0; i < 3; i++) {
        Atb[i]! += row[i]! * rhs
        for (let j = 0; j < 3; j++) AtA[i]![j]! += row[i]! * row[j]!
      }
    }
    for (let i = 0; i < obs.world.length; i++) {
      const [X, Y, Z0] = obs.world[i]!
      const Z = flipZ ? -Z0 : Z0
      const x = (obs.image[i]![0] - K.cx) / K.fx
      const y = (obs.image[i]![1] - K.cy) / K.fy
      push([1, 0, -x], x * Z - X)
      push([0, 1, -y], y * Z - Y)
    }
    const t = solve3(AtA, Atb)
    if (!t || t[2] <= 0.05) continue
    let se = 0
    for (let i = 0; i < obs.world.length; i++) {
      const w = obs.world[i]!
      const p: V3 = [w[0] + t[0], w[1] + t[1], (flipZ ? -w[2] : w[2]) + t[2]]
      const [u, v] = project(K, p)
      se += (u - obs.image[i]![0]) ** 2 + (v - obs.image[i]![1]) ** 2
    }
    const rms = Math.sqrt(se / obs.world.length)
    if (!best || rms < best.rms) best = { t, flipZ, rms }
  }
  return best
}

/** The 21 landmarks in the camera frame (metres). With depth readings at the landmarks (`depth[i]`, metres) the palm
 *  is placed on the measured surface; otherwise the hand's size sets its distance. */
export function liftHand(obs: HandObs, K: Intrinsics, depth?: (number | null)[] | null, flipZ?: boolean): { pts: V3[]; flipZ: boolean; fromDepth: boolean } | null {
  const fit = handTranslation(obs, K)
  if (!fit) return null
  const flip = flipZ ?? fit.flipZ
  const W = obs.world.map((w): V3 => [w[0], w[1], flip ? -w[2] : w[2]])
  let t = fit.t
  let fromDepth = false
  if (depth) {
    const ts: V3[] = []
    for (const i of PALM) {
      const [u, v] = obs.image[i]!
      const d = depth[i] ?? null
      if (d === null || !(d > 0.05) || d > 8) continue
      const P = backproject(K, u, v, d + 0.008) // landmarks are joint centres, about 8 mm under the skin
      ts.push(sub(P, W[i]!))
    }
    if (ts.length >= 3) {
      t = [median(ts.map((x) => x[0])), median(ts.map((x) => x[1])), median(ts.map((x) => x[2]))]
      fromDepth = true
    }
  }
  return { pts: W.map((w) => add(w, t)), flipZ: flip, fromDepth }
}

// ------------------------------------------------------------------------------------------------ time series

/** One-Euro filter (Casiez et al. 2012): little lag on fast motion, strong smoothing when the hand is still. */
export class OneEuro {
  private x: number | null = null
  private dx = 0
  constructor(private minCutoff = 0.9, private beta = 0.5, private dCutoff = 1.0) {}
  private static alpha(cutoff: number, dt: number): number {
    const tau = 1 / (2 * Math.PI * cutoff)
    return 1 / (1 + tau / dt)
  }
  filter(v: number, dt: number): number {
    if (this.x === null) {
      this.x = v
      return v
    }
    const dv = (v - this.x) / dt
    this.dx += OneEuro.alpha(this.dCutoff, dt) * (dv - this.dx)
    const a = OneEuro.alpha(this.minCutoff + this.beta * Math.abs(this.dx), dt)
    this.x += a * (v - this.x)
    return this.x
  }
}

/**
 * Fill gaps in a per-frame series of 21-point hands by linear interpolation (gaps up to `maxGap` samples; the ends
 * are held), then One-Euro smooth every coordinate. Returns null when the hand is never seen.
 */
export function cleanTrack(raw: (V3[] | null)[], dt: number, maxGap: number): { pts: V3[][]; seen: boolean[] } | null {
  const idx = raw.map((p, i) => (p ? i : -1)).filter((i) => i >= 0)
  if (!idx.length) return null
  const out: V3[][] = new Array(raw.length)
  const seen = raw.map((p) => p !== null)
  for (let i = 0; i < raw.length; i++) {
    if (raw[i]) {
      out[i] = raw[i]!
      continue
    }
    const prev = [...idx].reverse().find((k) => k < i)
    const next = idx.find((k) => k > i)
    if (prev === undefined) out[i] = raw[next!]!
    else if (next === undefined) out[i] = raw[prev]!
    else if (next - prev - 1 <= maxGap) {
      const a = (i - prev) / (next - prev)
      out[i] = raw[prev]!.map((p, j) => add(mul(p, 1 - a), mul(raw[next]![j]!, a)))
    } else out[i] = raw[(i - prev) <= (next - i) ? prev : next]!
  }
  const filters = Array.from({ length: 21 * 3 }, () => new OneEuro())
  const pts = out.map((frame) => frame.map((p, j): V3 => [0, 1, 2].map((k) => filters[j * 3 + k]!.filter(p[k]!, dt)) as V3))
  return { pts, seen }
}

// ------------------------------------------------------------------------------------------------ table plane

/** Plane n . p + d = 0 in the camera frame, n pointing up (towards the camera side). height(p) = n . p + d. */
export interface Plane {
  n: V3
  d: number
}
export const height = (pl: Plane, p: V3): number => dot(pl.n, p) + pl.d

/** RANSAC plane through 3D points (depth samples of the first frame); the largest flat surface is the table. */
export function fitPlane(points: V3[], iters = 300, tol = 0.012, seed = 1): Plane | null {
  if (points.length < 30) return null
  let s = seed
  const rnd = (): number => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  let best: { pl: Plane; inl: number } | null = null
  for (let it = 0; it < iters; it++) {
    const [a, b, c] = [0, 1, 2].map(() => points[Math.floor(rnd() * points.length)]!) as [V3, V3, V3]
    let n = unit(cross(sub(b, a), sub(c, a)))
    if (len(n) < 0.5) continue
    let d = -dot(n, a)
    if (d < 0) {
      n = mul(n, -1)
      d = -d
    } // the camera (origin) is above the table
    let inl = 0
    for (const p of points) if (Math.abs(dot(n, p) + d) < tol) inl++
    if (!best || inl > best.inl) best = { pl: { n, d }, inl }
  }
  if (!best || best.inl < 0.25 * points.length) return null
  // refine: least-squares normal of the inliers (smallest-eigenvector via a few power iterations on the covariance)
  const inl = points.filter((p) => Math.abs(dot(best!.pl.n, p) + best!.pl.d) < tol)
  const c = mul(inl.reduce((acc, p) => add(acc, p), [0, 0, 0] as V3), 1 / inl.length)
  const C = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  for (const p of inl) {
    const q = sub(p, c)
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i * 3 + j]! += q[i]! * q[j]!
  }
  // inverse iteration on (C + eps I) gives the smallest eigenvector
  const eps = 1e-9
  const A = [[C[0]! + eps, C[1]!, C[2]!], [C[3]!, C[4]! + eps, C[5]!], [C[6]!, C[7]!, C[8]! + eps]]
  let n: V3 = best.pl.n
  for (let k = 0; k < 8; k++) {
    const x = solve3(A, n)
    if (!x) break
    n = unit(x)
  }
  if (dot(n, best.pl.n) < 0) n = mul(n, -1)
  return { n, d: -dot(n, c) }
}

/**
 * Without depth: the table's up direction comes from the camera tilt (degrees below horizontal), and its height
 * from the hand itself: the fingertips come down to the table (or to the objects on it) when grasping, so the
 * lowest fingertip heights over the video lie close to the table top.
 */
export function planeFromTilt(tiltDeg: number, fingertips: V3[]): Plane {
  const p = (tiltDeg * Math.PI) / 180
  const n: V3 = [0, -Math.cos(p), -Math.sin(p)]
  const hs = fingertips.map((q) => dot(n, q))
  return { n, d: -(percentile(hs, 0.03) - 0.006) }
}

/** Ray from the camera through pixel (u, v) hits the plane at (null: above the horizon). */
export function rayPlane(K: Intrinsics, pl: Plane, u: number, v: number): V3 | null {
  const r = ray(K, u, v)
  const den = dot(pl.n, r)
  if (den > -1e-6) return null
  const s = -pl.d / den
  return s > 0 && s < 20 ? mul(r, s) : null
}

// ------------------------------------------------------------------------------------------------ world frame

/** p_world = R (p_cam - o). Rows of R are the world axes in camera coordinates. */
export interface WorldFrame {
  R: M3
  o: V3
}
export function worldFrame(pl: Plane, center: V3): WorldFrame {
  const z = pl.n
  let f: V3 = [0, 0, 1]
  if (Math.abs(dot(f, z)) > 0.95) f = [0, -1, 0] // looking straight down: "away" is the top of the image
  const x = unit(sub(f, mul(z, dot(f, z))))
  const y = cross(z, x)
  const o = sub(center, mul(z, height(pl, center)))
  return { R: [x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2]], o }
}
export const toWorld = (F: WorldFrame, p: V3): V3 => mv(F.R, sub(p, F.o))

// ------------------------------------------------------------------------------------------------ objects

export interface Detection {
  label: string
  score: number
  /** pixels: x, y (top-left), w, h */
  box: [number, number, number, number]
  /** mean colour inside the box centre, 0..1 */
  color: [number, number, number]
}
export type ObjectKind = 'block' | 'cylinder' | 'sphere' | 'beaker'
export interface SceneObject {
  name: string
  label: string
  kind: ObjectKind
  /** world frame, on the table: centre of the footprint */
  x: number
  y: number
  yaw: number
  /** footprint width / depth and height (metres) */
  w: number
  d: number
  h: number
  color: [number, number, number]
  /** the hand closed on it in the video */
  grasped?: boolean
  /** made up from a grasp because no detector saw anything there */
  inferred?: boolean
}

const OPEN = new Set(['cup', 'wine glass', 'bowl', 'vase'])
const ROUND = new Set(['bottle'])
const BALL = new Set(['apple', 'orange', 'sports ball'])
/** COCO classes that are never table-top objects in this context */
export const IGNORE = new Set(['person', 'dining table', 'chair', 'couch', 'bed', 'tv', 'toilet', 'bench', 'refrigerator', 'oven', 'sink', 'potted plant', 'car', 'bus', 'truck', 'train', 'airplane', 'boat', 'motorcycle', 'bicycle', 'horse', 'cow', 'elephant', 'bear', 'giraffe', 'zebra', 'sheep', 'dog', 'cat', 'bird'])
export const kindFor = (label: string): ObjectKind => (OPEN.has(label) ? 'beaker' : ROUND.has(label) ? 'cylinder' : BALL.has(label) ? 'sphere' : 'block')

/** Closest point on the ray (origin 0, unit r) to the vertical line through c (direction n); returns the line parameter. */
function rayToVertical(r: V3, c: V3, n: V3): number {
  // minimise |s r - (c + l n)|: [r.r, -r.n; r.n, -n.n] [s, l] = [r.c, n.c]
  const a = dot(r, r)
  const b = dot(r, n)
  const e = dot(n, n)
  const det = -a * e + b * b
  if (Math.abs(det) < 1e-9) return 0
  const rc = dot(r, c)
  const nc = dot(n, c)
  return (a * nc - b * rc) / det
}

/** Place a detection on the table: footprint centre, width and height in the world frame. `depth`: median depth
 *  (metres) inside the box centre, when there is a depth video. */
export function liftDetection(det: Detection, K: Intrinsics, pl: Plane, F: WorldFrame, depth?: number | null): Omit<SceneObject, 'name'> | null {
  const [bx, by, bw, bh] = det.box
  const kind = kindFor(det.label)
  let front: V3 | null = null
  if (depth && depth > 0.05 && depth < 8) {
    const P = backproject(K, bx + bw / 2, by + bh * 0.55, depth)
    front = sub(P, mul(pl.n, height(pl, P))) // dropped onto the table
  }
  front ??= rayPlane(K, pl, bx + bw / 2, by + bh)
  if (!front) return null
  const dist = len(front)
  const w = clamp((bw * dist) / K.fx, 0.015, 0.45)
  // the bottom edge of the box is the object's near side: its centre is half a width further from the camera
  const away = unit(sub(front, mul(pl.n, dot(pl.n, front))))
  const c = add(front, mul(away, w / 2))
  // the top of the box is the object's far top edge, half a width behind its centre
  const top = rayToVertical(ray(K, bx + bw / 2, by), add(c, mul(away, kind === 'sphere' ? 0 : w / 2)), pl.n)
  const h = clamp(top, 0.015, 0.45)
  const cw = toWorld(F, c)
  return { label: det.label, kind, x: cw[0], y: cw[1], yaw: 0, w, d: w, h: kind === 'sphere' ? w : h, color: det.color }
}

// ------------------------------------------------------------------------------------------------ robot placement

export interface ArmReach {
  /** horizontal distance band from the base the TCP works well in */
  rMin: number
  rMax: number
  /** shoulder height and reach from it */
  shoulder: number
  reach: number
  /** base footprint radius kept clear of objects */
  footprint: number
}
export const FRANKA_REACH: ArmReach = { rMin: 0.22, rMax: 0.8, shoulder: 0.333, reach: 0.83, footprint: 0.13 }

export interface Placement {
  /** base position (world frame, on the table) and heading (the robot's x axis) */
  x: number
  y: number
  yaw: number
  /** share of trajectory samples within reach */
  reachable: number
}

/**
 * Where to put the robot so it can do what the hand did: search base positions around the work area, score by the
 * share of TCP targets within reach, prefer the side the person's arm came from (the robot takes their place),
 * keep the base off the objects and out of the camera's line of sight.
 */
export function placeRobot(targets: V3[], objects: SceneObject[], towardPerson: [number, number], camera: V3, arm: ArmReach = FRANKA_REACH): Placement {
  const cx = targets.reduce((a, p) => a + p[0], 0) / targets.length
  const cy = targets.reduce((a, p) => a + p[1], 0) / targets.length
  const sample = targets.filter((_, i) => i % Math.max(1, Math.floor(targets.length / 200)) === 0)
  const personAng = Math.atan2(towardPerson[1], towardPerson[0])
  const camAng = Math.atan2(camera[1] - cy, camera[0] - cx)
  let best: Placement & { score: number } = { x: cx - 0.5, y: cy, yaw: 0, reachable: 0, score: -Infinity }
  for (let ai = 0; ai < 72; ai++) {
    const ang = (ai / 72) * 2 * Math.PI
    for (let r = 0.3; r <= 0.8 + 1e-9; r += 0.025) {
      const bx = cx + r * Math.cos(ang)
      const by = cy + r * Math.sin(ang)
      let ok = 0
      let rs = 0
      for (const p of sample) {
        const rho = Math.hypot(p[0] - bx, p[1] - by)
        const reach = Math.hypot(rho, p[2] - arm.shoulder)
        if (rho >= arm.rMin && rho <= arm.rMax && reach <= arm.reach) ok++
        rs += rho
      }
      const frac = ok / sample.length
      const clash = objects.some((o) => Math.hypot(o.x - bx, o.y - by) < arm.footprint + Math.max(o.w, o.d) / 2)
      const objReach = objects.filter((o) => {
        const rho = Math.hypot(o.x - bx, o.y - by)
        return rho >= arm.rMin && rho <= arm.rMax
      }).length / Math.max(objects.length, 1)
      const score = frac + 0.15 * objReach + 0.12 * Math.cos(ang - personAng) - 0.25 * Math.max(0, Math.cos(ang - camAng) - 0.6)
        - 0.25 * Math.abs(rs / sample.length - 0.5) - (clash ? 1 : 0)
      if (score > best.score) best = { x: bx, y: by, yaw: Math.atan2(cy - by, cx - bx), reachable: frac, score }
    }
  }
  return { x: best.x, y: best.y, yaw: best.yaw, reachable: best.reachable }
}

/** world -> robot frame for a placement */
export function robotFrame(pl: Placement): { R: M3; toRobot: (p: V3) => V3; yawToRobot: (yaw: number) => number } {
  const R = rotZ(-pl.yaw)
  return {
    R,
    toRobot: (p) => mv(R, [p[0] - pl.x, p[1] - pl.y, p[2]]),
    yawToRobot: (yaw) => yaw - pl.yaw,
  }
}

/** Pose of the video camera in the robot frame as a MuJoCo camera (looks down -z, y up) and its vertical fov. */
export function mujocoCamera(F: WorldFrame, pl: Placement, K: Intrinsics): { pos: V3; quat: [number, number, number, number]; fovy: number } {
  const Rr = rotZ(-pl.yaw)
  const RW = mm(Rr, F.R) // camera coordinates -> robot frame (directions)
  const pos = mv(Rr, sub(mv(F.R, mul(F.o, -1)), [pl.x, pl.y, 0]))
  const ex = mv(RW, [1, 0, 0])
  const ey = mv(RW, [0, 1, 0])
  const ez = mv(RW, [0, 0, 1])
  const quat = quatFromMat(fromCols(ex, mul(ey, -1), mul(ez, -1)))
  return { pos, quat, fovy: (2 * Math.atan(K.height / 2 / K.fy) * 180) / Math.PI }
}

// ------------------------------------------------------------------------------------------------ retargeting

export interface RetargetOptions {
  /** 'topdown': gripper points straight down and only turns about z (robust grasps); 'full': follows the hand's tilt */
  orientation: 'topdown' | 'full'
  max_width: number
  /** metres subtracted from the thumb-index gap: fingers have thickness, and the gripper must squeeze */
  squeeze: number
  /** lowest TCP height allowed (robot frame) */
  min_z: number
}
export const DEFAULT_RETARGET: RetargetOptions = { orientation: 'topdown', max_width: 0.08, squeeze: 0.03, min_z: 0.012 }

export interface Retargeted {
  pos: V3[]
  rot: M3[]
  width: number[]
  /** thumb-index gap in metres (from the metric hand model, independent of depth errors) */
  pinch: number[]
}

/**
 * Human hand (robot frame, 21 points per sample) + metric pinch -> TCP target, rotation and gripper opening.
 * The TCP goes where the thumb and index tips meet; the jaws close along the thumb-index direction.
 */
export function retarget(hands: V3[][], pinch: number[], o: RetargetOptions = DEFAULT_RETARGET): Retargeted {
  const pos: V3[] = []
  const rot: M3[] = []
  const width: number[] = []
  let yPrev: V3 | null = null
  for (let i = 0; i < hands.length; i++) {
    const P = hands[i]!
    const tip = mid(P[H.THUMB_TIP]!, P[H.INDEX_TIP]!)
    pos.push([tip[0], tip[1], Math.max(tip[2], o.min_z)])
    width.push(clamp(pinch[i]! - o.squeeze, 0, o.max_width))
    const across = sub(P[H.THUMB_TIP]!, P[H.INDEX_TIP]!)
    let z: V3
    if (o.orientation === 'topdown') z = [0, 0, -1]
    else {
      z = unit(sub(tip, P[H.WRIST]!))
      if (z[2] > -0.2) z = unit([z[0], z[1], -0.2]) // never point the gripper upwards
    }
    let y = sub(across, mul(z, dot(across, z)))
    if (len(y) < 0.02 || pinch[i]! < 0.025) {
      // thumb and index touch: their direction is noise, use the palm's (index knuckle -> pinky knuckle) or keep the last
      const palm = sub(P[H.INDEX_MCP]!, P[H.PINKY_MCP]!)
      const yp = sub(palm, mul(z, dot(palm, z)))
      y = yPrev ?? (len(yp) > 1e-3 ? yp : [0, 1, 0])
    }
    y = unit(y)
    if (yPrev && dot(y, yPrev) < 0) y = mul(y, -1) // a parallel gripper is symmetric: take the closer of the two
    if (yPrev) y = unit(add(mul(yPrev, 0.6), mul(y, 0.4))) // damp the turn rate
    y = unit(sub(y, mul(z, dot(y, z))))
    yPrev = y
    const x = cross(y, z)
    rot.push(fromCols(x, y, z))
  }
  return { pos, rot, width, pinch }
}

// ------------------------------------------------------------------------------------------------ grasps

export interface Grasp {
  start: number
  end: number
  object: string | null
}

/** Closed-hand intervals: the gripper command stays well below the hand's usual opening for at least `minLen` samples. */
export function findGrasps(width: number[], minLen: number): { start: number; end: number }[] {
  const hi = percentile(width, 0.9)
  const lo = percentile(width, 0.1)
  if (hi - lo < 0.015) return []
  const thr = lo + 0.45 * (hi - lo)
  const out: { start: number; end: number }[] = []
  let s = -1
  for (let i = 0; i <= width.length; i++) {
    const closed = i < width.length && width[i]! < thr
    if (closed && s < 0) s = i
    if (!closed && s >= 0) {
      if (i - s >= minLen) out.push({ start: s, end: i - 1 })
      s = -1
    }
  }
  return out
}

/** Gripper-facing width of an object (what the jaws close on). */
export const gripWidth = (o: { kind: ObjectKind; w: number; d: number }): number => (o.kind === 'block' ? Math.min(o.w, o.d) : o.w)

/**
 * Small position errors make a robot miss what a person grasps easily. For every grasp, find the object the hand
 * closed on (in the robot frame) and shift the trajectory so the TCP is centred on it, ramping the shift in before
 * the grasp and out after the release; the gripper is told to close a bit narrower than the object so it squeezes.
 * Objects that nothing detected get made up at the grasp (a block the size of the pinch).
 */
export function assistGrasps(
  r: Retargeted, objects: SceneObject[], grasps: { start: number; end: number }[], ramp: number, maxWidth: number,
  makeObject: (at: V3, pinch: number) => SceneObject | null,
): Grasp[] {
  const out: Grasp[] = []
  const N = r.pos.length
  const offs: V3[] = Array.from({ length: N }, () => [0, 0, 0])
  for (const g of grasps) {
    const p = r.pos[g.start]!
    let obj: SceneObject | null = null
    let bestD = Infinity
    for (const o of objects) {
      const dxy = Math.hypot(o.x - p[0], o.y - p[1])
      const reachR = Math.max(0.07, Math.max(o.w, o.d) / 2 + 0.035)
      if (o.h >= 0.015 && dxy < reachR && p[2] < o.h + 0.06 && dxy < bestD) { // flat things (cloth, paper) are not centred on
        obj = o
        bestD = dxy
      }
    }
    if (!obj) {
      obj = makeObject(p, r.pinch[g.start]!)
      if (obj) objects.push(obj)
    }
    if (!obj) {
      out.push({ ...g, object: null })
      continue
    }
    obj.grasped = true
    // the jaws open to maxWidth: shrink anything wider so the grasp is possible at all
    const gw = gripWidth(obj)
    if (gw > maxWidth - 0.012) {
      const k = (maxWidth - 0.012) / gw
      obj.w *= k
      if (obj.kind === 'block') obj.d = Math.min(obj.d, obj.w / k)
      if (obj.kind !== 'block') obj.d = obj.w
    }
    const graspZ = clamp(obj.h - Math.min(0.025, obj.h / 2), 0.012, obj.h)
    const delta: V3 = [obj.x - p[0], obj.y - p[1], graspZ - p[2]]
    const squeezeTo = Math.max(0, gripWidth(obj) - 0.02)
    for (let i = Math.max(0, g.start - ramp); i <= Math.min(N - 1, g.end + ramp); i++) {
      const k = i < g.start ? (i - (g.start - ramp)) / ramp : i > g.end ? 1 - (i - g.end) / ramp : 1
      const s = k * k * (3 - 2 * k)
      offs[i] = add(offs[i]!, mul(delta, s))
      if (i >= g.start && i <= g.end) r.width[i] = Math.min(r.width[i]!, squeezeTo)
      else if (i < g.start) r.width[i] = Math.max(r.width[i]!, Math.min(maxWidth, gripWidth(obj) + 0.02 * (1 - s) + 0.015)) // open wide enough on the way in
    }
    out.push({ ...g, object: obj.name })
  }
  for (let i = 0; i < N; i++) {
    const p = add(r.pos[i]!, offs[i]!)
    r.pos[i] = [p[0], p[1], Math.max(p[2], 0.008)]
  }
  return out
}
