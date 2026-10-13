/**
 * Vision Grounder (agents/vision_grounder.py): Claude points at the requested keypoints on a grid-labelled image
 * (coarse), then again on a 5x zoomed crop around each answer (refine); depth lifts the pixels to 3D. The same object is
 * used for the wrist-camera re-grounding the pipeline runs when the gripper hovers above a reach target.
 */
import { Agent, GroundingError, type AgentOptions, type Grounder } from './agents'
import type { Keypoint } from './controllers'
import type { MuJoCoEnv, Observation } from './env'
import { cropZoomCubic, drawGrid, type ImageCodec, type Raster } from './imageOps'
import { DepthImage, liftPixel, LiftError } from './lift'
import type { ImageBlock, LLM } from './llm'
import { PixelPointsSchema, ValueError, type KeypointRequest, type PixelPoints } from './schemas'
import type { RobotProfile } from './data'

export const CROP = 96
export const ZOOM = 5

export class VisionGrounder extends Agent<PixelPoints> implements Grounder {
  readonly name = 'vision_grounder' as const
  readonly schema = PixelPointsSchema
  lastPixels: Record<string, [number, number]> = {}
  constructor(llm: LLM, robot: RobotProfile, private env: MuJoCoEnv, private codec: ImageCodec, readonly refineIters = 1, opts?: AgentOptions) {
    super(llm, robot, opts, 'vision_grounder')
  }

  private async point(image: Raster, reqs: KeypointRequest[], grid: number, label: string, extra = ''): Promise<Record<string, [number, number, boolean]>> {
    const { width: w, height: h } = image
    const want = reqs.map((r) => `- ${r.name}: ${r.description}`).join('\n')
    const text = `Image size: ${w} x ${h} pixels (u to the right, v downward).${extra}\nLocate these keypoints:\n${want}`
    const check = (p: PixelPoints): void => {
      const got = new Set(p.points.map((q) => q.name))
      const missing = reqs.map((r) => r.name).filter((n) => !got.has(n)).sort()
      if (missing.length) throw new ValueError(`missing keypoints ${JSON.stringify(missing)}`)
      for (const q of p.points) if (!(q.u >= 0 && q.u <= w && q.v >= 0 && q.v <= h)) throw new ValueError(`${q.name}=(${q.u},${q.v}) is outside the ${w}x${h} image`)
    }
    const png = await this.codec.encode(drawGrid(image, grid))
    const img: ImageBlock = { type: 'image', mediaType: 'image/png', load: async () => png }
    const out = await this.call([text, img], check, 2, label)
    return Object.fromEntries(out.points.map((q) => [q.name, [q.u, q.v, q.visible] as [number, number, boolean]]))
  }

  private async zoomRefine(rgb: Raster, req: KeypointRequest, u: number, v: number): Promise<[number, number]> {
    const clamp = (x: number, hi: number): number => Math.min(hi, Math.max(0, x))
    const x0 = clamp(Math.round(u) - CROP / 2, rgb.width - CROP)
    const y0 = clamp(Math.round(v) - CROP / 2, rgb.height - CROP)
    const big = cropZoomCubic(rgb, x0, y0, CROP, ZOOM)
    const pts = await this.point(big, [req], ZOOM * 12, `refine:${req.name}`, ' This is a zoomed crop of the scene; the feature should be near the middle.')
    const [zu, zv] = pts[req.name]!
    return [x0 + zu / ZOOM, y0 + zv / ZOOM]
  }

  async ground(requests: KeypointRequest[], obs: Observation): Promise<Record<string, Keypoint>> {
    if (!requests.length) return {}
    const png = await obs.png()
    if (!png) throw new GroundingError('Vision grounding needs the camera renderer, which this browser (or WebGL in a worker) does not provide. Use the Oracle grounding instead.')
    const rgb = await this.codec.decode(png)
    const depth = new DepthImage(this.env, obs.camera)
    const coarse = await this.point(rgb, requests, 80, 'coarse')
    const out: Record<string, Keypoint> = {}
    this.lastPixels = {}
    for (const r of requests) {
      let [u, v] = coarse[r.name]!
      for (let i = 0; i < this.refineIters; i++) [u, v] = await this.zoomRefine(rgb, r, u, v)
      this.lastPixels[r.name] = [u, v]
      try {
        out[r.name] = liftPixel(depth, r.name, u, v)
      } catch (e) {
        if (e instanceof LiftError) throw new GroundingError(`${r.name}: ${e.message}`)
        throw e
      }
    }
    return out
  }
}
