/** Export the renderable part of a MuJoCo model as JSON for the 3D viewer: the same shape as GET /api/scene (scene_export.py). */
import type { MjData, MjModel } from './mujocoApi'
import type { SceneData, SceneGeom, SceneMesh } from '../types'

const TYPE_NAMES: Record<number, SceneGeom['type']> = { 0: 'plane', 6: 'box', 5: 'cylinder', 2: 'sphere', 7: 'mesh' }
const VISIBLE_MAX_GROUP = 2 // groups 0-2 are visible in MuJoCo by default (Panda visuals are group 2)

function b64(u8: Uint8Array): string {
  let s = ''
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000))
  return btoa(s)
}
const r = (x: number, k: number): number => Math.round(x * 10 ** k) / 10 ** k

function exportMesh(m: MjModel, mid: number): SceneMesh {
  const v0 = m.mesh_vertadr[mid]!
  const vn = m.mesh_vertnum[mid]!
  const f0 = m.mesh_faceadr[mid]!
  const fn = m.mesh_facenum[mid]!
  const verts = m.mesh_vert
  // merge duplicate positions (MuJoCo splits vertices per normal/uv) so the browser can smooth-shade
  const index = new Map<string, number>()
  const remap = new Int32Array(vn)
  const uniq: number[] = []
  for (let i = 0; i < vn; i++) {
    const x = verts[(v0 + i) * 3]!
    const y = verts[(v0 + i) * 3 + 1]!
    const z = verts[(v0 + i) * 3 + 2]!
    const key = `${Math.round(x * 1e6)},${Math.round(y * 1e6)},${Math.round(z * 1e6)}`
    let id = index.get(key)
    if (id === undefined) {
      id = uniq.length / 3
      index.set(key, id)
      uniq.push(x, y, z)
    }
    remap[i] = id
  }
  const faces = new Uint32Array(fn * 3)
  for (let i = 0; i < fn * 3; i++) faces[i] = remap[m.mesh_face[f0 * 3 + i]!]!
  const f32 = uniq.length / 3 >= 65535
  const idx = f32 ? faces : Uint16Array.from(faces)
  return { v: b64(new Uint8Array(Float32Array.from(uniq).buffer)), f: b64(new Uint8Array(idx.buffer)), f32 }
}

/** (nbody, 7) float32: x y z qw qx qy qz in world frame. */
export function poses(m: { nbody: number }, d: MjData): Float32Array {
  const out = new Float32Array(m.nbody * 7)
  const xp = d.xpos
  const xq = d.xquat
  for (let b = 0; b < m.nbody; b++) {
    out[b * 7] = xp[b * 3]!
    out[b * 7 + 1] = xp[b * 3 + 1]!
    out[b * 7 + 2] = xp[b * 3 + 2]!
    out[b * 7 + 3] = xq[b * 4]!
    out[b * 7 + 4] = xq[b * 4 + 1]!
    out[b * 7 + 5] = xq[b * 4 + 2]!
    out[b * 7 + 6] = xq[b * 4 + 3]!
  }
  return out
}

export function exportScene(m: MjModel, d: MjData): Omit<SceneData, 'view' | 'robot'> {
  const geoms: SceneGeom[] = []
  const meshes: Record<string, SceneMesh> = {}
  for (let g = 0; g < m.ngeom; g++) {
    if (m.geom_group[g]! > VISIBLE_MAX_GROUP) continue
    const t = TYPE_NAMES[m.geom_type[g]!]
    if (!t) continue
    const mat = m.geom_matid[g]!
    const gr = m.geom_rgba.subarray(g * 4, g * 4 + 4)
    let c = mat >= 0 ? m.mat_rgba.subarray(mat * 4, mat * 4 + 4) : gr
    if (mat >= 0 && gr[3]! < 1) c = gr
    const item: SceneGeom = {
      body: m.geom_bodyid[g]!, type: t,
      size: Array.from(m.geom_size.subarray(g * 3, g * 3 + 3), (x) => r(x, 5)),
      pos: Array.from(m.geom_pos.subarray(g * 3, g * 3 + 3), (x) => r(x, 5)),
      quat: Array.from(m.geom_quat.subarray(g * 4, g * 4 + 4), (x) => r(x, 6)),
      rgba: Array.from(c, (x) => r(x, 3)),
    }
    if (t === 'mesh') {
      const mid = m.geom_dataid[g]!
      item.mesh = mid
      if (!(String(mid) in meshes)) meshes[String(mid)] = exportMesh(m, mid)
    }
    geoms.push(item)
  }
  const P = poses(m, d)
  return { nbody: m.nbody, geoms, meshes, poses: Array.from({ length: m.nbody }, (_, b) => Array.from(P.subarray(b * 7, b * 7 + 7))) }
}
