/**
 * Headless end-to-end check of video imitation: a synthetic "video" (a hand picks a cube up and puts it down
 * elsewhere, seen by a known camera) goes through buildImitation, then the Franka follows the result in MuJoCo.
 * Passes when the cube is lifted and ends up near where the hand put it.
 *
 *   node web/build_selftest.mjs && node <out>/imitate_selftest.mjs [--depth]
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { DEFAULT_CONFIG } from '../engine/data'
import { MuJoCoEnv } from '../engine/env'
import { runImitation } from '../engine/imitation'
import { loadMujoco, type AssetSource } from '../engine/mujocoLoader'
import { buildImitation, type FrameHand, type VideoObservations } from './build'
import { add, cross, intrinsicsFromFov, mul, project, sub, unit, type V3 } from './geometry'

const STATIC = path.resolve(process.argv[2] ?? 'src/dooms/server/static')
const withDepth = process.argv.includes('--depth')

// ---------------------------------------------------------------- synthetic camera (world: table frame, z up)
const W = 640
const Hh = 480
const HFOV = 68
const K = intrinsicsFromFov(W, Hh, HFOV)
const camPos: V3 = [-0.62, 0.05, 0.55]
const look: V3 = [0.0, 0.0, 0.0]
const fwd = unit(sub(look, camPos))
const right = unit(cross(fwd, [0, 0, 1]))
const down = cross(fwd, right)
const tilt = (Math.asin(-fwd[2]) * 180) / Math.PI
/** world -> camera (OpenCV) */
const toCam = (p: V3): V3 => {
  const d = sub(p, camPos)
  return [d[0] * right[0] + d[1] * right[1] + d[2] * right[2], d[0] * down[0] + d[1] * down[1] + d[2] * down[2], d[0] * fwd[0] + d[1] * fwd[1] + d[2] * fwd[2]]
}
const dirToCam = (v: V3): V3 => [v[0] * right[0] + v[1] * right[1] + v[2] * right[2], v[0] * down[0] + v[1] * down[1] + v[2] * down[2], v[0] * fwd[0] + v[1] * fwd[1] + v[2] * fwd[2]]

// ---------------------------------------------------------------- synthetic hand (21 MediaPipe landmarks)
/** landmarks around the pinch point G, fingers pointing along `heading`, thumb-index gap `a` across */
function hand(G: V3, heading: number, a: number): V3[] {
  const f: V3 = [Math.cos(heading), Math.sin(heading), 0]
  const s: V3 = [-Math.sin(heading), Math.cos(heading), 0]
  const at = (x: number, y: number, z: number): V3 => add(G, add(add(mul(f, x), mul(s, y)), [0, 0, z]))
  const P: V3[] = new Array(21)
  P[0] = at(-0.09, 0, 0.07) // wrist
  P[5] = at(-0.02, -0.02, 0.06)
  P[9] = at(-0.022, 0.0, 0.065)
  P[13] = at(-0.025, 0.02, 0.06)
  P[17] = at(-0.03, 0.04, 0.055)
  P[4] = at(0, a / 2, 0) // thumb tip
  P[8] = at(0, -a / 2, 0) // index tip
  P[12] = at(0.01, -a / 2 - 0.006, 0.012)
  P[16] = at(0.0, -a / 2 + 0.01, 0.02)
  P[20] = at(-0.01, -a / 2 + 0.02, 0.03)
  const lerp = (i: number, j: number, k: number): V3 => add(mul(P[i]!, 1 - k), mul(P[j]!, k))
  P[1] = lerp(0, 4, 0.25)
  P[2] = lerp(0, 4, 0.5)
  P[3] = lerp(0, 4, 0.75)
  for (const [m, t] of [[5, 8], [9, 12], [13, 16], [17, 20]] as const) {
    P[m + 1] = lerp(m, t, 0.4)
    P[m + 2] = lerp(m, t, 0.72)
  }
  return P
}

