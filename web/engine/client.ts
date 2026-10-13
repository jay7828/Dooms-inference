/**
 * Main-thread handle on the in-browser Dooms engine (the page's counterpart of the engine worker).
 * Same surface the UI used with the WebSocket session: send(msg) for load / reset / run / stop, events and poses and
 * agent-camera frames through callbacks; plus the local equivalents of the /api/scene and /api/skills endpoints.
 */
import type { SceneData, StoredSkill } from '../types'
import type { WorkerIn, WorkerOut } from './engine.worker'
import { SkillLibrary } from './skills'
import { IdbSkillStorage } from './skillsIdb'
export { localConfig } from './localConfig'
export { validateInBrowser } from './bedrock/validate'
export { validateAnthropicKey, ANTHROPIC_MODELS } from './anthropic/client'

export interface LocalSessionOptions {
  /** where mujoco/mujoco.js, dooms/ (robot assets) and engine.worker.js live (a URL prefix such as "/static") */
  base: string
  onReady: (info: { camera: boolean }) => void
  onFatal: (message: string) => void
  onEvent: (ev: Record<string, unknown>) => void
  onPose: (t: number, poses: Float32Array) => void
  onFrame: (jpeg: Blob) => void
}

/** Whether this browser can run the engine at all (module workers + WebAssembly). */
export function localEngineSupported(): boolean {
  return typeof Worker !== 'undefined' && typeof WebAssembly === 'object'
}

export class LocalSession {
  private worker: Worker | null = null
  private nextId = 1
  private pending = new Map<number, { resolve: (v: SceneData) => void; reject: (e: Error) => void }>()

  constructor(private opts: LocalSessionOptions) {}

  start(): void {
    const base = this.opts.base.replace(/\/$/, '')
    const abs = (p: string): string => new URL(p, window.location.href).href
    const worker = new Worker(abs(`${base}/engine/engine.worker.js`), { type: 'module' })
    this.worker = worker
    worker.onerror = (e) => this.opts.onFatal(e.message || 'The browser engine crashed.')
    worker.onmessage = (e: MessageEvent<WorkerOut>) => this.onMessage(e.data)
    const post: WorkerIn = { op: 'init', mujocoUrl: abs(`${base}/vendor/mujoco/mujoco.js`), assetsBase: abs(`${base}/dooms`) }
    worker.postMessage(post)
  }

  private onMessage(m: WorkerOut): void {
    switch (m.kind) {
      case 'ready':
        this.opts.onReady({ camera: m.camera })
        break
      case 'fatal':
        this.opts.onFatal(m.message)
        break
      case 'event':
        if (m.ev.type) this.opts.onEvent(m.ev)
        break
      case 'pose':
        this.opts.onPose(m.t, m.poses)
        break
      case 'frame':
        this.opts.onFrame(new Blob([m.jpeg], { type: 'image/jpeg' }))
        break
      case 'reply': {
        const p = this.pending.get(m.id)
        if (!p) break
        this.pending.delete(m.id)
        if (m.ok) p.resolve(m.data as SceneData)
        else p.reject(new Error(m.error ?? 'Could not load the 3D scene.'))
        break
      }
    }
  }

  /** false when the engine is not running. */
  send(msg: Record<string, unknown>): boolean {
    if (!this.worker) return false
    const post: WorkerIn = msg.type === 'stop' ? { op: 'stop' } : { op: 'cmd', msg }
    this.worker.postMessage(post)
    return true
  }

  /** GET /api/scene/{name}, answered from the WASM model. */
  scene(name: string, seed: number, robot: string): Promise<SceneData> {
    const worker = this.worker
    if (!worker) return Promise.reject(new Error('The browser engine is not running.'))
    return new Promise((resolve, reject) => {
      const id = this.nextId++
      this.pending.set(id, { resolve, reject })
      const post: WorkerIn = { op: 'scene', id, name, seed, robot }
      worker.postMessage(post)
    })
  }

  dispose(): void {
    this.worker?.terminate()
    this.worker = null
    for (const p of this.pending.values()) p.reject(new Error('The browser engine was stopped.'))
    this.pending.clear()
  }
}

/** GET /api/skills and DELETE /api/skills against the browser's own IndexedDB library of one arm. */
export async function localSkills(robot: string): Promise<StoredSkill[]> {
  const lib = new SkillLibrary(new IdbSkillStorage(robot))
  await lib.reload()
  return lib.api()
}
export async function clearLocalSkills(robot: string): Promise<number> {
  const lib = new SkillLibrary(new IdbSkillStorage(robot))
  await lib.reload()
  return lib.clear()
}
