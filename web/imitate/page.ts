/**
 * Video -> robot page (static/imitate.html): upload a video of a hand doing a task, rebuild the scene in MuJoCo, place
 * a Franka where the person was, and have it repeat the motion. Everything runs in this browser tab: MediaPipe for
 * the hand and objects, the Dooms engine worker (MuJoCo WASM) for the simulation.
 */
import { LocalSession, localEngineSupported } from '../engine/client'
import type { ImitationResult } from '../engine/imitation'
import type { SceneData } from '../types'
import { MAX_SECONDS, analyzeVideo, type DepthInput } from './analyze'
import { reviewScene, type SceneReview } from './review'
import type { LLM } from '../engine/llm'
import { DEFAULT_BUILD, buildImitation, type BuildOptions, type Built, type VideoObservations } from './build'

interface Viewer {
  ready: boolean
  buildScene(sc: SceneData): void
  applyPoses(p: Float32Array): void
  setDefaultView(v: { pos: number[]; target: number[] } | null): void
  resetView(): void
  showPath(points: number[][], color?: number): void
  setPathVisible(on: boolean): void
  setBackdrop(b: Built['backdrop'] | null): void
  setBackdropVisible(on: boolean): void
}
const viewerUrl = '/static/viewer.js'
const { createViewer } = (await import(/* @vite-ignore */ viewerUrl)) as { createViewer: (c: HTMLCanvasElement, s: HTMLElement) => Viewer }

const $ = <T extends HTMLElement = HTMLElement>(s: string): T => document.querySelector(s) as T
const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const ICON = {
  check: '<svg class="i" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  alert: '<svg class="i" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  x: '<svg class="i" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  play: '<svg class="i" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  stop: '<svg class="i" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
}
const HAND_EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]]

const video = $<HTMLVideoElement>('#video')
const depthVideo = $<HTMLVideoElement>('#depth-video')
const marks = $<HTMLCanvasElement>('#marks')
const V = createViewer($<HTMLCanvasElement>('#gl'), $('#stage'))

const S = {
  engine: null as LocalSession | null,
  ready: false,
  hasVideo: false,
  hasDepth: false,
  obs: null as VideoObservations | null,
  built: null as Built | null,
  /** analysis inputs changed since the last analysis */
  stale: false,
  analyzing: false,
  running: false,
  /** motion speed: the robot does the task this much faster than the person (the video plays at the same rate) */
  speed: 0.5,
  drop: [] as string[],
  frameUrl: '',
  tEnd: 0,
  /** last frame of the robot camera (the rebuild from the video camera) */
  lastFrame: null as Blob | null,
  review: null as SceneReview | null,
  /** build from Claude's description of the scene instead of the depth objects */
  useClaude: false,
  asking: false,
}

function toast(kind: 'err' | 'ok' | 'info', title: string, msg = '', ms = 6000): void {
  const el = document.createElement('div')
  el.className = `toast ${kind}`
  el.innerHTML = `${kind === 'err' ? ICON.alert : ICON.check}<div><b>${esc(title)}</b>${msg ? `<span>${esc(msg)}</span>` : ''}</div>`
  $('#toasts').appendChild(el)
  setTimeout(() => el.remove(), ms)
}
function seg(root: HTMLElement, onchange: (v: string) => void): { get(): string; set(v: string): void } {
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button[data-value]') as HTMLButtonElement | null
    if (!b || b.disabled) return
    root.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b))
    onchange(b.dataset.value!)
  })
  return {
    get: () => (root.querySelector('button.on') as HTMLButtonElement | null)?.dataset.value ?? '',
    set: (v) => root.querySelectorAll('button').forEach((x) => x.classList.toggle('on', (x as HTMLButtonElement).dataset.value === v)),
  }
}

// ---------------------------------------------------------------- options
const segHand = seg($('#o-hand'), () => rebuildSoon())
const segOrient = seg($('#o-orient'), () => rebuildSoon())
const segFps = seg($('#o-fps'), () => markStale())
const segLen = seg($('#o-len'), () => markStale())
seg($('#speed'), (v) => (S.speed = Number(v)))
for (const id of ['#o-fov', '#o-tilt']) $(id).addEventListener('change', () => rebuildSoon())
$('#o-assist').addEventListener('change', () => rebuildSoon())
for (const id of ['#d-near', '#d-far', '#d-bright']) $(id).addEventListener('change', () => S.hasDepth && markStale())