// ---------------------------------------------------------------- the demonstration
const CUBE: V3 = [0.0, 0.06, 0.02] // 4 cm cube centre (world)
const PLACE: V3 = [-0.04, -0.16, 0.02]
const keys: [number, V3, number][] = [ // time, pinch point, thumb-index gap
  [0.0, [0.16, 0.12, 0.16], 0.11],
  [1.2, [CUBE[0], CUBE[1], 0.12], 0.11],
  [2.0, [CUBE[0], CUBE[1], 0.02], 0.11],
  [2.6, [CUBE[0], CUBE[1], 0.02], 0.056], // pinch closes on the cube
  [3.3, [CUBE[0], CUBE[1], 0.15], 0.056],
  [4.6, [PLACE[0], PLACE[1], 0.15], 0.056],
  [5.4, [PLACE[0], PLACE[1], 0.022], 0.056],
  [6.0, [PLACE[0], PLACE[1], 0.022], 0.11], // release
  [6.8, [PLACE[0], PLACE[1], 0.16], 0.11],
]
const sampleAt = (t: number): [V3, number] => {
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, p0, a0] = keys[i]!
    const [t1, p1, a1] = keys[i + 1]!
    if (t <= t1) {
      const k0 = (t - t0) / (t1 - t0)
      const k = k0 * k0 * (3 - 2 * k0)
      return [add(mul(p0, 1 - k), mul(p1, k)), a0 + (a1 - a0) * k]
    }
  }
  return [keys[keys.length - 1]![1], keys[keys.length - 1]![2]]
}

