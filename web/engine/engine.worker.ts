/// <reference lib="webworker" />
/**
 * Web Worker that runs a Dooms simulation session (MuJoCo WASM + the whole pipeline) off the main thread.
 * Protocol with LocalSession (main thread):
 *   in : { op: 'init', mujocoUrl } | { op: 'cmd', msg } | { op: 'stop' } | { op: 'scene', id, name, seed, robot }
 *   out: { kind: 'ready' } | { kind: 'event', ev } | { kind: 'pose', t, poses } | { kind: 'frame', jpeg }
 *        | { kind: 'reply', id, ok, data?, error? } | { kind: 'fatal', message }
 */
import { createFrameRenderer } from './frameRenderer'
import { fetchAssets, loadMujoco } from './mujocoLoader'
import { SessionCore } from './session'
import { IdbSkillStorage } from './skillsIdb'
import { MemorySkillStorage, type SkillStorage } from './skills'

export type WorkerIn =
  | { op: 'init'; mujocoUrl: string; assetsBase: string }
  | { op: 'cmd'; msg: Record<string, unknown> }
  | { op: 'stop' }
  | { op: 'scene'; id: number; name: string; seed: number; robot: string }

export type WorkerOut =
  | { kind: 'ready'; camera: boolean }
  | { kind: 'event'; ev: Record<string, unknown> }
  | { kind: 'pose'; t: number; poses: Float32Array }
  | { kind: 'frame'; jpeg: ArrayBuffer }
  | { kind: 'reply'; id: number; ok: boolean; data?: unknown; error?: string }
  | { kind: 'fatal'; message: string }

const ctx = self as unknown as DedicatedWorkerGlobalScope
const post = (m: WorkerOut, transfer: Transferable[] = []): void => ctx.postMessage(m, transfer)

let session: SessionCore | null = null

const skillStorage = (robot: string): SkillStorage => {
  try {
    if (typeof indexedDB !== 'undefined') return new IdbSkillStorage(robot)
  } catch {
    /* private mode etc.: skills just do not persist */
  }
  return new MemorySkillStorage()
}
const memory = new Map<string, MemorySkillStorage>()
const storageFor = (robot: string): SkillStorage => {
  const s = skillStorage(robot)
  if (s instanceof MemorySkillStorage) {
    if (!memory.has(robot)) memory.set(robot, s)
    return memory.get(robot)!
  }
  return s
}

async function init(mujocoUrl: string, assetsBase: string): Promise<void> {
  try {
    const mj = await loadMujoco({ url: mujocoUrl })
    const renderer = createFrameRenderer()
    session = new SessionCore({
      mj, assets: fetchAssets(assetsBase), renderer, skillStorage: storageFor,
      host: {
        event: (ev) => post({ kind: 'event', ev }),
        pose: (t, poses) => post({ kind: 'pose', t, poses }, [poses.buffer]),
        frame: (jpeg) => {
          const buf = jpeg.buffer.slice(jpeg.byteOffset, jpeg.byteOffset + jpeg.byteLength) as ArrayBuffer
          post({ kind: 'frame', jpeg: buf }, [buf])
        },
      },
    })
    post({ kind: 'ready', camera: renderer !== null })
  } catch (e) {
    post({ kind: 'fatal', message: e instanceof Error ? e.message : String(e) })
  }
}

ctx.onmessage = (e: MessageEvent<WorkerIn>) => {
  const m = e.data
  switch (m.op) {
    case 'init':
      void init(m.mujocoUrl, m.assetsBase)
      break
    case 'stop':
      session?.stop()
      break
    case 'cmd':
      void session?.submit(m.msg)
      break
    case 'scene':
      if (!session) {
        post({ kind: 'reply', id: m.id, ok: false, error: 'The browser engine is not ready.' })
        break
      }
      session.sceneData(m.name, m.seed, m.robot).then(
        (data) => post({ kind: 'reply', id: m.id, ok: true, data }),
        (err: unknown) => post({ kind: 'reply', id: m.id, ok: false, error: err instanceof Error ? err.message : String(err) }),
      )
      break
  }
}