const num = (id: string, lo: number, hi: number, dflt: number): number => {
  const v = Number(($(id) as HTMLInputElement).value)
  return Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : dflt
}
function buildOptions(): BuildOptions {
  return {
    ...DEFAULT_BUILD,
    hfov: num('#o-fov', 30, 130, DEFAULT_BUILD.hfov),
    tilt: num('#o-tilt', 0, 90, DEFAULT_BUILD.tilt),
    hand: segHand.get() as BuildOptions['hand'],
    orientation: segOrient.get() as BuildOptions['orientation'],
    assist: ($('#o-assist') as HTMLInputElement).checked,
    drop: S.drop,
    llm: S.useClaude && S.review ? S.review.objects : null,
  }
}
function depthInput(): DepthInput | null {
  if (!S.hasDepth) return null
  const near = num('#d-near', 0, 20, 0.2)
  const far = Math.max(num('#d-far', 0.1, 50, 1.5), near + 0.05)
  return { video: depthVideo, near, far, nearIsBright: ($('#d-bright') as HTMLInputElement).checked }
}
function markStale(): void {
  if (!S.obs) return
  S.stale = true
  renderButtons()
}

// ---------------------------------------------------------------- engine
function startEngine(): void {
  if (!localEngineSupported()) {
    toast('err', 'This browser cannot run the simulator', 'It needs WebAssembly and module workers.')
    return
  }
  const conn = $('#conn')
  S.engine = new LocalSession({
    base: '/static',
    onReady: () => {
      S.ready = true
      conn.classList.add('on')
      conn.title = 'Simulator ready (runs in your browser)'
      renderButtons()
    },
    onFatal: (m) => {
      conn.classList.remove('on')
      toast('err', 'The simulator stopped', m, 12000)
    },
    onEvent: onEvent,
    onPose: (_t, poses) => {
      if (V.ready) V.applyPoses(poses)
    },
    onFrame: (blob) => {
      S.lastFrame = blob
      const url = URL.createObjectURL(blob)
      const img = $<HTMLImageElement>('#robot')
      img.src = url
      $('#rempty').hidden = true
      if (($('#blend') as HTMLInputElement).checked) $<HTMLImageElement>('#blend-img').src = url
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    },
  })
  S.engine.start()
}

function onEvent(ev: Record<string, unknown>): void {
  switch (ev.type) {
    case 'imitate_clock':
      void playVideoFrom(S.built?.t_start ?? 0)
      break
    case 'imitate_progress': {
      const t = Number(ev.t)
      $('#pill').textContent = `t = ${t.toFixed(1)} s · ${(Number(ev.err) * 1000).toFixed(0)} mm`
      const want = (S.built?.t_start ?? 0) + t * S.speed // robot time -> video time
      if (!video.paused && Math.abs(video.currentTime - want) > 0.3) video.currentTime = want // keep the video with the sim
      break
    }
    case 'imitate_done':
      showResult(ev.result as ImitationResult)
      break
    case 'stopped':
      video.pause()
      break
    case 'ended':
      S.running = false
      video.pause()
      renderButtons()
      break
    case 'error':
      S.running = false
      renderButtons()
      toast('err', 'Run failed', String(ev.message ?? ''), 12000)
      break
  }
}

