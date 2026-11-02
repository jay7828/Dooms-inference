/**
 * The scene from a single camera: monocular depth (Depth Anything, relative) made metric with the hand, then the table
 * plane, the objects standing on it, and a photo-textured surface of the whole view. Pure: no browser APIs.
 *
 * The depth model returns relative inverse depth D (larger = closer), right only up to an affine map per image:
 *   1 / z = a * D + b.
 * The hand's known size gives its true distance in the frames where it is seen, which fixes a and b.
 */
import {
  add, dot, fitPlane, height, kindFor, mul, sub, toWorld, unit, type Detection, type Intrinsics, type ObjectKind, type Plane, type SceneObject,
  type V3, type WorldFrame,
} from './geometry'

export interface DepthMap {
  /** size of the map; pixel (u, v) of the analysed frame is at (u * w / W, v * h / H) */
  w: number
  h: number
  /** relative inverse depth (larger = closer) */
  data: Float32Array
}
/** pixel box [x0, y0, x1, y1] in analysed-frame pixels */
export type Box = [number, number, number, number]

/** Map the depth of one frame onto a reference frame of the same static camera: Dref ~ alpha * D + beta, fitted on
 *  pixels outside `skip` boxes (hands, arms) with one round of outlier rejection. */
export function alignDepth(D: DepthMap, ref: DepthMap, skip: Box[], W: number, H: number): { alpha: number; beta: number } {
  const xs: number[] = []
  const ys: number[] = []
  const step = Math.max(1, Math.floor(Math.sqrt((D.w * D.h) / 4000)))
  for (let y = 0; y < D.h; y += step)
    for (let x = 0; x < D.w; x += step) {
      const u = ((x + 0.5) / D.w) * W
      const v = ((y + 0.5) / D.h) * H
      if (skip.some(([x0, y0, x1, y1]) => u >= x0 && u <= x1 && v >= y0 && v <= y1)) continue
      const rx = Math.min(ref.w - 1, Math.floor((u / W) * ref.w))
      const ry = Math.min(ref.h - 1, Math.floor((v / H) * ref.h))
      xs.push(D.data[y * D.w + x]!)
      ys.push(ref.data[ry * ref.w + rx]!)
    }
  const fit = (keep: boolean[]): { alpha: number; beta: number } => {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0
    for (let i = 0; i < xs.length; i++) {
      if (!keep[i]) continue
      n++
      sx += xs[i]!
      sy += ys[i]!
      sxx += xs[i]! * xs[i]!
      sxy += xs[i]! * ys[i]!
    }
    const den = n * sxx - sx * sx
    if (n < 10 || Math.abs(den) < 1e-12) return { alpha: 1, beta: 0 }
    const alpha = (n * sxy - sx * sy) / den
    return { alpha, beta: (sy - alpha * sx) / n }
  }
  let f = fit(xs.map(() => true))
  const res = xs.map((x, i) => Math.abs(f.alpha * x + f.beta - ys[i]!))
  const mad = [...res].sort((a, b) => a - b)[res.length >> 1] ?? 0
  f = fit(res.map((r) => r <= 2.5 * mad + 1e-9)) // things that moved between the frames drop out
  return f
}

/** Sample a depth map at analysed-frame pixel (u, v) (bilinear). */
export function sampleDepth(D: DepthMap, u: number, v: number, W: number, H: number): number | null {
  const x = (u / W) * D.w - 0.5
  const y = (v / H) * D.h - 0.5
  if (x < 0 || y < 0 || x > D.w - 1 || y > D.h - 1) return null
  const x0 = Math.floor(x), y0 = Math.floor(y)
  const x1 = Math.min(x0 + 1, D.w - 1), y1 = Math.min(y0 + 1, D.h - 1)
  const fx = x - x0, fy = y - y0
  const g = (xx: number, yy: number): number => D.data[yy * D.w + xx]!
  return (g(x0, y0) * (1 - fx) + g(x1, y0) * fx) * (1 - fy) + (g(x0, y1) * (1 - fx) + g(x1, y1) * fx) * fy
}

/**
 * Fit 1/z = a D + b from (D, z) pairs (z from the hand's size). The hand covers a narrow range of depths, so b is
 * held near 0 (pure inverse depth) unless the data say otherwise. Returns null when the fit makes no sense.
 */
