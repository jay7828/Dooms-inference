// Bundles the headless video-imitation self-test for Node: node web/build_selftest.mjs && node <scratch>/imitate_selftest.mjs
import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const out = process.env.SELFTEST_OUT || path.join(here, '../runs/selftest')
await build({ entryPoints: { imitate_selftest: path.join(here, 'imitate/selftest.ts') }, outdir: out, bundle: true, platform: 'node', format: 'esm', target: 'node20', logLevel: 'warning', external: ['three'], outExtension: { '.js': '.mjs' } })
console.log(path.join(out, 'imitate_selftest.mjs'))