// ---------------------------------------------------------------- input files
function loadVideo(file: File): void {
  if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v|mkv)$/i.test(file.name)) {
    toast('err', 'Not a video', file.name)
    return
  }
  video.src = URL.createObjectURL(file)
  video.load()
  S.hasVideo = true
  S.obs = null
  S.built = null
  S.drop = []
  $('#drop').classList.add('loaded')
  $('#drop-title').textContent = file.name
  $('#drop-sub').textContent = 'Change'
  $('#vempty').hidden = true
  $('#summary').hidden = true
  $('#run-row').hidden = true
  $('#result').className = 'result'
  video.addEventListener('error', () => {
    S.hasVideo = false
    $('#drop-sub').textContent = 'Cannot play this file'
    toast('err', 'This browser cannot play the video', 'Use an MP4 with H.264 (most phones record this). Older MPEG-4 Part 2 and some HEVC files do not play in Chrome.', 12000)
    renderButtons()
  }, { once: true })
  video.addEventListener('loadedmetadata', () => {
    $('#drop-sub').textContent = `${video.videoWidth}×${video.videoHeight} · ${video.duration.toFixed(1)} s${video.duration > MAX_SECONDS ? ` (up to ${MAX_SECONDS} s used)` : ''} · change`
    sizeMarks()
  }, { once: true })
  renderButtons()
}
$('#file').addEventListener('change', (e) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) loadVideo(f)
})
const drop = $('#drop')
drop.addEventListener('dragover', (e) => {
  e.preventDefault()
  drop.classList.add('over')
})
drop.addEventListener('dragleave', () => drop.classList.remove('over'))
drop.addEventListener('drop', (e) => {
  e.preventDefault()
  drop.classList.remove('over')
  const f = e.dataTransfer?.files?.[0]
  if (f) loadVideo(f)
})
$('#depth-file').addEventListener('change', (e) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  depthVideo.src = URL.createObjectURL(f)
  depthVideo.load()
  S.hasDepth = true
  $('#depth-btn').textContent = f.name
  $('#depth-clear').hidden = false
  $('#row-tilt').hidden = true
  markStale()
})
$('#depth-clear').addEventListener('click', () => {
  depthVideo.removeAttribute('src')
  depthVideo.load()
  S.hasDepth = false
  $('#depth-btn').textContent = 'Choose depth video'
  $('#depth-clear').hidden = true
  $('#row-tilt').hidden = false
  ;($('#depth-file') as HTMLInputElement).value = ''
  markStale()
})

// ---------------------------------------------------------------- analyse + rebuild
async function analyze(): Promise<void> {
  if (!S.hasVideo || S.analyzing || S.running) return
  S.analyzing = true
  renderButtons()
  const bar = $('#progress')
  bar.hidden = false
  const set = (f: number, text: string): void => {
    $('#progress-bar').style.width = `${Math.round(f * 100)}%`
    $('#progress-text').textContent = text
  }
  try {
    // start where the video is paused (scrub to the part to copy); the start of the file otherwise
    const at = video.currentTime > 0.3 && video.currentTime < video.duration - 1 ? video.currentTime : 0
    S.obs = await analyzeVideo(video, { fps: Number(segFps.get() || 15), depth: depthInput(), start: at, length: Number(segLen.get() || 30), onProgress: set })
    S.stale = false
    S.drop = []
    S.review = null
    S.useClaude = false
    renderReview()
    await rebuild()
  } catch (e) {
    toast('err', 'Could not analyse the video', e instanceof Error ? e.message : String(e), 12000)
  } finally {
    S.analyzing = false
    bar.hidden = true
    renderButtons()
  }
}

let rebuildTimer = 0
function rebuildSoon(): void {
  if (!S.obs) return
  clearTimeout(rebuildTimer)
  rebuildTimer = window.setTimeout(() => void rebuild().catch((e) => toast('err', 'Could not rebuild the scene', e instanceof Error ? e.message : String(e))), 150)
}

async function rebuild(): Promise<void> {
  if (!S.obs || S.running) return
  const built = buildImitation(S.obs, buildOptions())
  S.built = built
  renderSummary(built)
  if (!S.engine || !S.ready) throw new Error('The simulator is still starting.')
  const sc = await S.engine.imitationScene(built.task, 'franka')
  V.setDefaultView({ pos: built.view.pos, target: built.view.target })
  V.buildScene(sc)
  V.showPath(built.path)
  V.setBackdrop(built.backdrop ?? null)
  $('#btn-photo').hidden = !built.backdrop
  $('#empty').hidden = true
  $('#run-row').hidden = false
  $('#result').className = 'result'
  S.tEnd = built.t_start + (built.trajectory.pos.length - 1) * built.trajectory.dt
  S.engine.send({ type: 'imitate_reset', frame: frameSize() })
  video.currentTime = built.t_start
  drawMarks()
  renderButtons()
}

const frameSize = (): [number, number] => {
  const w = S.obs?.width ?? 640
  const h = S.obs?.height ?? 480
  return [480, Math.round((480 * h) / w)]
}