export function calibrateDepth(pairs: { D: number; z: number }[]): { a: number; b: number } | null {
  const good = pairs.filter((p) => Number.isFinite(p.D) && p.D > 0 && p.z > 0.05 && p.z < 10)
  if (good.length < 8) return null
  // scale-only first (robust median), then a 2-parameter fit with a ridge on b
  const a0 = [...good.map((p) => 1 / p.z / p.D)].sort((x, y) => x - y)[good.length >> 1]!
  const keep = good.filter((p) => Math.abs(a0 * p.D * p.z - 1) < 0.35)
  if (keep.length < 6) return { a: a0, b: 0 }
  const lam = keep.length * 0.5 // pull b towards 0 (in units of 1/m)
  let sdd = 0, sd = 0, n = 0, sdy = 0, sy = 0
  for (const p of keep) {
    const y = 1 / p.z
    sdd += p.D * p.D
    sd += p.D
    sdy += p.D * y
    sy += y
    n++
  }
  // [sdd sd; sd n+lam] [a; b] = [sdy; sy]
  const det = sdd * (n + lam) - sd * sd
  if (Math.abs(det) < 1e-12) return { a: a0, b: 0 }
  const a = (sdy * (n + lam) - sd * sy) / det
  const b = (sdd * sy - sd * sdy) / det
  if (!(a > 0)) return { a: a0, b: 0 }
  return { a, b }
}

/**
 * Make the depth metric using two facts: the hand's known size (its distance in the anchor frames) and the table
 * being flat. The hand alone covers too narrow a range of depths to pin down the offset b (a wrong b bends the table
 * into a bowl), so b is chosen as the one under which the largest part of the view is one plane, and a (the scale)
 * then comes from the hand.
 */
export function calibrateByPlane(D: DepthMap, pairs: { D: number; z: number }[], K: Intrinsics, skip: Box[]): { a: number; b: number; flat: number } | null {
  const good = pairs.filter((p) => Number.isFinite(p.D) && p.D > 0 && p.z > 0.05 && p.z < 10)
  if (good.length < 8) return null
  const ys = good.map((p) => 1 / p.z).sort((x, y) => x - y)
  const ymed = ys[ys.length >> 1]!
  // relative depth at a coarse grid of the view (outside hands, arms, black bars)
  const cells: { u: number; v: number; d: number }[] = []
  const gw = 48
  const gh = Math.max(2, Math.round((gw * D.h) / D.w))
  let dMin = Infinity
  for (let gy = 0; gy < gh; gy++)
    for (let gx = 0; gx < gw; gx++) {
      const u = ((gx + 0.5) / gw) * K.width
      const v = ((gy + 0.5) / gh) * K.height
      if (inBoxes(u, v, skip)) continue
      const d = sampleDepth(D, u, v, K.width, K.height)
      if (d === null) continue
      cells.push({ u, v, d })
      dMin = Math.min(dMin, d)
    }
  if (cells.length < 60) return null
  const scaleFor = (b: number): number | null => {
    const as = good.map((p) => (1 / p.z - b) / p.D).filter((x) => x > 0).sort((x, y) => x - y)
    return as.length >= good.length / 2 ? as[as.length >> 1]! : null
  }
  const flatness = (a: number, b: number): number => {
    const pts: V3[] = []
    for (const c of cells) {
      const inv = a * c.d + b
      if (!(inv > 0.05)) continue
      const z = 1 / inv
      pts.push([((c.u - K.cx) / K.fx) * z, ((c.v - K.cy) / K.fy) * z, z])
    }
    if (pts.length < cells.length * 0.8) return 0
    const zs = pts.map((p) => p[2]).sort((x, y) => x - y)
    const tol = 0.015 * zs[zs.length >> 1]!
    const pl = fitPlane(pts, 200, tol, 5)
    if (!pl) return 0
    return pts.filter((p) => Math.abs(height(pl, p)) < tol).length / cells.length
  }
  let best: { a: number; b: number; flat: number } | null = null
  // s near 1 would make everything one distance (trivially flat): stop well short of it
  for (let s = -2.0; s <= 0.6 + 1e-9; s += 0.05) {
    const b = s * ymed
    const a = scaleFor(b)
    if (a === null || a * dMin + b <= 0.05) continue
    const f = flatness(a, b)
    // prefer the plain inverse-depth reading (b = 0) when two are about as flat
    const score = f - 0.02 * Math.abs(s)
    if (!best || score > best.flat) best = { a, b, flat: score }
  }
  return best
}

