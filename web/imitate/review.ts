/**
 * Claude checks the rebuilt scene against the video and, where it is wrong, describes the scene itself: every object
 * on the table with its shape, size, colour and footprint in the image. buildImitation then places those objects on
 * the measured table (BuildOptions.llm) and the robot runs in that scene.
 */
import type { ImageBlock, LLM } from '../engine/llm'
import { s, type Schema } from '../engine/schemas'

export const SHAPES = ['block', 'cylinder', 'sphere', 'cup', 'flat'] as const
export type LlmShape = (typeof SHAPES)[number]

const object = s.object({
  name: s.string('short name, e.g. "orange napkin", "white mug"'),
  shape: s.enum(SHAPES),
  width_cm: s.number('size across, as seen from the camera (cm)'),
  depth_cm: s.number('size front to back (cm)'),
  height_cm: s.number('height above the table (cm); about 0.3 for paper or cloth lying flat'),
  color: s.string('main colour as #rrggbb'),
  box: s.array(s.number(), 'footprint on the table in image 1: [x0, y0, x1, y1] pixels, read off the grid'),
  touched: s.bool('the hand touches, picks up or moves it in the video', false),
})
const review = s.object({
  task: s.string('what the hand does in the video, one sentence'),
  verdict: s.enum(['correct', 'partly correct', 'wrong'] as const),
  problems: s.array(s.string(), 'what is wrong in the rebuilt scene (missing / extra / wrongly sized or placed objects, table)', true),
  objects: s.array(object, 'every object on the table that the task involves or that is in the way, in image 1 coordinates'),
})
export type SceneReview = ReturnType<typeof review.parse>
export type LlmObject = SceneReview['objects'][number]

const ReviewSchema: Schema<SceneReview> = {
  name: 'scene_review',
  description: 'Judge the rebuilt scene and describe the real one',
  jsonSchema: review.json,
  parse: (raw) => {
    const r = review.parse(raw, '')
    for (const [i, o] of r.objects.entries()) {
      if (o.box.length !== 4) throw new Error(`objects[${i}].box: give 4 numbers [x0, y0, x1, y1]`)
      if (!/^#?[0-9a-f]{6}$/i.test(o.color.trim())) throw new Error(`objects[${i}].color: use #rrggbb`)
    }
    return r
  },
}

const SYSTEM = `You check a 3D scene that was rebuilt automatically from a video of a person's hand doing a task on a table, so that a robot arm can repeat the task in simulation.
You get: image 1, the scene without hands (a clean background frame) with a pixel grid; images 2 to 4, frames during the action; image 5 (if present), the rebuilt 3D scene rendered from the same camera (the robot may be in it; ignore the robot).
Compare the rebuilt scene with the video. Then describe the real scene yourself: list every object on the table that the task involves or that would be in the robot's way, with realistic sizes in centimetres (use the table, the hand, and known object sizes for scale) and its footprint box on the table in image 1 pixel coordinates (read them off the grid labels). Leave out the table itself, people, hands, things that are not on the table, and the table's surface texture or pattern. Lying cloth or paper is shape "flat" with a height under 1 cm.`

export interface ReviewInput {
  /** image 1: clean frame with grid (JPEG) */
  scene: Uint8Array
  /** images 2-4 */
  frames: Uint8Array[]
  /** image 5: the rebuild rendered from the video camera (optional) */
  render: Uint8Array | null
  width: number
  height: number
  /** what was rebuilt, in words */
  summary: string
}

export async function reviewScene(llm: LLM, inp: ReviewInput): Promise<SceneReview> {
  const img = (b: Uint8Array): ImageBlock => ({ type: 'image', mediaType: 'image/jpeg', load: async () => b })
  const content = [
    `Image 1 (${inp.width} x ${inp.height} px, grid labels are pixel coordinates):`, img(inp.scene),
    'Images 2 to 4, during the action:', ...inp.frames.map(img),
    ...(inp.render ? ['Image 5, the rebuilt scene from the same camera:', img(inp.render)] : []),
    `The rebuilt scene:\n${inp.summary}`,
  ]
  return llm.structured({ agent: 'vision_grounder', system: SYSTEM, messages: [{ role: 'user', content }], schema: ReviewSchema, maxTokens: 3000, temperature: 0 })
}

/** '#ff8800' -> [1, 0.53, 0] */
export function hexColor(h: string): [number, number, number] {
  const m = h.trim().replace('#', '')
  const n = Number.parseInt(m, 16)
  return Number.isFinite(n) && m.length === 6 ? [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] : [0.6, 0.6, 0.6]
}