const fps = 15
const dt = 1 / fps
const frames: FrameHand[][] = []
let rng = 7
const noise = (s: number): number => ((rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5) * 2 * s
for (let t = 0; t <= 7.0 + 1e-9; t += dt) {
  const [G, a] = sampleAt(t)
  const Pw = hand(G, Math.PI, a) // the person sits across the table: fingers point towards the camera
  const Pc = Pw.map(toCam)
  const c = mul(Pc.reduce((acc, p) => add(acc, p), [0, 0, 0] as V3), 1 / 21)
  const world = Pc.map((p) => sub(p, c)) // MediaPipe world landmarks: metric, around the hand centre, camera axes
  const image = Pc.map((p) => {
    const [u, v] = project(K, p)
    return [u + noise(1.5), v + noise(1.5)] as [number, number]
  })
  const depth = withDepth ? Pc.map((p) => p[2] - 0.008 + noise(0.004)) : undefined
  frames.push(Math.round(t * fps) === 40 ? [] : [{ image, world, label: 'Right', score: 0.95, depth }]) // one dropped frame
}

// the cube's box in the first frame
const corners: V3[] = []
for (const dx of [-0.02, 0.02]) for (const dy of [-0.02, 0.02]) for (const dz of [0, 0.04]) corners.push([CUBE[0] + dx, CUBE[1] + dy, dz])
const px = corners.map((p) => project(K, toCam(p)))
const bx0 = Math.min(...px.map((p) => p[0]))
const by0 = Math.min(...px.map((p) => p[1]))
const box: [number, number, number, number] = [bx0, by0, Math.max(...px.map((p) => p[0])) - bx0, Math.max(...px.map((p) => p[1])) - by0]

const tableSamples: [number, number, number][] = []
if (withDepth)
  for (let u = 20; u < W; u += 40)
    for (let v = 200; v < Hh; v += 30) {
      // ray-plane z=0 in world
      const r = unit([(u - K.cx) / K.fx, (v - K.cy) / K.fy, 1])
      const rw = add(add(mul(right, r[0]), mul(down, r[1])), mul(fwd, r[2]))
      if (rw[2] >= -1e-3) continue
      const s = -camPos[2] / rw[2]
      const pw = add(camPos, mul(rw, s))
      tableSamples.push([u, v, toCam(pw)[2]])
    }

const obs: VideoObservations = {
  width: W, height: Hh, dt, t0: 0, frames,
  detections: [{ label: 'cube', score: 0.8, box, color: [0.85, 0.15, 0.15], depth: withDepth ? toCam([CUBE[0] - 0.02, CUBE[1], 0.022])[2] : null }],
  tableSamples: withDepth ? tableSamples : undefined,
}
void dirToCam

const built = buildImitation(obs, { hfov: HFOV, tilt, hand: 'auto', orientation: 'topdown', assist: true })
const rep = built.report
console.log(`mode: ${withDepth ? 'depth' : 'plain video'}  tilt ${tilt.toFixed(1)} deg`)
console.log(`hand ${rep.hand}, frames ${rep.frames}, seen ${(rep.seen * 100).toFixed(0)}%, depth ${rep.depth}, reachable ${(rep.reachable * 100).toFixed(0)}%`)
console.log(`robot base (world) x=${rep.placement.x.toFixed(3)} y=${rep.placement.y.toFixed(3)} yaw=${((rep.placement.yaw * 180) / Math.PI).toFixed(0)} deg`)
for (const o of rep.objects) console.log(`object ${o.name} ${o.kind} at robot (${o.x.toFixed(3)}, ${o.y.toFixed(3)}) w=${o.w.toFixed(3)} h=${o.h.toFixed(3)}${o.inferred ? ' (inferred)' : ''}`)
console.log('grasps', JSON.stringify(rep.grasps))
for (const w of rep.warnings) console.log('warning:', w)

// ---------------------------------------------------------------- run it in MuJoCo
const assets: AssetSource = {
  text: (p) => readFile(path.join(STATIC, 'dooms', p), 'utf8'),
  bytes: async (p) => new Uint8Array(await readFile(path.join(STATIC, 'dooms', p))),
}
const mod = (await import(pathToFileURL(path.join(STATIC, 'vendor/mujoco/mujoco.js')).href)) as { default: (o?: unknown) => Promise<unknown> }
const mj = await loadMujoco({ factory: mod.default })
const env = await MuJoCoEnv.create(mj, assets, built.task, DEFAULT_CONFIG, 'franka')
env.reset(0)
const name = rep.objects.find((o) => o.grasped)?.name
if (!name) throw new Error('FAIL: no object was linked to the grasp')
const start = env.objectPos(name)
const t0 = Date.now()
const res = await runImitation(env, built.trajectory)
const end = env.objectPos(name)
const g = built.trajectory.grasps!.find((q) => q.object === name)!
const release = built.trajectory.pos[g.end]!
console.log(`tracking: mean ${(res.err_mean * 1000).toFixed(1)} mm, p95 ${(res.err_p95 * 1000).toFixed(1)} mm, within 2 cm ${(res.tracked * 100).toFixed(0)}%  (${((Date.now() - t0) / 1000).toFixed(1)} s wall)`)
console.log('grasp results', JSON.stringify(res.grasps))
console.log(`${name}: start (${start.map((x) => x.toFixed(3)).join(', ')}) end (${end.map((x) => x.toFixed(3)).join(', ')})  released at (${release.map((x) => x.toFixed(3)).join(', ')})`)
// frame-free checks: the cube travels as far as the hand carried it, and lands where the arm let go
const moved = Math.hypot(end[0] - start[0], end[1] - start[1])
const truth = Math.hypot(PLACE[0] - CUBE[0], PLACE[1] - CUBE[1])
const atRelease = Math.hypot(end[0] - release[0], end[1] - release[1])
console.log(`moved ${(moved * 100).toFixed(1)} cm (video: ${(truth * 100).toFixed(1)} cm), ${(atRelease * 100).toFixed(1)} cm from the release point`)
const ok = res.grasps.some((q) => q.lifted) && Math.abs(moved - truth) < 0.04 && atRelease < 0.03 && end[2] < 0.05
console.log(ok ? 'PASS' : 'FAIL')
process.exit(ok ? 0 : 1)
