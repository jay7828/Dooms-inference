/**
 * Turn what was seen in a video (hand keypoints per frame, objects in the first frame, optional depth readings) into
 * a Dooms scene (TaskSpec, robot frame) and a trajectory for the arm to follow. Pure: no browser APIs.
 */
import type { ObjectSpec, TaskSpec } from '../engine/data'
import type { ImitationTrajectory } from '../engine/imitation'
import {
  DEFAULT_RETARGET, H, IGNORE, assistGrasps, backproject, cleanTrack, findGrasps, fitPlane, gripWidth, intrinsicsFromFov, liftDetection,
  liftHand, mid, mul, mujocoCamera, mv, height, rayPlane, placeRobot, planeFromTilt, project, retarget, robotFrame, sub, toWorld, worldFrame, len,
  type Detection, type HandObs, type ObjectKind, type Intrinsics, type M3, type Placement, type Plane, type SceneObject, type V3, type WorldFrame,
} from './geometry'
import { hexColor, type LlmObject } from './review'
import { backdropMesh, calibrateByPlane, calibrateDepth, pointGrid, segmentObjects, tableFromGrid, type Box, type DepthMap, type PointGrid } from './scene'

export type HandLabel = 'Left' | 'Right'
export interface FrameHand extends HandObs {
  /** which hand (MediaPipe's label) */
  label: HandLabel
  score: number
  /** depth (metres) at each of the 21 landmarks, when there is a depth video */
  depth?: (number | null)[]
}
export interface VideoObservations {
  width: number
  height: number
  /** seconds between analysed frames */
  dt: number
  /** start time of frame 0 in the video (seconds) */
  t0: number
  frames: FrameHand[][]
  /** objects found in the first frame; `depth`: median depth in the box centre */
  detections: (Detection & { depth?: number | null })[]
  /** (u, v, depth) samples of the first frame, for the table plane */
  tableSamples?: [number, number, number][]
  /** colour of the scene's reference frame at a pixel (0..1) */
  colorAt?: (u: number, v: number) => [number, number, number] | null
  /** monocular depth of a reference frame (few hands in it), with hand frames' depth aligned to it for the scale */
  scene?: {
    frame: number
    depth: DepthMap
    /** the reference frame as a JPEG data URL (texture of the 3D view) */
    image: string
    /** hands / arms in the reference frame */
    skip: Box[]
    anchors: { frame: number; label: HandLabel; d: (number | null)[] }[]
  }
}

export interface BuildOptions {
  /** horizontal field of view of the camera (degrees) */
  hfov: number
  /** camera tilt below horizontal (degrees); only used without depth */
  tilt: number
  hand: 'auto' | HandLabel
  orientation: 'topdown' | 'full'
  /** centre the gripper on the object it closes on */
  assist: boolean
  /** objects the user removed (by name) */
  drop?: string[]
  /** the scene as Claude described it (replaces the objects found in depth / by the detector) */
  llm?: LlmObject[] | null
}
export const DEFAULT_BUILD: BuildOptions = { hfov: 68, tilt: 40, hand: 'auto', orientation: 'topdown', assist: true }

export interface BuildReport {
  frames: number
  seen: number
  depth: boolean
  /** where the 3D of the scene came from */
  scene3d: 'depth video' | 'depth model' | 'camera tilt'
  /** where the objects came from */
  objectsFrom: 'Claude' | 'depth' | 'detector'
  /** each object's centre in the video image (same order as objects) */
  pixels: ([number, number] | null)[]
  hand: HandLabel
  reachable: number
  placement: Placement
  objects: SceneObject[]
  grasps: { object: string | null; start_s: number; end_s: number }[]
  warnings: string[]
}

export interface Built {
  task: TaskSpec
  trajectory: ImitationTrajectory
  report: BuildReport
  /** chosen hand's pixels per analysed frame (null: not seen), for the video overlay */
  overlay: ([number, number][] | null)[]
  /** first analysed frame index used and the video time of trajectory sample 0 */
  start: number
  t_start: number
  /** robot-frame TCP path, for the 3D view */
  path: V3[]
  /** the viewer's default camera: at the video camera, looking at the work area */
  view: { pos: V3; target: V3 }
  camera: { pos: V3; quat: [number, number, number, number]; fovy: number }
  K: Intrinsics
  /** photo-textured surface of the view in the robot frame (from the depth model) */
  backdrop?: { positions: number[]; uvs: number[]; index: number[]; image: string }
}

const safeName = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'object'