// ---------------------------------------------------------------- summary
function renderSummary(b: Built): void {
  const r = b.report
  const pct = (x: number): string => `${Math.round(x * 100)}%`
  const rows: [string, string, boolean][] = [
    [`${r.hand} hand tracked`, pct(r.seen), r.seen > 0.7],
    ['Table and objects', r.scene3d, r.scene3d !== 'camera tilt'],
    [r.depth ? 'Hand 3D from depth' : 'Hand 3D from its size', `${buildOptions().hfov}° lens`, true],
    ['Robot placed', `reach ${pct(r.reachable)}`, r.reachable > 0.85],
    (() => {
      const on = r.grasps.filter((g) => g.object)
      const names = [...new Set(on.map((g) => g.object!.replace(/^obj_/, '').replace(/_/g, ' ')))].join(', ')
      return on.length
        ? [on.length === 1 ? '1 grasp' : `${on.length} grasps`, names, true] as [string, string, boolean]
        : [r.grasps.length ? `${r.grasps.length} pinches, no object` : 'No grasps', '', r.grasps.length > 0] as [string, string, boolean]
    })(),
  ]
  $('#checks').innerHTML = rows.map(([t, v, ok], i) => `<li class="${ok ? '' : 'warn'}">${ok ? ICON.check : ICON.alert}<b>${esc(t)}</b>${i === 0 ? `<button class="link swap" id="swap-hand" type="button">other hand</button>` : ''}<span class="v">${esc(v)}</span></li>`).join('')
  $('#swap-hand').addEventListener('click', () => {
    if (S.running) return
    segHand.set(r.hand === 'Right' ? 'Left' : 'Right')
    rebuildSoon()
  })
  $('#warnings').innerHTML = r.warnings.map((w) => `<div class="callout warn">${ICON.alert}<div>${esc(w)}</div></div>`).join('')
  $('#obj-count').textContent = String(r.objects.length)
  $('#objects').innerHTML = r.objects.length
    ? r.objects.map((o) => {
      const rgb = o.color.map((c) => Math.round(c * 255)).join(',')
      const size = `${Math.round(o.w * 100)}×${Math.round(o.h * 100)} cm`
      return `<div class="obj"><i class="sw" style="background:rgb(${rgb})"></i><span class="nm">${esc(o.name.replace(/^obj_/, '').replace(/_/g, ' '))}</span>${o.grasped ? '<span class="tag">grasped</span>' : ''}<span class="sz">${size}</span><button class="btn ghost icon" data-drop="${esc(o.name)}" title="Remove">${ICON.x}</button></div>`
    }).join('')
    : '<div class="empty-note">None found. Grasped objects are added from the hand.</div>'
  $('#summary').hidden = false
}
$('#objects').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button[data-drop]') as HTMLButtonElement | null
  if (!b || S.running) return
  S.drop = [...S.drop, b.dataset.drop!]
  rebuildSoon()
})

function showResult(r: ImitationResult): void {
  const el = $('#result')
  const real = r.grasps.filter((g) => g.object) // pinches on nothing (cloth, paper) are not pick-ups
  const lifted = real.filter((g) => g.lifted).length
  const good = r.tracked > 0.8 && (real.length === 0 || lifted === real.length)
  el.className = `result show ${good ? 'ok' : 'neutral'}`
  el.innerHTML = `${good ? ICON.check : ICON.alert}<div style="flex:1"><b>${good ? 'Done' : 'Done, with differences'}</b>
    <div class="metrics">
      <div class="metric"><div class="v">${Math.round(r.tracked * 100)}%</div><div class="l">within 2 cm</div></div>
      <div class="metric"><div class="v">${(r.err_mean * 1000).toFixed(0)} mm</div><div class="l">mean error</div></div>
      <div class="metric"><div class="v">${real.length ? `${lifted}/${real.length}` : '–'}</div><div class="l">picked up</div></div>
      <div class="metric"><div class="v">${r.duration_s.toFixed(1)} s</div><div class="l">motion</div></div>
    </div></div>`
}

// ---------------------------------------------------------------- run
function run(): void {
  if (!S.built || !S.engine || S.running) return
  S.running = true
  renderButtons()
  $('#result').className = 'result'
  video.pause()
  video.currentTime = S.built.t_start
  // slow the motion itself down (a robot is slower than a hand); the sim runs in real time and the video follows
  const trajectory = { ...S.built.trajectory, dt: S.built.trajectory.dt / S.speed }
  S.engine.send({ type: 'imitate_run', trajectory, speed: 1, frame: frameSize() })
}
function stop(): void {
  S.engine?.send({ type: 'stop' })
  video.pause()
}
async function playVideoFrom(t: number): Promise<void> {
  video.currentTime = t
  video.playbackRate = S.speed
  try {
    await video.play()
  } catch {
    /* autoplay blocked: the sim still runs */
  }
}

