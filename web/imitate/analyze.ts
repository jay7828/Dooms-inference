/**
 * Read a video in the browser and collect what buildImitation needs: MediaPipe hand landmarks for every analysed
 * frame, MediaPipe objects in the first frame, and (with a depth video) depth at the hand and on the table.
 * MediaPipe Tasks (WASM + model files) is loaded from its CDN on first use.
 */
import type { Detection } from './geometry'
import type { FrameHand, HandLabel, VideoObservations } from './build'
import { alignDepth, sampleDepth, type Box, type DepthMap } from './scene'

const TRANSFORMERS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js'
const DEPTH_MODEL = 'onnx-community/depth-anything-v2-small'
/** frames with the hand whose depth is used to make the depth metric */
const ANCHOR_FRAMES = 10
/** frames combined into the clean plate */
const PLATE_FRAMES = 15

const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14'
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const OBJECT_MODEL = 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/1/efficientdet_lite2.tflite'
/** longest stretch of video analysed */
export const MAX_SECONDS = 60
/** analysis resolution: the long side is scaled down to this */
const MAX_SIDE = 960

interface Landmark { x: number; y: number; z: number }
interface Category { categoryName: string; score: number }
interface HandResult { landmarks: Landmark[][]; worldLandmarks: Landmark[][]; handedness?: Category[][]; handednesses?: Category[][] }
interface ObjectResult { detections: { boundingBox?: { originX: number; originY: number; width: number; height: number }; categories: Category[] }[] }
interface HandLandmarker { detectForVideo(img: CanvasImageSource, ts: number): HandResult; close?: () => void }
interface ObjectDetector { detect(img: CanvasImageSource): ObjectResult }
interface Vision {
  FilesetResolver: { forVisionTasks(path: string): Promise<unknown> }
  HandLandmarker: { createFromOptions(fs: unknown, o: Record<string, unknown>): Promise<HandLandmarker> }
  ObjectDetector: { createFromOptions(fs: unknown, o: Record<string, unknown>): Promise<ObjectDetector> }
}

let models: Promise<{ vision: Vision; fs: unknown; objects: ObjectDetector }> | null = null

async function create<T>(make: (delegate: 'GPU' | 'CPU') => Promise<T>): Promise<T> {
  try {
    return await make('GPU')
  } catch {
    return make('CPU') // no WebGL2 in this browser / tab
  }
}

/** Load MediaPipe (and the object detector) once per page. Hand trackers are made per video: VIDEO mode's clock only
 *  runs forward. */