/** Pick the hand to copy: the requested one, or (auto) the one doing the work: it moves the most and opens / closes
 *  the most (a resting hand is seen just as often). */
function chooseHand(frames: FrameHand[][], want: BuildOptions['hand'], diag: number): HandLabel {
  if (want !== 'auto') return want
  const score = (label: HandLabel): number => {
    let path = 0
    let prev: [number, number] | null = null
    const gaps: number[] = []
    for (const f of frames) {
      const h = f.find((x) => x.label === label)
      if (!h) {
        prev = null
        continue
      }
      const p = h.image[9]!
      if (prev) path += Math.hypot(p[0] - prev[0], p[1] - prev[1])
      prev = p
      const a = h.world[4]!
      const b = h.world[8]!
      gaps.push(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]))
    }
    if (gaps.length < 3) return -1
    gaps.sort((x, y) => x - y)
    const range = gaps[Math.floor(gaps.length * 0.9)]! - gaps[Math.floor(gaps.length * 0.1)]!
    return path / diag + 20 * range + gaps.length / frames.length
  }
  return score('Right') >= score('Left') ? 'Right' : 'Left'
}

export function buildImitation(obs: VideoObservations, opt: BuildOptions = DEFAULT_BUILD): Built {
  const warnings: string[] = []
  const K = intrinsicsFromFov(obs.width, obs.height, opt.hfov)
  const label = chooseHand(obs.frames, opt.hand, Math.hypot(obs.width, obs.height))
  const picked = obs.frames.map((f) => f.filter((h) => h.label === label).sort((a, b) => b.score - a.score)[0] ?? null)
  const first = picked.findIndex((h) => h !== null)
  if (first < 0) throw new Error(`No ${label.toLowerCase()} hand was found in the video.`)
  let last = picked.length - 1
  while (last > first && !picked[last]) last--
  const span = picked.slice(first, last + 1)
  if (span.length < 4) throw new Error('The hand is visible for too short a time to copy the motion.')

  // 1. hand -> camera frame (one z convention for the whole video: the majority of per-frame fits)
  const votes = span.filter(Boolean).map((h) => liftHand(h!, K, h!.depth)?.flipZ)
  const flip = votes.filter((v) => v === true).length > votes.length / 2
  let fromDepth = 0
  const raw: (V3[] | null)[] = span.map((h) => {
    if (!h) return null
    const r = liftHand(h, K, h.depth, flip)
    if (!r) return null
    if (r.fromDepth) fromDepth++
    return r.pts
  })
  const seenCount = raw.filter(Boolean).length

  // depth model: make it metric (hand size + flat table), then let it correct the hand's distance, which the hand's
  // size alone gets wrong by up to ~10% from frame to frame (pose, lens). Scaling about the camera keeps the pixels.
  let cal: { a: number; b: number } | null = null
  if (obs.scene && !hasDepthVideo(obs)) {
    const pairs: { D: number; z: number }[] = []
    for (const a of obs.scene.anchors) {
      const h = obs.frames[a.frame]?.find((x) => x.label === a.label)
      const lifted = h ? liftHand(h, K, null, flip) : null
      if (!lifted) continue
      lifted.pts.forEach((p, i) => {
        const D = a.d[i]
        if (D !== null && D !== undefined) pairs.push({ D, z: p[2] + 0.008 })
      })
    }
    cal = calibrateByPlane(obs.scene.depth, pairs, K, obs.scene.skip) ?? calibrateDepth(pairs)
    if (cal) {
      const knots: [number, number][] = [] // (span index, scale)
      for (const a of obs.scene.anchors) {
        if (a.label !== label) continue
        const k = a.frame - first
        const P = raw[k]
        if (!P) continue
        const rs = [0, 5, 9, 13, 17].flatMap((i) => {
          const D = a.d[i]
          const inv = D === null || D === undefined ? -1 : cal!.a * D + cal!.b
          return inv > 0.1 ? [(1 / inv - 0.008) / P[i]![2]] : []
        }).sort((x, y) => x - y)
        if (rs.length >= 3) knots.push([k, Math.min(Math.max(rs[rs.length >> 1]!, 0.6), 1.6)])
      }
      knots.sort((x, y) => x[0] - y[0])
      if (knots.length) {
        const at = (k: number): number => {
          if (k <= knots[0]![0]) return knots[0]![1]
          for (let j = 0; j < knots.length - 1; j++) {
            const [k0, s0] = knots[j]!
            const [k1, s1] = knots[j + 1]!
            if (k <= k1) return s0 + ((s1 - s0) * (k - k0)) / (k1 - k0)
          }
          return knots[knots.length - 1]![1]
        }
        for (let k = 0; k < raw.length; k++) if (raw[k]) raw[k] = raw[k]!.map((p) => mul(p, at(k)))
      }
    }
  }
  const track = cleanTrack(raw, obs.dt, Math.round(0.6 / obs.dt))
  if (!track) throw new Error('The hand could not be placed in 3D.')
  const hasDepth = fromDepth > seenCount / 2
  if (!hasDepth && obs.frames.some((f) => f.some((h) => h.depth?.some((d) => d !== null)))) warnings.push('Depth readings at the hand were missing in most frames; used the hand size instead.')

  // 2. table plane: a depth video, else the depth model made metric with the hand, else the camera tilt
  let plane: Plane | null = null
  let scene3d: BuildReport['scene3d'] = 'camera tilt'
  if (obs.tableSamples && obs.tableSamples.length >= 30) {
    plane = fitPlane(obs.tableSamples.map(([u, v, d]) => backproject(K, u, v, d)))
    if (plane) scene3d = 'depth video'
    else warnings.push('No flat table found in the depth image; estimated it from the camera tilt.')
  }
  const tips = track.pts.flatMap((p) => [p[H.THUMB_TIP]!, p[H.INDEX_TIP]!, p[H.MIDDLE_TIP]!])
  let grid: PointGrid | null = null
  if (!plane && obs.scene) {
    if (cal) {
      grid = pointGrid(obs.scene.depth, cal, K)
      plane = tableFromGrid(grid, obs.scene.skip)
      if (plane) {
        scene3d = 'depth model'
        // the depth model sets the table; fingertips a little "under" it are depth noise, and the TCP is kept above it
      } else grid = null
    }
    if (!plane) warnings.push('Could not find the table in depth; set the camera tilt under Options.')
  }
  plane ??= planeFromTilt(opt.tilt, tips)

  // 3. world frame on the table, centred under the work area
  const tcpCam = track.pts.map((p) => mid(p[H.THUMB_TIP]!, p[H.INDEX_TIP]!))
  const centre = tcpCam.reduce((a, p) => [a[0] + p[0] / tcpCam.length, a[1] + p[1] / tcpCam.length, a[2] + p[2] / tcpCam.length] as V3, [0, 0, 0] as V3)
  const F: WorldFrame = worldFrame(plane, centre)
  const handsW = track.pts.map((p) => p.map((q) => toWorld(F, q)))

  // 4. objects: things standing on the table in the depth (named by the detector), or the detector's boxes alone
  const objectsW: SceneObject[] = []
  const used = new Map<string, number>()
  const nameFor = (label: string): string => {
    const base = safeName(label)
    const k = (used.get(base) ?? 0) + 1
    used.set(base, k)
    return `obj_${base}${k > 1 ? `_${k}` : ''}`
  }
  let tableColor: [number, number, number] | null = null
  let objectsFrom: BuildReport['objectsFrom'] = grid ? 'depth' : 'detector'
  if (opt.llm) {
    objectsFrom = 'Claude'
    const kinds: Record<string, ObjectKind> = { block: 'block', flat: 'block', cylinder: 'cylinder', sphere: 'sphere', cup: 'beaker' }
    for (const o of opt.llm) {
      if (o.shape === 'flat' && !o.touched) continue // lying decoration: the photo of the scene shows it already
      const [x0, y0, x1, y1] = o.box
      const at = rayPlane(K, plane, (x0! + x1!) / 2, (y0! + y1!) / 2)
      if (!at) continue
      const c = toWorld(F, at)
      const cm = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi) / 100
      const flat = o.shape === 'flat'
      const w = cm(o.width_cm, 1, flat ? 80 : 45)
      const name = nameFor(o.name)
      if (opt.drop?.includes(name)) continue
      objectsW.push({
        name, label: o.name, kind: kinds[o.shape] ?? 'block', x: c[0], y: c[1], yaw: 0, w,
        d: o.shape === 'cylinder' || o.shape === 'cup' || o.shape === 'sphere' ? w : cm(o.depth_cm, 1, flat ? 80 : 45),
        h: flat ? cm(o.height_cm, 0.3, 1) : cm(o.height_cm, 1, 45), color: hexColor(o.color),
      })
    }
    if (grid && obs.scene) tableColor = segmentObjects(grid, plane, F, K, (u, v) => obs.colorAt?.(u, v) ?? [0.6, 0.6, 0.6], obs.scene.skip, []).tableColor
  } else if (grid && obs.scene) {
    const seg = segmentObjects(grid, plane, F, K, (u, v) => obs.colorAt?.(u, v) ?? [0.6, 0.6, 0.6], obs.scene.skip, obs.detections.filter((d) => !IGNORE.has(d.label)))
    tableColor = seg.tableColor
    for (const o of seg.objects) {
      const name = nameFor(o.label)
      if (!opt.drop?.includes(name)) objectsW.push({ ...o, name })
    }
  }
  for (const det of grid || opt.llm ? [] : [...obs.detections].sort((a, b) => b.score - a.score)) {
    if (IGNORE.has(det.label) || det.score < 0.3) continue
    const o = liftDetection(det, K, plane, F, det.depth)
    if (!o || Math.max(o.w, o.h) > 0.4 || Math.hypot(o.x, o.y) > 1.2) continue
    if (objectsW.some((p) => Math.hypot(p.x - o.x, p.y - o.y) < Math.max(p.w, o.w) / 2)) continue // same thing twice
    const name = nameFor(det.label)
    if (opt.drop?.includes(name)) continue
    objectsW.push({ ...o, name })
  }

  // 5. where the robot stands: the person's side (fingertips -> wrist points at the body), within reach of it all
  const toward = handsW.reduce((a, p) => {
    const d = sub(p[H.WRIST]!, p[H.MIDDLE_TIP]!)
    return [a[0] + d[0], a[1] + d[1]] as [number, number]
  }, [0, 0] as [number, number])
  const camW = toWorld(F, [0, 0, 0])
  const tcpW = handsW.map((p) => mid(p[H.THUMB_TIP]!, p[H.INDEX_TIP]!))
  const placement = placeRobot(tcpW, objectsW, toward, camW)
  if (placement.reachable < 0.85) warnings.push(`Only ${Math.round(placement.reachable * 100)}% of the hand's path is within the arm's reach; the rest is followed as closely as possible.`)
  const RF = robotFrame(placement)

  // 6. robot frame
  const handsR = handsW.map((p) => p.map(RF.toRobot))
  const objects: SceneObject[] = objectsW.map((o) => {
    const p = RF.toRobot([o.x, o.y, 0])
    return { ...o, x: p[0], y: p[1], yaw: RF.yawToRobot(o.yaw) }
  })
  const pinch = track.pts.map((p) => len(sub(p[H.THUMB_TIP]!, p[H.INDEX_TIP]!)))
  const r = retarget(handsR, pinch, { ...DEFAULT_RETARGET, orientation: opt.orientation })

  // robot frame -> camera pixels (for colours of made-up objects)
  const robotToPixel = (q: V3): [number, number] | null => {
    // invert: robot -> world -> camera
    const c = Math.cos(placement.yaw)
    const s = Math.sin(placement.yaw)
    const w: V3 = [c * q[0] - s * q[1] + placement.x, s * q[0] + c * q[1] + placement.y, q[2]]
    const R = F.R
    const RT: M3 = [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]
    const pc = mv(RT, w)
    const cam: V3 = [pc[0] + F.o[0], pc[1] + F.o[1], pc[2] + F.o[2]]
    return cam[2] > 0.05 ? project(K, cam) : null
  }

  // 7. grasps (+ correction near contact)
  const minLen = Math.max(2, Math.round(0.25 / obs.dt))
  const ramp = Math.max(2, Math.round(0.6 / obs.dt))
  const closed = findGrasps(r.width, minLen)
  let made = 0
  const grasps = assistGrasps(r, objects, closed, opt.assist ? ramp : 1, DEFAULT_RETARGET.max_width, (at, pinchAt) => {
    if (!opt.assist || grid) return null // with depth the scene is seen; nothing there means a flat thing (cloth, paper)
    made++
    if (opt.drop?.includes(`obj_grasped${made > 1 ? `_${made}` : ''}`)) return null
    const w = Math.min(Math.max(pinchAt - 0.012, 0.025), 0.06)
    const h = Math.min(Math.max(2 * at[2], 0.03), 0.12)
    const px = robotToPixel([at[0], at[1], h / 2])
    const color = (px && obs.colorAt?.(px[0], px[1])) || [0.85, 0.45, 0.2]
    return { name: `obj_grasped${made > 1 ? `_${made}` : ''}`, label: 'grasped object', kind: 'block', x: at[0], y: at[1], yaw: Math.atan2(r.rot[0]![3], r.rot[0]![0]), w, d: w, h, color, inferred: true }
  })
  if (!opt.assist) {
    // still say which object each grasp was on, without moving anything
    for (const g of grasps) {
      const p = r.pos[g.start]!
      const o = objects.find((q) => Math.hypot(q.x - p[0], q.y - p[1]) < Math.max(0.07, q.w / 2 + 0.035))
      g.object = o?.name ?? null
    }
  }
  if (!closed.length) warnings.push('The hand never closes in the video, so the gripper only follows the motion.')

  // 8. table under everything, the video camera
  const xs = [...objects.flatMap((o) => [o.x - o.w, o.x + o.w]), ...r.pos.map((p) => p[0]), -0.2, 0.2]
  const ys = [...objects.flatMap((o) => [o.y - o.w, o.y + o.w]), ...r.pos.map((p) => p[1]), -0.2, 0.2]
  const pad = 0.15
  const [x0, x1, y0, y1] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad]
  const camera = mujocoCamera(F, placement, K)
  const task: TaskSpec = {
    name: '__video__', instruction: 'do what the hand does in the video', objects: objects.map(toSpec), keypoints: {},
    scene_context: '', success: [], min_object_separation: 0, seed_variation: false,
    table: {
      center: [(x0 + x1) / 2, (y0 + y1) / 2], half: [Math.max((x1 - x0) / 2, 0.35), Math.max((y1 - y0) / 2, 0.35)],
      ...(tableColor ? { rgba: [...tableColor, 1] as [number, number, number, number] } : {}),
    },
    cameras: [{ name: 'video', ...camera }],
  }
  const work = r.pos.reduce((a, p) => [a[0] + p[0] / r.pos.length, a[1] + p[1] / r.pos.length, 0.05] as V3, [0, 0, 0] as V3)

  return {
    task,
    trajectory: {
      dt: obs.dt, pos: r.pos, rot: r.rot.map((m) => [...m]), width: r.width, seen: track.seen, grasps,
    },
    report: {
      frames: span.length, seen: seenCount / span.length, depth: hasDepth, scene3d, objectsFrom, hand: label,
      pixels: objects.map((o) => robotToPixel([o.x, o.y, o.h / 2])), reachable: placement.reachable,
      placement, objects, grasps: grasps.map((g) => ({ object: g.object, start_s: g.start * obs.dt, end_s: g.end * obs.dt })), warnings,
    },
    overlay: obs.frames.map((f, i) => (i >= first && i <= last ? picked[i]?.image ?? null : null)),
    start: first,
    t_start: obs.t0 + first * obs.dt,
    path: r.pos,
    // an overview from in front of the robot, like the studio's default view
    view: { pos: [work[0] + 1.15, work[1] - 0.85, 0.95], target: [work[0] * 0.8, work[1] * 0.8, 0.12] },
    camera,
    K,
    backdrop: grid && obs.scene ? { ...backdropMesh(grid, (p) => RF.toRobot(toWorld(F, p)), obs.scene.skip, 6), image: obs.scene.image } : undefined,
  }
}