function renderButtons(): void {
  const analyzeBtn = $<HTMLButtonElement>('#analyze')
  analyzeBtn.disabled = !S.hasVideo || S.analyzing || S.running || !S.ready
  analyzeBtn.textContent = S.analyzing ? 'Analyzing…' : S.obs && !S.stale ? 'Analyze again' : 'Analyze'
  analyzeBtn.classList.toggle('primary', !S.obs || S.stale)
  const runBtn = $<HTMLButtonElement>('#run')
  runBtn.disabled = !S.built || S.analyzing
  runBtn.innerHTML = S.running ? `${ICON.stop}<span>Stop</span>` : `${ICON.play}<span>Run</span>`
  runBtn.classList.toggle('danger', S.running)
  runBtn.classList.toggle('primary', !S.running)
  $<HTMLButtonElement>('#reset').disabled = S.running || !S.built
  $<HTMLButtonElement>('#ask').disabled = !S.built || S.running || S.asking || S.analyzing
}
$('#analyze').addEventListener('click', () => void analyze())
$('#run').addEventListener('click', () => (S.running ? stop() : run()))
$('#reset').addEventListener('click', () => {
  if (S.running || !S.built) return
  S.engine?.send({ type: 'imitate_reset', frame: frameSize() })
  video.pause()
  video.currentTime = S.built.t_start
  $('#result').className = 'result'
})
$('#btn-view').addEventListener('click', () => V.resetView())
$('#btn-photo').addEventListener('click', (e) => {
  const b = e.currentTarget as HTMLElement
  b.classList.toggle('on')
  V.setBackdropVisible(b.classList.contains('on'))
})
$('#btn-path').addEventListener('click', (e) => {
  const b = e.currentTarget as HTMLElement
  b.classList.toggle('on')
  V.setPathVisible(b.classList.contains('on'))
})
$('#blend').addEventListener('change', (e) => {
  const on = (e.target as HTMLInputElement).checked
  const img = $<HTMLImageElement>('#blend-img')
  img.hidden = !on
  if (on) img.src = $<HTMLImageElement>('#robot').src
})

// ---------------------------------------------------------------- video overlay (hand + objects)
function sizeMarks(): void {
  const r = $('#vwrap').getBoundingClientRect()
  const dpr = Math.min(devicePixelRatio || 1, 2)
  marks.width = Math.round(r.width * dpr)
  marks.height = Math.round(r.height * dpr)
  drawMarks()
}
new ResizeObserver(sizeMarks).observe($('#vwrap'))

function drawMarks(): void {
  const g = marks.getContext('2d')!
  g.clearRect(0, 0, marks.width, marks.height)
  const obs = S.obs
  const b = S.built
  if (!obs || !b) return
  // where the video's pixels are inside the (object-fit: contain) box
  const k = Math.min(marks.width / obs.width, marks.height / obs.height)
  const ox = (marks.width - obs.width * k) / 2
  const oy = (marks.height - obs.height * k) / 2
  const X = (u: number): number => ox + u * k
  const Y = (v: number): number => oy + v * k
  const dpr = marks.width / Math.max(1, $('#vwrap').clientWidth)
  const i = Math.round((video.currentTime - obs.t0) / obs.dt)
  if (i <= 2) {
    // objects as the detector saw them in the first frame
    g.lineWidth = 1.5 * dpr
    g.font = `${11 * dpr}px Inter, sans-serif`
    for (const d of obs.detections) {
      const kept = b.report.objects.find((o) => o.label === d.label && !o.inferred)
      if (!kept) continue
      g.strokeStyle = 'rgba(111,140,255,.9)'
      g.strokeRect(X(d.box[0]), Y(d.box[1]), d.box[2] * k, d.box[3] * k)
      g.fillStyle = 'rgba(111,140,255,.9)'
      g.fillText(d.label, X(d.box[0]) + 3 * dpr, Y(d.box[1]) - 4 * dpr)
    }
  }
  const pts = b.overlay[Math.min(Math.max(i, 0), b.overlay.length - 1)]
  if (!pts) return
  g.strokeStyle = 'rgba(63,182,139,.9)'
  g.lineWidth = 2 * dpr
  g.beginPath()
  for (const [a, c] of HAND_EDGES) {
    g.moveTo(X(pts[a]![0]), Y(pts[a]![1]))
    g.lineTo(X(pts[c]![0]), Y(pts[c]![1]))
  }
  g.stroke()
  g.fillStyle = '#fff'
  for (const [u, v] of pts) {
    g.beginPath()
    g.arc(X(u), Y(v), 2.2 * dpr, 0, 2 * Math.PI)
    g.fill()
  }
  // the gripper point: between thumb and index tips
  g.fillStyle = '#6f8cff'
  g.beginPath()
  g.arc(X((pts[4]![0] + pts[8]![0]) / 2), Y((pts[4]![1] + pts[8]![1]) / 2), 4 * dpr, 0, 2 * Math.PI)
  g.fill()
}
type FrameCallbackVideo = HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }
const onVideoFrame = (): void => {
  drawMarks()
  if (S.running && S.tEnd && video.currentTime >= S.tEnd) video.pause()
  ;(video as FrameCallbackVideo).requestVideoFrameCallback?.(onVideoFrame)
}
if ((video as FrameCallbackVideo).requestVideoFrameCallback) (video as FrameCallbackVideo).requestVideoFrameCallback!(onVideoFrame)
else video.addEventListener('timeupdate', drawMarks)
video.addEventListener('seeked', drawMarks)