/** A grid of camera-frame points from the calibrated reference depth (null where the depth makes no sense). */
export interface PointGrid {
  gw: number
  gh: number
  /** analysed-frame pixel of every cell centre */
  uv: [number, number][]
  P: (V3 | null)[]
}
export function pointGrid(D: DepthMap, cal: { a: number; b: number }, K: Intrinsics, cols = 160): PointGrid {
  const gw = Math.min(cols, D.w)
  const gh = Math.max(2, Math.round((gw * D.h) / D.w))
  const uv: [number, number][] = []
  const P: (V3 | null)[] = []
  for (let gy = 0; gy < gh; gy++)
    for (let gx = 0; gx < gw; gx++) {
      const u = ((gx + 0.5) / gw) * K.width
      const v = ((gy + 0.5) / gh) * K.height
      uv.push([u, v])
      const d = sampleDepth(D, u, v, K.width, K.height)
      const inv = d === null ? -1 : cal.a * d + cal.b
      if (!(inv > 0.1)) {
        P.push(null) // further than 10 m, or behind the camera: sky, a far wall
        continue
      }
      const z = 1 / inv
      P.push([((u - K.cx) / K.fx) * z, ((v - K.cy) / K.fy) * z, z])
    }
  return { gw, gh, uv, P }
}

const inBoxes = (u: number, v: number, boxes: Box[]): boolean => boxes.some(([x0, y0, x1, y1]) => u >= x0 && u <= x1 && v >= y0 && v <= y1)

/** The table: the dominant plane among the points (hands and arms left out), normal pointing up at the camera. */
export function tableFromGrid(g: PointGrid, skip: Box[]): Plane | null {
  const pts: V3[] = []
  g.P.forEach((p, i) => {
    if (p && !inBoxes(g.uv[i]![0], g.uv[i]![1], skip)) pts.push(p)
  })
  if (pts.length < 100) return null
  const sample = pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / 3000)) === 0)
  // depth from one camera is noisier far away: a tolerance proportional to the median distance
  const zs = sample.map((p) => p[2]).sort((a, b) => a - b)
  const tol = Math.max(0.008, 0.02 * zs[zs.length >> 1]!)
  return fitPlane(sample, 400, tol, 3)
}

export interface Segmented {
  objects: Omit<SceneObject, 'name'>[]
  /** colour of the table (median of its pixels) */
  tableColor: [number, number, number]
}

/**
 * Objects = connected regions of points standing 1.5 cm to 45 cm above the table, whose foot lies on the visible
 * table. Each becomes an oriented box (footprint from the principal axes, height from its top) with its median colour;
 * a detector box around it gives the name and the shape (cups, bottles, balls).
 */
