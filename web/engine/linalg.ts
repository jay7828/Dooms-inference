/** Small dense linear algebra for the Dooms engine (3-vectors, 3x3 rotations, thin SVD). No dependencies. */

export type Vec3 = [number, number, number]
/** Row-major 3x3 matrix. */
export type Mat3 = [number, number, number, number, number, number, number, number, number]

export const v3 = (x = 0, y = 0, z = 0): Vec3 => [x, y, z]
export const add = (a: ArrayLike<number>, b: ArrayLike<number>): Vec3 => [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!]
export const sub = (a: ArrayLike<number>, b: ArrayLike<number>): Vec3 => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!]
export const scale = (a: ArrayLike<number>, k: number): Vec3 => [a[0]! * k, a[1]! * k, a[2]! * k]
export const dot = (a: ArrayLike<number>, b: ArrayLike<number>): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!
export const cross = (a: ArrayLike<number>, b: ArrayLike<number>): Vec3 => [
  a[1]! * b[2]! - a[2]! * b[1]!,
  a[2]! * b[0]! - a[0]! * b[2]!,
  a[0]! * b[1]! - a[1]! * b[0]!,
]
export const norm = (a: ArrayLike<number>): number => Math.hypot(a[0]!, a[1]!, a[2]!)
export const normalize = (a: ArrayLike<number>): Vec3 => {
  const n = norm(a)
  return n > 0 ? scale(a, 1 / n) : [a[0]!, a[1]!, a[2]!]
}
export const copy3 = (a: ArrayLike<number>): Vec3 => [a[0]!, a[1]!, a[2]!]

/** M (3x3 row-major) * v */
export const matVec = (m: ArrayLike<number>, v: ArrayLike<number>): Vec3 => [
  m[0]! * v[0]! + m[1]! * v[1]! + m[2]! * v[2]!,
  m[3]! * v[0]! + m[4]! * v[1]! + m[5]! * v[2]!,
  m[6]! * v[0]! + m[7]! * v[1]! + m[8]! * v[2]!,
]
/** M^T * v */
export const matTVec = (m: ArrayLike<number>, v: ArrayLike<number>): Vec3 => [
  m[0]! * v[0]! + m[3]! * v[1]! + m[6]! * v[2]!,
  m[1]! * v[0]! + m[4]! * v[1]! + m[7]! * v[2]!,
  m[2]! * v[0]! + m[5]! * v[1]! + m[8]! * v[2]!,
]
export const col = (m: ArrayLike<number>, j: number): Vec3 => [m[j]!, m[3 + j]!, m[6 + j]!]
export const matMul = (a: ArrayLike<number>, b: ArrayLike<number>): Mat3 => {
  const o = new Array<number>(9).fill(0)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j]! += a[i * 3 + k]! * b[k * 3 + j]!
  return o as Mat3
}
export const matMulT = (a: ArrayLike<number>, b: ArrayLike<number>): Mat3 => {
  // a * b^T
  const o = new Array<number>(9).fill(0)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j]! += a[i * 3 + k]! * b[j * 3 + k]!
  return o as Mat3
}

/** Rotation matrix -> unit quaternion (w, x, y, z) with w >= 0 (scipy's Rotation.from_matrix convention). */
export function matToQuat(m: ArrayLike<number>): [number, number, number, number] {
  const d = [m[0]!, m[4]!, m[8]!]
  const tr = d[0]! + d[1]! + d[2]!
  const dec = [d[0]!, d[1]!, d[2]!, tr]
  let k = 0
  for (let i = 1; i < 4; i++) if (dec[i]! > dec[k]!) k = i
  const q = [0, 0, 0, 0] // x y z w
  if (k !== 3) {
    const i = k
    const j = (i + 1) % 3
    const l = (j + 1) % 3
    q[i] = 1 - dec[3]! + 2 * m[i * 3 + i]!
    q[j] = m[j * 3 + i]! + m[i * 3 + j]!
    q[l] = m[l * 3 + i]! + m[i * 3 + l]!
    q[3] = m[l * 3 + j]! - m[j * 3 + l]!
  } else {
    q[0] = m[7]! - m[5]!
    q[1] = m[2]! - m[6]!
    q[2] = m[3]! - m[1]!
    q[3] = 1 + dec[3]!
  }
  const n = Math.hypot(q[0]!, q[1]!, q[2]!, q[3]!)
  let [x, y, z, w] = [q[0]! / n, q[1]! / n, q[2]! / n, q[3]! / n]
  if (w < 0) [x, y, z, w] = [-x, -y, -z, -w]
  return [w, x, y, z]
}

