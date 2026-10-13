import type { MujocoApi } from './mujocoApi'

/** Where the engine reads robot assets (MJCF + meshes) from: `fetch` in the browser, the file system in Node tests. */
export interface AssetSource {
  text(path: string): Promise<string>
  bytes(path: string): Promise<Uint8Array>
}

export const ROBOT_DIR: Record<string, { dir: string; xml: string }> = {
  franka: { dir: 'franka_emika_panda', xml: 'panda.xml' },
  so101: { dir: 'robotstudio_so101', xml: 'so101.xml' },
}

/** Fetch-based assets under `base` (default /dooms): the browser HTTP cache keeps them between visits. */
export function fetchAssets(base = '/dooms'): AssetSource {
  const get = async (p: string): Promise<Response> => {
    const res = await fetch(`${base}/${p}`)
    if (!res.ok) throw new Error(`Could not load ${p} (HTTP ${res.status})`)
    return res
  }
  return {
    text: async (p) => (await get(p)).text(),
    bytes: async (p) => new Uint8Array(await (await get(p)).arrayBuffer()),
  }
}

export interface MujocoLoadOptions {
  /** URL of vendor/mujoco/mujoco.js (browser) */
  url?: string
  /** Already-imported factory (Node tests; the .wasm is then found next to the script, no URL needed) */
  factory?: (opts?: unknown) => Promise<unknown>
}

let enginePromise: Promise<MujocoApi> | null = null

/** Instantiate the WebAssembly MuJoCo once per thread. */
export function loadMujoco(opts: MujocoLoadOptions = {}): Promise<MujocoApi> {
  enginePromise ??= (async () => {
    let factory = opts.factory
    const url = opts.url ?? '/vendor/mujoco/mujoco.js'
    if (!factory) {
      const mod = (await import(/* webpackIgnore: true */ url)) as { default: typeof factory }
      factory = mod.default
    }
    const browser = !opts.factory && typeof self !== 'undefined' && 'location' in self
    return (await factory!(browser ? { locateFile: (f: string) => new URL(f, new URL(url, self.location.href)).href } : undefined)) as MujocoApi
  })().catch((e) => {
    enginePromise = null
    throw e
  })
  return enginePromise
}

const mounted = new Set<string>()
const inflight = new Map<string, Promise<void>>()

function mkdirp(mj: MujocoApi, dir: string): void {
  let cur = ''
  for (const part of dir.split('/').filter(Boolean)) {
    cur += `/${part}`
    if (!mj.FS.analyzePath(cur).exists) mj.FS.mkdir(cur)
  }
}

/** Write a robot's meshes into the WASM file system (once per robot) and return the base MJCF text. */
export async function mountRobot(mj: MujocoApi, assets: AssetSource, robot: string): Promise<string> {
  const r = ROBOT_DIR[robot]
  if (!r) throw new Error(`unknown robot '${robot}'`)
  const baseXml = await assets.text(`${r.dir}/${r.xml}`)
  if (mounted.has(robot)) return baseXml
  let p = inflight.get(robot)
  if (!p) {
    p = (async () => {
      const files = Array.from(new Set(Array.from(baseXml.matchAll(/file="([^"]+)"/g), (m) => m[1]!)))
      mkdirp(mj, `/dooms/${r.dir}/assets`)
      const BATCH = 8
      for (let i = 0; i < files.length; i += BATCH)
        await Promise.all(
          files.slice(i, i + BATCH).map(async (f) => mj.FS.writeFile(`/dooms/${r.dir}/assets/${f}`, await assets.bytes(`${r.dir}/assets/${f}`))),
        )
      mounted.add(robot)
    })().finally(() => inflight.delete(robot))
    inflight.set(robot, p)
  }
  await p
  return baseXml
}

let modelSeq = 0
/** Compile an MJCF string that references the mounted meshes (meshdir resolves next to the file). */
export function compileXml(mj: MujocoApi, robot: string, xml: string) {
  const r = ROBOT_DIR[robot]!
  const path = `/dooms/${r.dir}/model_${modelSeq++ % 4}.xml`
  mj.FS.writeFile(path, xml)
  return mj.MjModel.from_xml_path(path)
}
