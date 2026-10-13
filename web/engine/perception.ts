/** Keypoint memory and the reach-clearance check (perception/keypoint_store.py, perception/clearance.py). */
import type { Finger } from './data'
import type { Keypoint, RobotState } from './controllers'
import { matTVec, matVec, norm, type Vec3 } from './linalg'
import type { MuJoCoEnv } from './env'

/**
 * Episode keypoint memory. Keypoints are grounded ONCE per plan from a clean initial image, then tracked: static scene
 * keypoints keep their world position; once the gripper closes on an object, keypoints within reach of the tcp become
 * rigidly attached to it and follow the end-effector kinematically; on release they freeze at their last position.
 */
export class KeypointStore {
  kps: Record<string, Keypoint> = {}
  held: Record<string, { r: Vec3; n: Vec3 }> = {} // name -> offset / normal in the tcp frame

  clear(): void {
    this.kps = {}
    this.held = {}
  }
  update(kps: Record<string, Keypoint>): void {
    Object.assign(this.kps, kps)
  }
  missing(names: Iterable<string>): string[] {
    return [...names].filter((n) => !(n in this.kps))
  }
  private now(name: string, s: RobotState): Keypoint {
    const h = this.held[name]
    if (h) {
      const r = matVec(s.tcp_rot, h.r)
      return {
        name, pos: [s.tcp_pos[0] + r[0], s.tcp_pos[1] + r[1], s.tcp_pos[2] + r[2]], normal: matVec(s.tcp_rot, h.n), axis: null, axis_sym: 180,
      } // axis is not tracked while held
    }
    return this.kps[name]!
  }
  snapshot(names: string[], s: RobotState): Record<string, Keypoint> {
    return Object.fromEntries(names.map((n) => [n, this.now(n, s)]))
  }
  onGrasp(names: string[], s: RobotState, radius = 0.06): string[] {
    const grabbed: string[] = []
    for (const n of names) {
      const kp = this.now(n, s)
      const d = norm([kp.pos[0] - s.tcp_pos[0], kp.pos[1] - s.tcp_pos[1], kp.pos[2] - s.tcp_pos[2]])
      if (!(n in this.held) && d < radius) {
        const nrm = kp.normal ?? ([0, 0, 1] as Vec3)
        this.held[n] = {
          r: matTVec(s.tcp_rot, [kp.pos[0] - s.tcp_pos[0], kp.pos[1] - s.tcp_pos[1], kp.pos[2] - s.tcp_pos[2]]),
          n: matTVec(s.tcp_rot, nrm),
        }
        grabbed.push(n)
      }
    }
    return grabbed
  }
  onRelease(s: RobotState): void {
    for (const n of Object.keys(this.held)) {
      this.kps[n] = this.now(n, s)
      delete this.held[n]
    }
  }
}

const MIN_HEIGHT = 0.008 // anything taller than this above the table is in the way of the fingertips

export interface ReachResult {
  analyzable: boolean
  reason?: string
  blocked?: boolean
  sides?: { side: number; distance: number; centroid: [number, number]; size: [number, number]; height: number }[]
  finger_dir?: [number, number]
  target?: [number, number]
}

/** 8-connected component labelling of a boolean grid (like scipy.ndimage.label with a 3x3 structure). */
function labelGrid(occ: Uint8Array, n: number): Int32Array {
  const labels = new Int32Array(n * n)
  let next = 0
  const stack: number[] = []
  for (let i = 0; i < n * n; i++) {
    if (!occ[i] || labels[i]) continue
    next++
    labels[i] = next
    stack.push(i)
    while (stack.length) {
      const p = stack.pop()!
      const py = Math.trunc(p / n)
      const px = p % n
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const y = py + dy
          const x = px + dx
          if (y < 0 || x < 0 || y >= n || x >= n) continue
          const q = y * n + x
          if (occ[q] && !labels[q]) {
            labels[q] = next
            stack.push(q)
          }
        }
    }
  }
  return labels
}

/**
 * Reach clearance: would the open gripper fit around a grasp target? Blobs above the table are "objects"; the blob
 * under the grasp point is the target itself; any OTHER blob inside the two finger footprints (one each side of the
 * target, along the finger-opening direction) would collide with a finger when the gripper descends.
 * finger_dir: horizontal unit vector (x, y) along which the fingers open.
 */