/** Rotation matrix -> rotation vector (axis * angle), angle in [0, pi]. */
export function matToRotvec(m: ArrayLike<number>): Vec3 {
  const [w, x, y, z] = matToQuat(m)
  const s = Math.hypot(x, y, z)
  if (s < 1e-12) return [0, 0, 0]
  const angle = 2 * Math.atan2(s, w)
  const k = angle / s
  return [x * k, y * k, z * k]
}

/** Unit quaternion (w x y z) -> 3x3 rotation matrix. */
export function quatToMat(q: ArrayLike<number>): Mat3 {
  const [w, x, y, z] = [q[0]!, q[1]!, q[2]!, q[3]!]
  return [
    1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y),
    2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x),
    2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y),
  ]
}

/** Rotation matrix -> quaternion exactly like mju_mat2Quat (w x y z). */
export function mat2Quat(m: ArrayLike<number>): [number, number, number, number] {
  const q: [number, number, number, number] = [0, 0, 0, 0]
  const tr = m[0]! + m[4]! + m[8]!
  if (tr > 0) {
    q[0] = 1 + tr
    q[1] = m[7]! - m[5]!
    q[2] = m[2]! - m[6]!
    q[3] = m[3]! - m[1]!
  } else if (m[0]! > m[4]! && m[0]! > m[8]!) {
    q[1] = 1 + m[0]! - m[4]! - m[8]!
    q[0] = m[7]! - m[5]!
    q[2] = m[1]! + m[3]!
    q[3] = m[2]! + m[6]!
  } else if (m[4]! > m[8]!) {
    q[2] = 1 - m[0]! + m[4]! - m[8]!
    q[0] = m[2]! - m[6]!
    q[1] = m[1]! + m[3]!
    q[3] = m[5]! + m[7]!
  } else {
    q[3] = 1 - m[0]! - m[4]! + m[8]!
    q[0] = m[3]! - m[1]!
    q[1] = m[2]! + m[6]!
    q[2] = m[5]! + m[7]!
  }
  const n = Math.hypot(...q)
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n]
}

/** Quaternion product a*b (w x y z). */
export function quatMul(a: ArrayLike<number>, b: ArrayLike<number>): [number, number, number, number] {
  return [
    a[0]! * b[0]! - a[1]! * b[1]! - a[2]! * b[2]! - a[3]! * b[3]!,
    a[0]! * b[1]! + a[1]! * b[0]! + a[2]! * b[3]! - a[3]! * b[2]!,
    a[0]! * b[2]! - a[1]! * b[3]! + a[2]! * b[0]! + a[3]! * b[1]!,
    a[0]! * b[3]! + a[1]! * b[2]! - a[2]! * b[1]! + a[3]! * b[0]!,
  ]
}

// ------------------------------------------------------------------------------------------------ dense matrices

