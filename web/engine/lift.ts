/**
 * Pixel -> grounded 3D keypoint (perception/backproject.py + keypoints.lift_pixel): position, surface normal and the
 * in-plane edge axis of the face. The Python reference reads a rendered depth image; the browser has no depth renderer,
 * so a depth image here is one MuJoCo ray per pixel (MuJoCoEnv.castRay), cast lazily for the pixels a lift looks at.
 */
import type { Keypoint } from './controllers'
import type { CameraParams, MuJoCoEnv } from './env'
import { Mat, svd, type Vec3 } from './linalg'

const pyRound = (x: number): number => {
  const r = Math.round(x)
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r // numpy / Python round half to even
}
const clip = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

export class LiftError extends Error {}

/** World-frame ray (origin, unit direction) through a pixel. */
export function pixelRay(cam: CameraParams, u: number, v: number): [Vec3, Vec3] {
  const T = cam.T_world_cam
  const dx = (u - cam.cx) / cam.fx
  const dy = -(v - cam.cy) / cam.fy
  const d: Vec3 = [T[0]! * dx + T[1]! * dy - T[2]!, T[4]! * dx + T[5]! * dy - T[6]!, T[8]! * dx + T[9]! * dy - T[10]!]
  const n = Math.hypot(d[0], d[1], d[2])
  return [[T[3]!, T[7]!, T[11]!], [d[0] / n, d[1] / n, d[2] / n]]
}

/** The lazily cast depth image of one camera (metres along the optical axis, 0 = nothing hit). */
export class DepthImage {
  private cache = new Map<number, number>()
  constructor(private env: Pick<MuJoCoEnv, 'castRay'>, readonly camera: CameraParams) {}
  at(ui: number, vi: number): number {
    const { width: w, height: h } = this.camera
    if (ui < 0 || vi < 0 || ui >= w || vi >= h) return 0
    const key = vi * w + ui
    let d = this.cache.get(key)
    if (d === undefined) {
      const cam = this.camera
      const [o, dir] = pixelRay(cam, ui, vi)
      const dist = this.env.castRay(o, dir)
      // planar depth = distance along the ray / |camera-frame ray direction (x/f, y/f, -1)|
      d = dist === null ? 0 : dist / Math.hypot((ui - cam.cx) / cam.fx, (vi - cam.cy) / cam.fy, 1)
      this.cache.set(key, d)
    }
    return d
  }
  world(ui: number, vi: number, depth: number): Vec3 {
    const cam = this.camera
    const T = cam.T_world_cam
    const x = ((ui - cam.cx) / cam.fx) * depth
    const y = (-(vi - cam.cy) / cam.fy) * depth
    const z = -depth
    return [T[0]! * x + T[1]! * y + T[2]! * z + T[3]!, T[4]! * x + T[5]! * y + T[6]! * z + T[7]!, T[8]! * x + T[9]! * y + T[10]! * z + T[11]!]
  }
}

/** numpy.percentile (linear interpolation). */
export function percentile(vals: number[], q: number): number {
  const a = [...vals].sort((x, y) => x - y)
  const pos = ((a.length - 1) * q) / 100
  const lo = Math.floor(pos)
  const hi = Math.min(a.length - 1, lo + 1)
  return a[lo]! + (a[hi]! - a[lo]!) * (pos - lo)
}

/** Percentile of valid depth in a small window (q < 50 favours the foreground surface). */
export function depthAt(img: DepthImage, u: number, v: number, win = 2, q = 50): number {
  const ui = pyRound(u)
  const vi = pyRound(v)
  const patch: number[] = []
  for (let y = Math.max(0, vi - win); y < Math.min(img.camera.height, vi + win + 1); y++)
    for (let x = Math.max(0, ui - win); x < Math.min(img.camera.width, ui + win + 1); x++) {
      const d = img.at(x, y)
      if (d > 0) patch.push(d)
    }
  if (!patch.length) throw new LiftError(`no valid depth near pixel (${u.toFixed(0)},${v.toFixed(0)})`)
  return percentile(patch, q)
}

const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot3 = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Smallest-variance direction of centred points (plane normal) via SVD, like vt[-1]. */
function planeNormal(pts: Vec3[], c: Vec3): Vec3 {
  const m = Mat.fromRows(pts.map((p) => sub3(p, c)))
  const { s, V } = svd(m)
  let k = 0
  for (let j = 1; j < s.length; j++) if (s[j]! < s[k]!) k = j
  return [V.get(0, k), V.get(1, k), V.get(2, k)]
}

const mean3 = (pts: Vec3[], keep: boolean[]): Vec3 => {
  let n = 0
  const c: Vec3 = [0, 0, 0]
  pts.forEach((p, i) => {
    if (!keep[i]) return
    n++
    c[0] += p[0]; c[1] += p[1]; c[2] += p[2]
  })
  return [c[0] / n, c[1] / n, c[2] / n]
}
const median = (a: number[]): number => percentile(a, 50)

