// Bundles the browser engine into the static web UI:
//   static/engine/engine.worker.js  the web worker: MuJoCo WASM + pipeline + agents (+ three.js for the camera frames)
//   static/engine/client.js         the page-side handle (LocalSession, localConfig, skills, Bedrock validate)
import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(here, '../src/dooms/server/static/engine')

await build({
  entryPoints: {
    'engine.worker': path.join(here, 'engine/engine.worker.ts'),
    client: path.join(here, 'engine/client.ts'),
  },
  outdir: out,
  bundle: true,
  format: 'esm',
  target: 'es2022',
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'info',
})
