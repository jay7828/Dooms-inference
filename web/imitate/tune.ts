/** Offline tuning: rebuild a scene from observations dumped by the browser (node only). */
import { readFileSync } from 'node:fs'
import { buildImitation, DEFAULT_BUILD, type VideoObservations } from './build'
const obs = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as VideoObservations
if (obs.scene) obs.scene.depth.data = Float32Array.from(obs.scene.depth.data as unknown as number[])
for (const hfov of (process.argv[3] ?? '68').split(',').map(Number)) {
  const b = buildImitation(obs, { ...DEFAULT_BUILD, hfov })
  const r = b.report
  // flatness of the photo surface: spread of its heights inside the work area
  const P = b.backdrop?.positions ?? []
  const hs: number[] = []
  for (let i = 0; i < P.length; i += 3) if (Math.hypot(P[i]! - 0.5, P[i + 1]!) < 0.6) hs.push(P[i + 2]!)
  hs.sort((x, y) => x - y)
  const q = (f: number): string => (hs.length ? hs[Math.floor(f * (hs.length - 1))]!.toFixed(3) : '-')
  console.log(`fov ${hfov}: ${r.scene3d}, objects ${r.objects.map((o) => `${o.label}(${(o.w * 100).toFixed(0)}x${(o.h * 100).toFixed(0)})`).join(' ')}, backdrop z p5 ${q(0.05)} p50 ${q(0.5)} p95 ${q(0.95)}, cam z ${b.camera.pos[2].toFixed(2)}`)
}