// ---------------------------------------------------------------- Claude checks the scene
/** Credentials in the Studio's format (shared storage key: connecting on either page works for both). */
interface Conn { mode: 'anthropic' | 'keys' | 'bearer'; creds: Record<string, string>; region: string; model: string }
const AWS_KEY = 'dooms.aws'
function loadConn(): Conn | null {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const v = JSON.parse(store.getItem(AWS_KEY) || 'null') as Conn | null
      if (v?.creds) return v
    } catch {
      /* storage blocked */
    }
  }
  return null
}
function saveConn(c: Conn, remember: boolean): void {
  try {
    sessionStorage.removeItem(AWS_KEY)
    localStorage.removeItem(AWS_KEY)
    ;(remember ? localStorage : sessionStorage).setItem(AWS_KEY, JSON.stringify({ ...c, remember }))
  } catch {
    /* memory only */
  }
}
let conn: Conn | null = loadConn()

async function makeLlm(c: Conn): Promise<LLM> {
  if (c.creds.api_key) return (await import('../engine/anthropic/client')).anthropicFromMessage({ credentials: c.creds, model: c.model })
  return (await import('../engine/bedrock/client')).bedrockFromMessage({ credentials: { ...c.creds, region: c.region || c.creds.region || 'us-east-1' }, model: c.model })
}

const cModal = $<HTMLDialogElement>('#claude-modal')
const segCMode = seg($('#c-mode'), (m) => showCMode(m))
function showCMode(m: string): void {
  $('#c-anthropic').hidden = m !== 'anthropic'
  $('#c-bearer').hidden = m !== 'bearer'
  $('#c-keys').hidden = m !== 'keys'
  $('#c-region-wrap').hidden = m === 'anthropic'
}
$('#c-cancel').addEventListener('click', () => cModal.close())
$('#claude-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const m = segCMode.get() as Conn['mode']
  const v = (id: string): string => ($(id) as HTMLInputElement).value.trim()
  const region = v('#c-region') || 'us-east-1'
  const creds: Record<string, string> = m === 'anthropic' ? { api_key: v('#c-apikey') } : m === 'bearer' ? { bearer_token: v('#c-bearer-key'), region } : { access_key_id: v('#c-akid'), secret_access_key: v('#c-secret'), region }
  if (Object.values(creds).some((x) => !x)) return toast('err', 'Fill in the key')
  conn = { mode: m, creds, region, model: m === 'anthropic' ? '' : v('#c-model') }
  saveConn(conn, ($('#c-remember') as HTMLInputElement).checked)
  cModal.close()
  void askClaude()
})

const jpeg = (c: HTMLCanvasElement): Promise<Uint8Array> =>
  new Promise((resolve) => c.toBlob(async (b) => resolve(new Uint8Array(await b!.arrayBuffer())), 'image/jpeg', 0.85))