/** Robust plane fit around a pixel: (normal towards the camera, centroid, rms) or null. */
export function fitSurface(img: DepthImage, u: number, v: number, radius = 4, d0?: number): { n: Vec3; c: Vec3; rms: number } | null {
  const ui = pyRound(u)
  const vi = pyRound(v)
  const px: [number, number, number][] = []
  for (let y = Math.max(0, vi - radius); y < Math.min(img.camera.height, vi + radius + 1); y++)
    for (let x = Math.max(0, ui - radius); x < Math.min(img.camera.width, ui + radius + 1); x++) px.push([x, y, img.at(x, y)])
  let ok = px.filter((p) => p[2] > 0)
  if (ok.length < 8) return null
  const ref = d0 ?? percentile(ok.map((p) => p[2]), 20)
  ok = ok.filter((p) => Math.abs(p[2] - ref) < 0.03)
  if (ok.length < 8) return null
  const pts = ok.map((p) => img.world(p[0], p[1], p[2]))
  let keep = pts.map(() => true)
  let n: Vec3 | null = null
  let c: Vec3 = [0, 0, 0]
  for (let it = 0; it < 4; it++) {
    if (keep.filter(Boolean).length < 8) break
    c = mean3(pts, keep)
    n = planeNormal(pts.filter((_, i) => keep[i]), c)
    const res = pts.map((p) => Math.abs(dot3(sub3(p, c), n!)))
    const thr = Math.max(0.003, 2 * median(res.filter((_, i) => keep[i])))
    keep = res.map((r) => r < thr)
  }
  if (!n) return null
  const kept = pts.filter((_, i) => keep[i])
  const rms = Math.sqrt(kept.reduce((a, p) => a + dot3(sub3(p, c), n!) ** 2, 0) / Math.max(1, kept.length))
  const T = img.camera.T_world_cam
  if (dot3(n, sub3([T[3]!, T[7]!, T[11]!], c)) < 0) n = [-n[0], -n[1], -n[2]]
  const nn = Math.hypot(n[0], n[1], n[2])
  return { n: [n[0] / nn, n[1] / nn, n[2] / nn], c, rms }
}

// ---- 2D geometry for the top-face edge direction (cv2.minAreaRect / minEnclosingCircle replacements) ------------------
type P2 = [number, number]

function convexHull(points: P2[]): P2[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: P2, a: P2, b: P2): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (src: P2[]): P2[] => {
    const h: P2[] = []
    for (const q of src) {
      while (h.length >= 2 && cross(h[h.length - 2]!, h[h.length - 1]!, q) <= 0) h.pop()
      h.push(q)
    }
    h.pop()
    return h
  }
  return [...half(p), ...half([...p].reverse())]
}

/** Minimum-area bounding rectangle: its four corners and side lengths. */
export function minAreaRect(points: P2[]): { corners: P2[]; w: number; h: number } {
  const hull = convexHull(points)
  let best: { area: number; corners: P2[]; w: number; h: number } | null = null
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]!
    const b = hull[(i + 1) % hull.length]!
    const ex = b[0] - a[0]
    const ey = b[1] - a[1]
    const L = Math.hypot(ex, ey)
    if (L === 0) continue
    const ux = ex / L, uy = ey / L
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
    for (const p of hull) {
      const du = (p[0] - a[0]) * ux + (p[1] - a[1]) * uy
      const dv = -(p[0] - a[0]) * uy + (p[1] - a[1]) * ux
      minU = Math.min(minU, du); maxU = Math.max(maxU, du); minV = Math.min(minV, dv); maxV = Math.max(maxV, dv)
    }
    const area = (maxU - minU) * (maxV - minV)
    if (!best || area < best.area) {
      const at = (du: number, dv: number): P2 => [a[0] + du * ux - dv * uy, a[1] + du * uy + dv * ux]
      best = { area, corners: [at(minU, minV), at(maxU, minV), at(maxU, maxV), at(minU, maxV)], w: maxU - minU, h: maxV - minV }
    }
  }
  if (!best) return { corners: [points[0]!, points[0]!, points[0]!, points[0]!], w: 0, h: 0 }
  return best
}

/** Radius of the smallest circle around the points (Welzl's algorithm, iterative form). */
export function minEnclosingRadius(points: P2[]): number {
  const hull = convexHull(points)
  const pts = hull.length ? hull : points
  const circ2 = (a: P2, b: P2): [number, number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.hypot(a[0] - b[0], a[1] - b[1]) / 2]
  const circ3 = (a: P2, b: P2, c: P2): [number, number, number] => {
    const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
    if (Math.abs(d) < 1e-12) {
      const cands = [circ2(a, b), circ2(a, c), circ2(b, c)]
      return cands.sort((p, q) => q[2] - p[2])[0]!
    }
    const a2 = a[0] ** 2 + a[1] ** 2, b2 = b[0] ** 2 + b[1] ** 2, c2 = c[0] ** 2 + c[1] ** 2
    const ux = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d
    const uy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d
    return [ux, uy, Math.hypot(a[0] - ux, a[1] - uy)]
  }
  const inside = (c: [number, number, number], p: P2): boolean => Math.hypot(p[0] - c[0], p[1] - c[1]) <= c[2] + 1e-9
  let c: [number, number, number] = [pts[0]![0], pts[0]![1], 0]
  for (let i = 1; i < pts.length; i++) {
    if (inside(c, pts[i]!)) continue
    c = [pts[i]![0], pts[i]![1], 0]
    for (let j = 0; j < i; j++) {
      if (inside(c, pts[j]!)) continue
      c = circ2(pts[i]!, pts[j]!)
      for (let k = 0; k < j; k++) if (!inside(c, pts[k]!)) c = circ3(pts[i]!, pts[j]!, pts[k]!)
    }
  }
  return c[2]
}