export function segmentObjects(
  g: PointGrid, pl: Plane, F: WorldFrame, K: Intrinsics, rgbaAt: (u: number, v: number) => [number, number, number], skip: Box[], detections: Detection[],
): Segmented {
  const N = g.P.length
  const h = new Float32Array(N).fill(NaN)
  const table = new Uint8Array(N)
  const tableCols: [number, number, number][] = []
  let maxDist = 0
  for (let i = 0; i < N; i++) {
    const p = g.P[i]
    if (!p || inBoxes(g.uv[i]![0], g.uv[i]![1], skip)) continue
    h[i] = height(pl, p)
    if (Math.abs(h[i]!) < 0.012) {
      table[i] = 1
      maxDist = Math.max(maxDist, p[2])
      if (i % 7 === 0) tableCols.push(rgbaAt(g.uv[i]![0], g.uv[i]![1]))
    }
  }
  // table region in the image: dilate the inlier mask so objects' feet (just beside table pixels) count as on the table
  const near = new Uint8Array(N)
  const R = Math.max(2, Math.round(g.gw / 40))
  for (let y = 0; y < g.gh; y++)
    for (let x = 0; x < g.gw; x++) {
      if (!table[y * g.gw + x]) continue
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx, yy = y + dy
          if (xx >= 0 && yy >= 0 && xx < g.gw && yy < g.gh) near[yy * g.gw + xx] = 1
        }
    }
  const cand = new Uint8Array(N)
  for (let i = 0; i < N; i++) {
    const hi = h[i]!
    if (!(hi > 0.015 && hi < 0.45)) continue
    const p = g.P[i]!
    if (p[2] > maxDist * 1.05) continue // behind the table: a wall, a shelf
    // the foot of the point (straight down onto the table) must be on the visible table
    const foot = sub(p, mul(pl.n, hi))
    const [u, v] = projectCell(foot, g, K)
    if (u < 0 || v < 0 || u >= g.gw || v >= g.gh || !near[v * g.gw + u]) continue
    cand[i] = 1
  }
  // connected components (4-neighbours)
  const label = new Int32Array(N).fill(-1)
  const comps: number[][] = []
  for (let i = 0; i < N; i++) {
    if (!cand[i] || label[i]! >= 0) continue
    const stack = [i]
    const comp: number[] = []
    label[i] = comps.length
    while (stack.length) {
      const j = stack.pop()!
      comp.push(j)
      const x = j % g.gw, y = (j / g.gw) | 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const xx = x + dx, yy = y + dy
        if (xx < 0 || yy < 0 || xx >= g.gw || yy >= g.gh) continue
        const k = yy * g.gw + xx
        if (cand[k] && label[k]! < 0 && Math.abs(h[k]! - h[j]!) < 0.06) {
          label[k] = comps.length
          stack.push(k)
        }
      }
    }
    comps.push(comp)
  }
  const minCells = Math.max(12, Math.round(N * 0.0015))
  const objects: Omit<SceneObject, 'name'>[] = []
  for (const comp of comps.filter((c) => c.length >= minCells).sort((a, b) => b.length - a.length).slice(0, 8)) {
    const W3 = comp.map((i) => toWorld(F, g.P[i]!))
    const hs = comp.map((i) => h[i]!).sort((a, b) => a - b)
    const top = hs[Math.floor(hs.length * 0.95)]!
    // footprint: principal axes of the points' xy
    const cx = W3.reduce((s, p) => s + p[0], 0) / W3.length
    const cy = W3.reduce((s, p) => s + p[1], 0) / W3.length
    let sxx = 0, syy = 0, sxy = 0
    for (const p of W3) {
      sxx += (p[0] - cx) ** 2
      syy += (p[1] - cy) ** 2
      sxy += (p[0] - cx) * (p[1] - cy)
    }
    const yaw = 0.5 * Math.atan2(2 * sxy, sxx - syy)
    const ax: V3 = [Math.cos(yaw), Math.sin(yaw), 0]
    const ay: V3 = [-Math.sin(yaw), Math.cos(yaw), 0]
    const along = W3.map((p) => dot([p[0] - cx, p[1] - cy, 0], ax)).sort((a, b) => a - b)
    const across = W3.map((p) => dot([p[0] - cx, p[1] - cy, 0], ay)).sort((a, b) => a - b)
    const q = (s: number[], f: number): number => s[Math.min(s.length - 1, Math.floor(f * s.length))]!
    let w = Math.max(0.02, q(along, 0.97) - q(along, 0.03))
    let d = Math.max(0.02, q(across, 0.97) - q(across, 0.03))
    // the camera sees the front and top only: the hidden back half makes the footprint look thinner than it is
    const mid: V3 = [(q(along, 0.97) + q(along, 0.03)) / 2, (q(across, 0.97) + q(across, 0.03)) / 2, 0]
    let c = add([cx, cy, 0], add(mul(ax, mid[0]), mul(ay, mid[1])))
    const toCam = unit(sub(toWorld(F, [0, 0, 0]), c))
    const thin = Math.min(w, d) < 0.5 * Math.max(w, d) && Math.min(top, Math.max(w, d)) > 0.04
    if (thin) {
      const grow = 0.5 * Math.max(w, d) - Math.min(w, d)
      if (w < d) w += grow
      else d += grow
      c = sub(c, mul([toCam[0], toCam[1], 0], grow / 2)) // grow away from the camera
    }
    // colour: median of the component's pixels
    const cols = comp.filter((_, k) => k % 3 === 0).map((i) => rgbaAt(g.uv[i]![0], g.uv[i]![1]))
    const med = (k: number): number => cols.map((x) => x[k]).sort((a, b) => a - b)[cols.length >> 1]!
    // a detector box around the region's image centre names it
    const mu = comp.reduce((s, i) => s + g.uv[i]![0], 0) / comp.length
    const mv = comp.reduce((s, i) => s + g.uv[i]![1], 0) / comp.length
    const det = detections.filter((dd) => mu >= dd.box[0] && mu <= dd.box[0] + dd.box[2] && mv >= dd.box[1] && mv <= dd.box[1] + dd.box[3])
      .sort((a, b) => b.score - a.score)[0]
    const lab = det?.label ?? 'object'
    let kind: ObjectKind = det ? kindFor(lab) : 'block'
    if (kind !== 'block' && Math.max(w, d) > 1.6 * Math.min(w, d)) kind = 'block' // not round after all
    if (Math.max(w, d) > 0.45 || top > 0.45) continue // not a table-top object (furniture, a person, an edge of the view)
    const round = kind !== 'block'
    const size = round ? Math.max(w, d) : w
    objects.push({
      label: lab, kind, x: c[0], y: c[1], yaw: round ? 0 : yaw, w: size, d: round ? size : d, h: Math.max(top, 0.02),
      color: [med(0), med(1), med(2)],
    })
  }
  const tc = (k: number): number => tableCols.map((x) => x[k]).sort((a, b) => a - b)[tableCols.length >> 1] ?? 0.6
  return { objects, tableColor: tableCols.length ? [tc(0), tc(1), tc(2)] : [0.62, 0.62, 0.6] }
}