/** Image 1: the clean scene with a labelled pixel grid every 100 px. */
async function sceneWithGrid(obs: VideoObservations): Promise<Uint8Array> {
  const c = document.createElement('canvas')
  c.width = obs.width
  c.height = obs.height
  const g = c.getContext('2d')!
  if (obs.scene) {
    const im = new Image()
    im.src = obs.scene.image
    await im.decode()
    g.drawImage(im, 0, 0, c.width, c.height)
  } else {
    video.currentTime = obs.t0
    await new Promise((r) => video.addEventListener('seeked', r, { once: true }))
    g.drawImage(video, 0, 0, c.width, c.height)
  }
  g.strokeStyle = 'rgba(255,255,255,.45)'
  g.fillStyle = 'rgba(255,255,0,.95)'
  g.font = '12px sans-serif'
  g.lineWidth = 1
  for (let x = 100; x < c.width; x += 100) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, c.height); g.stroke(); g.fillText(String(x), x + 2, 12)
  }
  for (let y = 100; y < c.height; y += 100) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); g.fillText(String(y), 2, y - 2)
  }
  return jpeg(c)
}
async function frameAt(t: number, w: number, h: number): Promise<Uint8Array> {
  video.pause()
  video.currentTime = t
  await new Promise((r) => video.addEventListener('seeked', r, { once: true }))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  c.getContext('2d')!.drawImage(video, 0, 0, w, h)
  return jpeg(c)
}

function describe(b: Built): string {
  const r = b.report
  const lines = [
    `Camera: about ${b.camera.pos[2].toFixed(2)} m above the table. Table found by ${r.scene3d}.`,
    `Objects rebuilt (${r.objects.length}, from ${r.objectsFrom}):`,
    ...r.objects.map((o, i) => {
      const px = r.pixels[i]
      return `- ${o.label}: ${o.kind}, ${(o.w * 100).toFixed(0)} x ${(o.d * 100).toFixed(0)} x ${(o.h * 100).toFixed(1)} cm${px ? `, centre near pixel (${px[0].toFixed(0)}, ${px[1].toFixed(0)})` : ''}${o.inferred ? ' (guessed from a grasp)' : ''}`
    }),
    `The ${r.hand.toLowerCase()} hand is copied; it closes ${r.grasps.length} time(s).`,
  ]
  return lines.join('\n')
}

async function askClaude(): Promise<void> {
  if (!S.obs || !S.built || S.asking || S.running) return
  const mock = (window as unknown as { __mockReview?: SceneReview }).__mockReview
  if (!conn && !mock) {
    showCMode(segCMode.get())
    cModal.showModal()
    return
  }
  S.asking = true
  renderButtons()
  $('#ask span').textContent = 'Claude is looking…'
  try {
    const obs = S.obs
    const b = S.built
    const span = (b.trajectory.pos.length - 1) * b.trajectory.dt
    const w = Math.min(640, obs.width)
    const h = Math.round((w * obs.height) / obs.width)
    const frames: Uint8Array[] = []
    for (const f of [0.2, 0.5, 0.8]) frames.push(await frameAt(b.t_start + f * span, w, h))
    const input = {
      scene: await sceneWithGrid(obs), frames, width: obs.width, height: obs.height, summary: describe(b),
      render: S.lastFrame ? new Uint8Array(await S.lastFrame.arrayBuffer()) : null,
    }
    S.review = mock ?? (await reviewScene(await makeLlm(conn!), input))
    S.useClaude = S.review.verdict !== 'correct' && S.review.objects.length > 0
    renderReview()
    if (S.useClaude) {
      await rebuild()
      toast('ok', "Using Claude's scene", 'The robot runs in it now.')
      run()
    }
  } catch (e) {
    toast('err', 'Claude could not check the scene', e instanceof Error ? e.message : String(e), 15000)
  } finally {
    S.asking = false
    $('#ask span').textContent = 'Ask Claude to check the scene'
    renderButtons()
  }
}
$('#ask').addEventListener('click', () => void askClaude())
const segSource = seg($('#o-source'), (v) => {
  S.useClaude = v === 'claude'
  rebuildSoon()
})

function renderReview(): void {
  const r = S.review
  $('#review').hidden = !r
  $('#row-source').hidden = !r || !r.objects.length
  if (!r) return
  segSource.set(S.useClaude ? 'claude' : 'depth')
  const ok = r.verdict === 'correct'
  $('#review').innerHTML = `<div class="verdict ${ok ? 'ok' : 'bad'}"><b>Claude: ${esc(r.verdict)}</b><div class="task">${esc(r.task)}</div>${
    r.problems.length ? `<ul>${r.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>`
}

// for debugging from the console
;(window as unknown as { __imitate: typeof S }).__imitate = S

startEngine()
renderButtons()