/** Dense row-major matrix. */
export class Mat {
  constructor(public rows: number, public cols: number, public data: Float64Array = new Float64Array(rows * cols)) {}
  static eye(n: number): Mat {
    const m = new Mat(n, n)
    for (let i = 0; i < n; i++) m.data[i * n + i] = 1
    return m
  }
  static fromRows(rows: ArrayLike<number>[]): Mat {
    const m = new Mat(rows.length, rows[0]?.length ?? 0)
    rows.forEach((r, i) => m.data.set(Array.from(r), i * m.cols))
    return m
  }
  get(i: number, j: number): number {
    return this.data[i * this.cols + j]!
  }
  set(i: number, j: number, v: number): void {
    this.data[i * this.cols + j] = v
  }
  mul(o: Mat): Mat {
    const r = new Mat(this.rows, o.cols)
    for (let i = 0; i < this.rows; i++)
      for (let k = 0; k < this.cols; k++) {
        const a = this.data[i * this.cols + k]!
        if (a === 0) continue
        for (let j = 0; j < o.cols; j++) r.data[i * o.cols + j]! += a * o.data[k * o.cols + j]!
      }
    return r
  }
  mulVec(v: ArrayLike<number>): Float64Array {
    const r = new Float64Array(this.rows)
    for (let i = 0; i < this.rows; i++) {
      let s = 0
      for (let j = 0; j < this.cols; j++) s += this.data[i * this.cols + j]! * v[j]!
      r[i] = s
    }
    return r
  }
  sub(o: Mat): Mat {
    const r = new Mat(this.rows, this.cols)
    for (let i = 0; i < r.data.length; i++) r.data[i] = this.data[i]! - o.data[i]!
    return r
  }
  T(): Mat {
    const r = new Mat(this.cols, this.rows)
    for (let i = 0; i < this.rows; i++) for (let j = 0; j < this.cols; j++) r.data[j * this.rows + i] = this.data[i * this.cols + j]!
    return r
  }
  static vstack(ms: Mat[]): Mat {
    const cols = ms[0]!.cols
    const rows = ms.reduce((a, m) => a + m.rows, 0)
    const r = new Mat(rows, cols)
    let o = 0
    for (const m of ms) {
      r.data.set(m.data, o)
      o += m.data.length
    }
    return r
  }
}

export interface Svd {
  /** m x k (columns are left singular vectors; only meaningful where s > 0) */
  U: Mat
  s: Float64Array
  /** n x k (columns are right singular vectors) */
  V: Mat
}

/** One-sided Jacobi SVD of a (r x c, r >= c): returns U (r x c), s (c), V (c x c). */
function jacobiTall(a: Mat): Svd {
  const r = a.rows
  const c = a.cols
  const U = new Mat(r, c, Float64Array.from(a.data))
  const V = Mat.eye(c)
  for (let sweep = 0; sweep < 60; sweep++) {
    let rotated = false
    for (let p = 0; p < c - 1; p++)
      for (let q = p + 1; q < c; q++) {
        let alpha = 0
        let beta = 0
        let gamma = 0
        for (let i = 0; i < r; i++) {
          const up = U.data[i * c + p]!
          const uq = U.data[i * c + q]!
          alpha += up * up
          beta += uq * uq
          gamma += up * uq
        }
        if (Math.abs(gamma) <= 1e-15 * Math.sqrt(alpha * beta) || gamma === 0) continue
        rotated = true
        const zeta = (beta - alpha) / (2 * gamma)
        const t = Math.sign(zeta || 1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta))
        const cs = 1 / Math.sqrt(1 + t * t)
        const sn = cs * t
        for (let i = 0; i < r; i++) {
          const up = U.data[i * c + p]!
          const uq = U.data[i * c + q]!
          U.data[i * c + p] = cs * up - sn * uq
          U.data[i * c + q] = sn * up + cs * uq
        }
        for (let i = 0; i < c; i++) {
          const vp = V.data[i * c + p]!
          const vq = V.data[i * c + q]!
          V.data[i * c + p] = cs * vp - sn * vq
          V.data[i * c + q] = sn * vp + cs * vq
        }
      }
    if (!rotated) break
  }
  const s = new Float64Array(c)
  for (let j = 0; j < c; j++) {
    let n = 0
    for (let i = 0; i < r; i++) n += U.data[i * c + j]! ** 2
    s[j] = Math.sqrt(n)
    if (s[j]! > 1e-300) for (let i = 0; i < r; i++) U.data[i * c + j]! /= s[j]!
  }
  return { U, s, V }
}

/** Thin SVD, A = U diag(s) V^T with k = min(rows, cols) (singular values unordered). */
export function svd(a: Mat): Svd {
  if (a.rows >= a.cols) return jacobiTall(a)
  const t = jacobiTall(a.T()) // A^T = U' S V'^T  =>  A = V' S U'^T
  return { U: t.V, s: t.s, V: t.U }
}

export const clipNorm = (v: Float64Array, vmax: number): Float64Array => {
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n)
  if (n <= vmax || n === 0) return v
  return v.map((x) => x * (vmax / n))
}