const hasDepthVideo = (obs: VideoObservations): boolean => !!obs.tableSamples && obs.tableSamples.length >= 30

const percentileOf = (xs: number[], p: number): number => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))] ?? 0
}

function toSpec(o: SceneObject): ObjectSpec {
  const base = { name: o.name, x_range: [o.x, o.x] as [number, number], y_range: [o.y, o.y] as [number, number], yaw_range: [o.yaw, o.yaw] as [number, number], color: o.color, size: o.w, lying: false }
  switch (o.kind) {
    case 'beaker':
      return { ...base, type: 'beaker', radius: Math.max(o.w / 2, 0.02), height: Math.max(o.h, 0.03), liquid: 0 }
    case 'cylinder':
      return { ...base, type: 'cylinder', dims: [Math.max(o.w / 2, 0.01), Math.max(o.h / 2, 0.01), 0] }
    case 'sphere':
      return { ...base, type: 'sphere', dims: [Math.max(o.w / 2, 0.01), 0, 0] }
    default:
      if (o.h < 0.012) return { ...base, type: 'block', decal: true, dims: [Math.max(o.w / 2, 0.01), Math.max(o.d / 2, 0.01), Math.max(o.h / 2, 0.001)] }
      return { ...base, type: 'block', dims: [Math.max(o.w / 2, 0.01), Math.max(o.d / 2, 0.01), Math.max(o.h / 2, 0.01)] }
  }
}

export { gripWidth }