/** Edge direction of the (roughly horizontal) face containing pixel (u, v): min-area rectangle of plane inliers. */
function topFaceAxis(img: DepthImage, u: number, v: number, n: Vec3, c: Vec3, radius = 16): [Vec3 | null, number] {
  if (Math.abs(n[2]) < 0.8) return [null, 180]
  const ui = pyRound(u)
  const vi = pyRound(v)
  const x0 = Math.max(0, ui - radius), x1 = Math.min(img.camera.width, ui + radius + 1)
  const y0 = Math.max(0, vi - radius), y1 = Math.min(img.camera.height, vi + radius + 1)
  const px: P2[] = []
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const d = img.at(x, y)
      if (d <= 0) continue
      if (Math.abs(dot3(sub3(img.world(x, y, d), c), n)) < 0.003) px.push([x, y])
    }
  if (px.length < 30) return [null, 180]
  const minX = Math.min(...px.map((p) => p[0])), maxX = Math.max(...px.map((p) => p[0]))
  const minY = Math.min(...px.map((p) => p[1])), maxY = Math.max(...px.map((p) => p[1]))
  // the window's own extent (over valid-depth pixels, as in numpy: us/vs of pixels with depth)
  let wMinX = Infinity, wMaxX = -Infinity, wMinY = Infinity, wMaxY = -Infinity
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++)
      if (img.at(x, y) > 0) {
        wMinX = Math.min(wMinX, x); wMaxX = Math.max(wMaxX, x); wMinY = Math.min(wMinY, y); wMaxY = Math.max(wMaxY, y)
      }
  if (minX <= wMinX + 1 || maxX >= wMaxX - 1 || minY <= wMinY + 1 || maxY >= wMaxY - 1) return [null, 180] // face runs off the window: an open surface has no edge direction
  const rect = minAreaRect(px)
  if (rect.w * rect.h < 1e-6 || px.length / (rect.w * rect.h) < 0.85) return [null, 180] // irregular face
  const r = minEnclosingRadius(px)
  if (r > 0 && px.length / (Math.PI * r * r) > 0.8) return [null, 180] // circular face
  const world = rect.corners.map(([cu, cv]) => {
    const [o, rd] = pixelRay(img.camera, cu, cv)
    const k = dot3(n, sub3(c, o)) / dot3(n, rd)
    return [o[0] + rd[0] * k, o[1] + rd[1] * k, o[2] + rd[2] * k] as Vec3
  })
  const e1 = sub3(world[1]!, world[0]!)
  const e2 = sub3(world[2]!, world[1]!)
  const l1 = Math.hypot(e1[0], e1[1], e1[2])
  const l2 = Math.hypot(e2[0], e2[1], e2[2])
  if (Math.min(l1, l2) < 1e-4) return [null, 180]
  const long = l1 >= l2 ? e1 : e2
  const an = Math.hypot(long[0], long[1])
  if (an < 1e-6) return [null, 180]
  return [[long[0] / an, long[1] / an, 0], Math.max(l1, l2) / Math.min(l1, l2) < 1.2 ? 90 : 180]
}

/** Lift one pixel to a grounded keypoint using the depth image. Throws LiftError. */
export function liftPixel(img: DepthImage, name: string, u0: number, v0: number): Keypoint {
  const u = clip(u0, 0, img.camera.width - 1)
  const v = clip(v0, 0, img.camera.height - 1)
  const d = depthAt(img, u, v, 3, 20) // foreground-biased depth
  let pos = img.world(u, v, d)
  const fit = fitSurface(img, u, v, 4, d)
  let normal: Vec3 | null = null
  let axis: Vec3 | null = null
  let sym = 180
  if (fit) {
    const { n, c, rms } = fit
    normal = n
    const [o, ray] = pixelRay(img.camera, u, v)
    const cosang = -dot3(n, ray)
    if (rms < 0.002 && cosang > 0.25) {
      // snap the point onto the fitted (planar) face
      const k = dot3(n, sub3(c, o)) / dot3(n, ray)
      pos = [o[0] + ray[0] * k, o[1] + ray[1] * k, o[2] + ray[2] * k]
      ;[axis, sym] = topFaceAxis(img, u, v, n, c)
    }
  }
  return { name, pos, normal: normal ?? [0, 0, 1], axis, axis_sym: sym }
}