export function loadModels(): Promise<{ vision: Vision; fs: unknown; objects: ObjectDetector }> {
  models ??= (async () => {
    const url = `${MP}/vision_bundle.mjs`
    const vision = (await import(/* @vite-ignore */ url)) as Vision
    const fs = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`)
    const objects = await create((delegate) => vision.ObjectDetector.createFromOptions(fs, {
      baseOptions: { modelAssetPath: OBJECT_MODEL, delegate }, runningMode: 'IMAGE', scoreThreshold: 0.22, maxResults: 15,
    }))
    return { vision, fs, objects }
  })().catch((e) => {
    models = null
    throw e
  })
  return models
}

export interface DepthInput {
  video: HTMLVideoElement
  /** metres at the darkest and the brightest grey level */
  near: number
  far: number
  /** true: bright pixels are near (most depth previews); false: bright is far */
  nearIsBright: boolean
}

export interface AnalyzeOptions {
  fps: number
  /** video time (s) to start from */
  start?: number
  /** seconds to analyse (at most MAX_SECONDS) */
  length?: number
  /** monocular depth for the scene (Depth Anything); off when a depth video is given */
  monoDepth?: boolean
  depth?: DepthInput | null
  onProgress?: (fraction: number, text: string) => void
  isCancelled?: () => boolean
}

interface Tensor { dims: number[]; data: Float32Array }
type DepthPipe = (img: unknown) => Promise<{ predicted_depth: Tensor }>
interface Transformers {
  env: { allowLocalModels: boolean }
  pipeline(task: string, model: string, o: Record<string, unknown>): Promise<DepthPipe>
  RawImage: { fromCanvas(c: HTMLCanvasElement): unknown }
}
let depthPipe: Promise<{ run: DepthPipe; T: Transformers }> | null = null
/** Depth Anything V2 (small) in the browser: WebGPU when there is one, WebAssembly otherwise. Loaded once. */
function loadDepth(): Promise<{ run: DepthPipe; T: Transformers }> {
  depthPipe ??= (async () => {
    const T = (await import(/* @vite-ignore */ TRANSFORMERS)) as Transformers
    T.env.allowLocalModels = false
    const gpu = typeof navigator !== 'undefined' && 'gpu' in navigator
    let run: DepthPipe
    try {
      run = await T.pipeline('depth-estimation', DEPTH_MODEL, gpu ? { device: 'webgpu', dtype: 'fp16' } : { device: 'wasm', dtype: 'q8' })
    } catch {
      run = await T.pipeline('depth-estimation', DEPTH_MODEL, { device: 'wasm', dtype: 'q8' })
    }
    return { run, T }
  })().catch((e) => {
    depthPipe = null
    throw e
  })
  return depthPipe
}
async function depthOf(canvas: HTMLCanvasElement): Promise<DepthMap> {
  const { run, T } = await loadDepth()
  // the model works at ~518 px; feed it a frame of about that size
  const k = Math.min(1, 518 / Math.max(canvas.width, canvas.height))
  const c = document.createElement('canvas')
  c.width = Math.round(canvas.width * k)
  c.height = Math.round(canvas.height * k)
  c.getContext('2d')!.drawImage(canvas, 0, 0, c.width, c.height)
  const out = await run(T.RawImage.fromCanvas(c))
  const t = out.predicted_depth
  const [h, w] = t.dims.slice(-2) as [number, number]
  return { w, h, data: Float32Array.from(t.data) }
}

/** Hand + forearm region of one detected hand (the arm runs from the wrist away from the fingers). */
function handRegion(img: [number, number][], W: number, H: number): Box {
  const xs = img.map((p) => p[0])
  const ys = img.map((p) => p[1])
  const L = Math.hypot(img[9]![0] - img[0]![0], img[9]![1] - img[0]![1])
  const dir = [(img[0]![0] - img[9]![0]) / (L || 1), (img[0]![1] - img[9]![1]) / (L || 1)]
  const ex = img[0]![0] + dir[0]! * L * 3
  const ey = img[0]![1] + dir[1]! * L * 3
  const pad = L * 0.5
  return [Math.max(0, Math.min(...xs, ex) - pad), Math.max(0, Math.min(...ys, ey) - pad), Math.min(W, Math.max(...xs, ex) + pad), Math.min(H, Math.max(...ys, ey) + pad)]
}

const seek = (v: HTMLVideoElement, t: number): Promise<void> =>
  new Promise((resolve, reject) => {
    if (Math.abs(v.currentTime - t) < 1e-4 && v.readyState >= 2) return resolve()
    const done = (): void => {
      v.removeEventListener('seeked', done)
      v.removeEventListener('error', fail)
      resolve()
    }
    const fail = (): void => {
      v.removeEventListener('seeked', done)
      reject(new Error('The video could not be read at this point.'))
    }
    v.addEventListener('seeked', done)
    v.addEventListener('error', fail, { once: true })
    v.currentTime = t
  })

export const whenReady = (v: HTMLVideoElement): Promise<void> =>
  new Promise((resolve, reject) => {
    if (v.readyState >= 2) return resolve()
    v.addEventListener('loadeddata', () => resolve(), { once: true })
    v.addEventListener('error', () => reject(new Error('This browser cannot play the video file (try MP4 / H.264).')), { once: true })
  })

/** MediaPipe's label. It matches the person's own hand in first-person video (camera at the head or chest); in a
 *  video of someone facing the camera it can be swapped, so the page also offers both hands explicitly. */
const personHand = (mp: string): HandLabel => (mp === 'Right' ? 'Right' : 'Left')

/** Grey level -> metres sampler over one depth frame (median of a 5x5 patch, 0 = no reading). */
function depthSampler(img: ImageData, d: DepthInput): (u: number, v: number) => number | null {
  const { width, height, data } = img
  return (u, v) => {
    const vals: number[] = []
    const x0 = Math.round(u)
    const y0 = Math.round(v)
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const x = x0 + dx * 2
        const y = y0 + dy * 2
        if (x < 0 || y < 0 || x >= width || y >= height) continue
        const g = data[(y * width + x) * 4]!
        if (g > 0) vals.push(g)
      }
    if (vals.length < 5) return null
    vals.sort((a, b) => a - b)
    const g = vals[vals.length >> 1]! / 255
    return d.nearIsBright ? d.far - g * (d.far - d.near) : d.near + g * (d.far - d.near)
  }
}

export async function analyzeVideo(video: HTMLVideoElement, opts: AnalyzeOptions): Promise<VideoObservations> {
  const progress = opts.onProgress ?? (() => undefined)
  progress(0, 'Loading hand tracking')
  await whenReady(video)
  const { vision, fs, objects } = await loadModels()
  const hands = await create((delegate) => vision.HandLandmarker.createFromOptions(fs, {
    baseOptions: { modelAssetPath: HAND_MODEL, delegate }, runningMode: 'VIDEO', numHands: 2,
    minHandDetectionConfidence: 0.4, minHandPresenceConfidence: 0.4, minTrackingConfidence: 0.4,
  }))

  const k = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight))
  const W = Math.round(video.videoWidth * k)
  const H = Math.round(video.videoHeight * k)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const dctx = opts.depth ? (() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c.getContext('2d', { willReadFrequently: true })!
  })() : null
  if (opts.depth) await whenReady(opts.depth.video)

  const start = Math.min(Math.max(opts.start ?? 0, 0), Math.max(0, (video.duration || 0) - 0.5))
  const duration = Math.min((video.duration || 0) - start, MAX_SECONDS, opts.length ?? MAX_SECONDS)
  if (!(duration > 0.3)) throw new Error('The video is too short.')
  const dt = 1 / opts.fps
  const n = Math.max(2, Math.floor(duration / dt))
  const frames: FrameHand[][] = []
  let detections: VideoObservations['detections'] = []
  let tableSamples: [number, number, number][] | undefined
  let first: ImageData | null = null
  const plate: { img: ImageData; boxes: Box[] }[] = []
  const plateEvery = opts.monoDepth !== false && !opts.depth ? Math.max(1, Math.floor((n * 0.7) / PLATE_FRAMES)) : 0
  const wasPaused = video.paused
  video.pause()

  const detectAt = new Set([0, Math.round(0.5 / dt), Math.round(1 / dt)].filter((k) => k < n))
  for (let i = 0; i < n; i++) {
    if (opts.isCancelled?.()) throw new Error('cancelled')
    const t = start + Math.min(i * dt, duration - 0.02)
    await seek(video, t)
    ctx.drawImage(video, 0, 0, W, H)
    let depthAt: ((u: number, v: number) => number | null) | null = null
    if (opts.depth && dctx) {
      const dv = opts.depth.video
      await seek(dv, Math.min((t * (dv.duration || video.duration)) / (video.duration || 1), (dv.duration || video.duration) - 0.02))
      dctx.drawImage(dv, 0, 0, W, H)
      depthAt = depthSampler(dctx.getImageData(0, 0, W, H), opts.depth)
    }
    const res = hands.detectForVideo(canvas, Math.round(t * 1000) + 1)
    const labels = res.handedness ?? res.handednesses ?? []
    const seen: FrameHand[] = res.landmarks.map((lm, h) => {
      const image = lm.map((p) => [p.x * W, p.y * H] as [number, number])
      return {
        image,
        world: res.worldLandmarks[h]!.map((p) => [p.x, p.y, p.z] as [number, number, number]),
        label: personHand(labels[h]?.[0]?.categoryName ?? 'Left'),
        score: labels[h]?.[0]?.score ?? 0.5,
        depth: depthAt ? image.map(([u, v]) => depthAt!(u, v)) : undefined,
      }
    })
    frames.push(seen)

    if (detectAt.has(i)) {
      // objects: the first frame, plus a few early ones (a hand may cover something at the start); same thing = overlap
      const img = ctx.getImageData(0, 0, W, H)
      if (i === 0) first = img
      for (const d of objects.detect(canvas).detections) {
        const b = d.boundingBox
        const c = d.categories[0]
        if (!b || !c) continue
        const box: [number, number, number, number] = [b.originX, b.originY, b.width, b.height]
        const det = { label: c.categoryName, score: c.score, box, color: meanColor(img, box), depth: depthAt ? boxDepth(depthAt, box) : null } satisfies Detection & { depth: number | null }
        const same = detections.findIndex((o) => iou(o.box, box) > 0.3)
        if (same < 0) detections.push(det)
        else if (i === 0 && det.score > detections[same]!.score) detections[same] = det
      }
    }
    if (i === 0) {
      if (depthAt) {
        // table samples: a grid over the frame, away from the hands
        const handBoxes = seen.map((h) => bbox(h.image, 20))
        tableSamples = []
        for (let gy = 0; gy < 24; gy++)
          for (let gx = 0; gx < 32; gx++) {
            const u = ((gx + 0.5) / 32) * W
            const v = ((gy + 0.5) / 24) * H
            if (handBoxes.some(([x0, y0, x1, y1]) => u >= x0 && u <= x1 && v >= y0 && v <= y1)) continue
            const d = depthAt(u, v)
            if (d !== null && d > 0.1 && d < 6) tableSamples.push([u, v, d])
          }
      }
    }
    // frames for the clean plate (the static background without hands): spread over the first 70%
    if (plateEvery > 0 && i % plateEvery === 0 && i < n * 0.7 && plate.length < PLATE_FRAMES)
      plate.push({ img: ctx.getImageData(0, 0, W, H), boxes: seen.map((h) => handRegion(h.image, W, H)) })
    if (i % 3 === 0) progress((i + 1) / n, `Tracking the hand · ${Math.round(((i + 1) / n) * 100)}%`)
  }
  hands.close?.()

  // monocular depth: a reference frame with as little hand in it as possible (early: before things move), and a few
  // frames with the hand, aligned to it, for the scale
  let scene: VideoObservations['scene']
  let img = first
  if (opts.monoDepth !== false && !opts.depth) {
    try {
      progress(0, 'Loading the depth model')
      const regions = frames.map((f) => f.map((h) => handRegion(h.image, W, H)))
      const area = (bs: Box[]): number => bs.reduce((a, b) => a + (b[2] - b[0]) * (b[3] - b[1]), 0)
      let ref = 0
      for (let i = 0; i < Math.max(1, Math.floor(n * 0.4)); i++) if (area(regions[i]!) < area(regions[ref]!) - 1) ref = i
      // the camera does not move: a per-pixel median over frames, each pixel taken only from frames where no hand covers
      // it, is the scene without hands. It falls back to the least-covered frame where hands never left.
      progress(0, 'Removing the hands from the background')
      await seek(video, start + Math.min(ref * dt, duration - 0.02))
      ctx.drawImage(video, 0, 0, W, H)
      const refFrame = ctx.getImageData(0, 0, W, H)
      const still = plate.length >= 3 && cameraIsStill(plate, refFrame, regions[ref]!)
      const { image: refImg, covered } = still ? cleanPlate(plate, refFrame, regions[ref]!) : { image: refFrame, covered: regions[ref]! }
      ctx.putImageData(refImg, 0, 0)
      const refDepth = await depthOf(canvas)
      img = refImg
      if (true)
        for (const d of objects.detect(canvas).detections) {
          const b = d.boundingBox
          const c = d.categories[0]
          if (!b || !c) continue
          const box: [number, number, number, number] = [b.originX, b.originY, b.width, b.height]
          if (!detections.some((o) => iou(o.box, box) > 0.3)) detections.push({ label: c.categoryName, score: c.score, box, color: meanColor(refImg, box), depth: null })
        }
      // a moving camera sees a different background in other frames: only frames close to the reference can be aligned
      const withHand = frames.map((f, i) => (f.length && (still || Math.abs(i - ref) * dt <= 1.0) ? i : -1)).filter((i) => i >= 0)
      const picks = [...new Set(Array.from({ length: Math.min(ANCHOR_FRAMES, withHand.length) }, (_, k) => withHand[Math.floor(((k + 0.5) * withHand.length) / Math.min(ANCHOR_FRAMES, withHand.length))]!))]
      const anchors: NonNullable<VideoObservations['scene']>['anchors'] = []
      for (const [k, i] of picks.entries()) {
        progress((k + 1) / (picks.length + 1), `Measuring depth · ${k + 1}/${picks.length}`)
        await seek(video, start + Math.min(i * dt, duration - 0.02))
        ctx.drawImage(video, 0, 0, W, H)
        const D = await depthOf(canvas)
        const { alpha, beta } = alignDepth(D, refDepth, [...regions[i]!, ...covered], W, H)
        for (const h of frames[i]!) anchors.push({ frame: i, label: h.label, d: h.image.map(([u, v]) => {
          const x = sampleDepth(D, u, v, W, H)
          return x === null ? null : alpha * x + beta
        }) })
      }
      const jpg = document.createElement('canvas')
      jpg.width = W
      jpg.height = H
      jpg.getContext('2d')!.putImageData(refImg, 0, 0)
      scene = { frame: ref, depth: refDepth, image: jpg.toDataURL('image/jpeg', 0.85), skip: [...covered, ...letterbox(refImg)], anchors }
    } catch (e) {
      console.warn('monocular depth unavailable:', e)
    }
  }

  progress(1, 'Rebuilding the scene')
  if (!wasPaused) void video.play()
  const im = img
  return {
    width: W, height: H, dt, t0: start, frames, detections, tableSamples, scene,
    colorAt: im ? (u, v) => {
      const x = Math.round(u)
      const y = Math.round(v)
      if (x < 0 || y < 0 || x >= im.width || y >= im.height) return null
      const o = (y * im.width + x) * 4
      return [im.data[o]! / 255, im.data[o + 1]! / 255, im.data[o + 2]! / 255]
    } : undefined,
  }
}

/** Whether the camera stands still: the background (outside hands) barely changes between the sampled frames. */
function cameraIsStill(frames: { img: ImageData; boxes: Box[] }[], ref: ImageData, refBoxes: Box[]): boolean {
  const { width: W, height: H } = ref
  const diffs: number[] = []
  for (const f of frames) {
    let sum = 0, n = 0
    for (let y = 4; y < H; y += 9)
      for (let x = 4; x < W; x += 9) {
        if ([...f.boxes, ...refBoxes].some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1)) continue
        const o = (y * W + x) * 4
        sum += Math.abs(f.img.data[o]! - ref.data[o]!) + Math.abs(f.img.data[o + 1]! - ref.data[o + 1]!) + Math.abs(f.img.data[o + 2]! - ref.data[o + 2]!)
        n++
      }
    if (n > 50) diffs.push(sum / n / 3)
  }
  diffs.sort((a, b) => a - b)
  return diffs.length > 0 && diffs[diffs.length >> 1]! < 12 // grey levels; a panning camera is far above this
}

/**
 * Clean plate of a static camera: per pixel, the median of the frames where no hand box covers it. Pixels covered
 * in every frame keep the reference frame's colour; their bounding box is returned as still covered.
 */
function cleanPlate(frames: { img: ImageData; boxes: Box[] }[], ref: ImageData, refBoxes: Box[]): { image: ImageData; covered: Box[] } {
  const { width: W, height: H } = ref
  const out = new ImageData(W, H)
  const masks = frames.map((f) => {
    const m = new Uint8Array(W * H)
    for (const [x0, y0, x1, y1] of f.boxes)
      for (let y = Math.max(0, y0 | 0); y < Math.min(H, Math.ceil(y1)); y++) m.fill(1, y * W + Math.max(0, x0 | 0), y * W + Math.min(W, Math.ceil(x1)))
    return m
  })
  let cx0 = W, cy0 = H, cx1 = -1, cy1 = -1
  const r: number[] = [], g: number[] = [], b: number[] = []
  for (let p = 0; p < W * H; p++) {
    r.length = g.length = b.length = 0
    for (let k = 0; k < frames.length; k++) {
      if (masks[k]![p]) continue
      const d = frames[k]!.img.data
      r.push(d[p * 4]!)
      g.push(d[p * 4 + 1]!)
      b.push(d[p * 4 + 2]!)
    }
    const o = p * 4
    if (!r.length) {
      out.data[o] = ref.data[o]!
      out.data[o + 1] = ref.data[o + 1]!
      out.data[o + 2] = ref.data[o + 2]!
      const x = p % W, y = (p / W) | 0
      if (refBoxes.some(([a0, b0, a1, b1]) => x >= a0 && x <= a1 && y >= b0 && y <= b1)) {
        cx0 = Math.min(cx0, x); cy0 = Math.min(cy0, y); cx1 = Math.max(cx1, x); cy1 = Math.max(cy1, y)
      }
    } else {
      r.sort((x, y) => x - y); g.sort((x, y) => x - y); b.sort((x, y) => x - y)
      out.data[o] = r[r.length >> 1]!
      out.data[o + 1] = g[g.length >> 1]!
      out.data[o + 2] = b[b.length >> 1]!
    }
    out.data[o + 3] = 255
  }
  return { image: out, covered: cx1 >= 0 ? [[cx0, cy0, cx1, cy1]] : [] }
}

/** Black bars around the picture (letterbox / pillarbox): rows and columns at the edges that are almost black. */
function letterbox(img: ImageData): Box[] {
  const { width: W, height: H, data } = img
  const dark = (x0: number, y0: number, x1: number, y1: number): boolean => {
    let sum = 0, n = 0
    for (let y = y0; y < y1; y += 2)
      for (let x = x0; x < x1; x += 2) {
        const o = (y * W + x) * 4
        sum += data[o]! + data[o + 1]! + data[o + 2]!
        n++
      }
    return n > 0 && sum / n / 3 < 14
  }
  const out: Box[] = []
  let l = 0
  while (l < W / 3 && dark(l, 0, l + 2, H)) l += 2
  let r = W
  while (r > (2 * W) / 3 && dark(r - 2, 0, r, H)) r -= 2
  let t = 0
  while (t < H / 3 && dark(0, t, W, t + 2)) t += 2
  let b = H
  while (b > (2 * H) / 3 && dark(0, b - 2, W, b)) b -= 2
  if (l > 0) out.push([0, 0, l + 4, H])
  if (r < W) out.push([r - 4, 0, W, H])
  if (t > 0) out.push([0, 0, W, t + 4])
  if (b < H) out.push([0, b - 4, W, H])
  return out
}

function iou(a: [number, number, number, number], b: [number, number, number, number]): number {
  const x0 = Math.max(a[0], b[0])
  const y0 = Math.max(a[1], b[1])
  const x1 = Math.min(a[0] + a[2], b[0] + b[2])
  const y1 = Math.min(a[1] + a[3], b[1] + b[3])
  const inter = Math.max(0, x1 - x0) * Math.max(0, y1 - y0)
  return inter / Math.max(1e-6, a[2] * a[3] + b[2] * b[3] - inter)
}

function bbox(pts: [number, number][], pad: number): [number, number, number, number] {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad]
}

/** Mean colour of the middle 40% of a box (the object, not the background around it). */
function meanColor(img: ImageData, [x, y, w, h]: [number, number, number, number]): [number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let yy = Math.round(y + h * 0.3); yy < y + h * 0.7; yy += 2)
    for (let xx = Math.round(x + w * 0.3); xx < x + w * 0.7; xx += 2) {
      if (xx < 0 || yy < 0 || xx >= img.width || yy >= img.height) continue
      const o = (yy * img.width + xx) * 4
      r += img.data[o]!
      g += img.data[o + 1]!
      b += img.data[o + 2]!
      n++
    }
  return n ? [r / n / 255, g / n / 255, b / n / 255] : [0.6, 0.6, 0.6]
}

function boxDepth(at: (u: number, v: number) => number | null, [x, y, w, h]: [number, number, number, number]): number | null {
  const ds: number[] = []
  for (let i = -2; i <= 2; i++)
    for (let j = -2; j <= 2; j++) {
      const d = at(x + w * (0.5 + i * 0.08), y + h * (0.55 + j * 0.08))
      if (d !== null && d > 0.05) ds.push(d)
    }
  if (ds.length < 6) return null
  ds.sort((a, b) => a - b)
  return ds[ds.length >> 1]!
}