export function analyzeReach(env: MuJoCoEnv, targetXY: ArrayLike<number>, fingerDir: ArrayLike<number>, finger: Finger, half = 0.3, res = 0.005): ReachResult {
  const tx = targetXY[0]!
  const ty = targetXY[1]!
  const built = env.heightMap(tx, ty, half, res, finger.max_z)
  if (!built) return { analyzable: false }
  const { hm, n, zTable } = built
  const occ = new Uint8Array(n * n)
  for (let i = 0; i < occ.length; i++) occ[i] = Number.isFinite(hm[i]!) && hm[i]! > zTable + MIN_HEIGHT ? 1 : 0
  const labels = labelGrid(occ, n)
  const cell = (x: number, y: number): [number, number] => [Math.round((y - (ty - half)) / res), Math.round((x - (tx - half)) / res)]

  // the blob under (or right next to) the target point is the target object itself
  const [cy0, cx0] = cell(tx, ty)
  const counts = new Map<number, number>()
  for (let y = Math.max(0, cy0 - 2); y < cy0 + 3; y++)
    for (let x = Math.max(0, cx0 - 2); x < cx0 + 3; x++) {
      const l = y < n && x < n ? labels[y * n + x]! : 0
      if (l > 0) counts.set(l, (counts.get(l) ?? 0) + 1)
    }
  if (!counts.size) return { analyzable: false, reason: 'the grasp point is not visible in the depth image' }
  let targetLabel = 0
  let best = -1
  for (const [l, c] of [...counts].sort((a, b) => a[0] - b[0])) if (c > best) [targetLabel, best] = [l, c]
  const un = Math.hypot(fingerDir[0]!, fingerDir[1]!)
  const u: [number, number] = [fingerDir[0]! / un, fingerDir[1]! / un]
  const perp: [number, number] = [-u[1], u[0]]

  const sides: NonNullable<ReachResult['sides']> = []
  for (const s of [1, -1]) {
    const hit = new Map<number, number>()
    for (let ia = 0; ia < 8; ia++) {
      const a = -finger.length / 2 + (finger.length * ia) / 7
      for (let ib = 0; ib < 9; ib++) {
        const b = -finger.width / 2 + (finger.width * ib) / 8
        const px = tx + s * u[0] * (finger.center + a) + perp[0] * b
        const py = ty + s * u[1] * (finger.center + a) + perp[1] * b
        const [iy, ix] = cell(px, py)
        if (iy >= 0 && iy < n && ix >= 0 && ix < n) {
          const lab = labels[iy * n + ix]!
          if (lab > 0 && lab !== targetLabel) hit.set(lab, (hit.get(lab) ?? 0) + 1)
        }
      }
    }
    if (hit.size) {
      let lab = 0
      let bc = -1
      for (const [l, c] of hit) if (c > bc) [lab, bc] = [l, c]
      let sx = 0, sy = 0, cnt = 0, minD = Infinity, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, maxH = -Infinity
      for (let i = 0; i < n * n; i++) {
        if (labels[i] !== lab) continue
        const wx = tx - half + (i % n) * res
        const wy = ty - half + Math.trunc(i / n) * res
        sx += wx
        sy += wy
        cnt++
        minD = Math.min(minD, Math.hypot(wx - tx, wy - ty))
        minX = Math.min(minX, wx); maxX = Math.max(maxX, wx)
        minY = Math.min(minY, wy); maxY = Math.max(maxY, wy)
        maxH = Math.max(maxH, hm[i]!)
      }
      sides.push({ side: s, distance: minD, centroid: [sx / cnt, sy / cnt], size: [maxX - minX, maxY - minY], height: maxH - zTable })
    }
  }
  return { analyzable: true, blocked: sides.length > 0, sides, finger_dir: u, target: [tx, ty] }
}

/** Plain-language description for the Task Decomposer (world coordinates, +x away from the robot, +y left). */
export function describeReach(res: ReachResult, name: string, nearby: Record<string, ArrayLike<number>>): string {
  const [ux, uy] = res.finger_dir!
  const [tx, ty] = res.target!
  const sgn = (x: number) => (x >= 0 ? '+' : '') + x.toFixed(2)
  const parts = [
    `Clearance check for grasping '${name}' at world (x=${tx.toFixed(2)}, y=${ty.toFixed(2)}): the gripper's fingers open along ` +
      `the direction (${sgn(ux)}, ${sgn(uy)}) and need about 6 cm of free table space on BOTH sides of the grasp point.`,
  ]
  for (const sd of res.sides!) {
    const [cx, cy] = sd.centroid
    let near: [string, ArrayLike<number>] | null = null
    for (const kv of Object.entries(nearby))
      if (!near || Math.hypot(kv[1][0]! - cx, kv[1][1]! - cy) < Math.hypot(near[1][0]! - cx, near[1][1]! - cy)) near = kv
    const label = near && Math.hypot(near[1][0]! - cx, near[1][1]! - cy) < 0.15 ? ` (the object around keypoint '${near[0]}')` : ''
    const dir: [number, number] = [ux * sd.side, uy * sd.side]
    parts.push(
      `BLOCKED on the side toward (${sgn(dir[0])}, ${sgn(dir[1])}): an object${label} centred at (x=${cx.toFixed(2)}, y=${cy.toFixed(2)}), ` +
        `about ${(sd.size[0] * 100).toFixed(0)} x ${(sd.size[1] * 100).toFixed(0)} cm and ${(sd.height * 100).toFixed(0)} cm tall, comes within ` +
        `${(sd.distance * 100).toFixed(0)} cm of the grasp point, so a finger would hit it when the gripper descends.`,
    )
  }
  return parts.join(' ')
}