/** grid cell of a camera-frame point */
function projectCell(p: V3, g: PointGrid, K: Intrinsics): [number, number] {
  const u = K.fx * (p[0] / p[2]) + K.cx
  const v = K.fy * (p[1] / p[2]) + K.cy
  return [Math.floor((u / K.width) * g.gw), Math.floor((v / K.height) * g.gh)]
}

/**
 * A photo-textured surface of the view (robot frame): one vertex per grid cell, triangles dropped across depth jumps
 * (object edges) so nothing gets stretched over the gaps. uv in 0..1 of the reference frame.
 */
export function backdropMesh(g: PointGrid, toRobot: (p: V3) => V3, skip: Box[], maxDist: number): { positions: number[]; uvs: number[]; index: number[] } {
  const positions: number[] = []
  const uvs: number[] = []
  const id = new Int32Array(g.P.length).fill(-1)
  g.P.forEach((p, i) => {
    if (!p || p[2] > maxDist) return
    const r = toRobot(p)
    id[i] = positions.length / 3
    positions.push(r[0], r[1], r[2])
    const W = g.uv[g.gw - 1]![0] + g.uv[0]![0]
    const H = g.uv[(g.gh - 1) * g.gw]![1] + g.uv[0]![1]
    uvs.push(g.uv[i]![0] / W, 1 - g.uv[i]![1] / H)
  })
  const index: number[] = []
  const ok = (a: number, b: number): boolean => {
    const pa = g.P[a]!, pb = g.P[b]!
    return Math.abs(pa[2] - pb[2]) < 0.04 * Math.max(pa[2], pb[2])
  }
  for (let y = 0; y < g.gh - 1; y++)
    for (let x = 0; x < g.gw - 1; x++) {
      const a = y * g.gw + x, b = a + 1, c = a + g.gw, d = c + 1
      if (id[a]! < 0 || id[b]! < 0 || id[c]! < 0 || id[d]! < 0) continue
      if (inBoxes(g.uv[a]![0], g.uv[a]![1], skip)) continue
      if (ok(a, b) && ok(a, c) && ok(b, c)) index.push(id[a]!, id[c]!, id[b]!)
      if (ok(b, d) && ok(c, d) && ok(b, c)) index.push(id[b]!, id[c]!, id[d]!)
    }
  return { positions, uvs, index }
}
