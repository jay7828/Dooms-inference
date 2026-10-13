/**
 * The few image operations the Vision Grounder needs (perception/viz.py draw_grid, cv2.resize INTER_CUBIC, PNG in/out)
 * on a plain RGBA raster, so they behave the same in the browser worker and under Node. Only encode/decode touch the
 * platform (OffscreenCanvas in the browser; tests bring their own codec).
 */
export interface Raster {
  width: number
  height: number
  /** RGBA, row-major */
  data: Uint8ClampedArray
}

export interface ImageCodec {
  decode(png: Uint8Array): Promise<Raster>
  /** PNG by default; JPEG for the images sent to the UI */
  encode(r: Raster, mime?: 'image/png' | 'image/jpeg', quality?: number): Promise<Uint8Array>
}

export const newRaster = (width: number, height: number): Raster => ({ width, height, data: new Uint8ClampedArray(width * height * 4) })
export const cloneRaster = (r: Raster): Raster => ({ width: r.width, height: r.height, data: new Uint8ClampedArray(r.data) })

/** PNG decode/encode through an OffscreenCanvas (workers and modern browsers). */
export const browserCodec: ImageCodec = {
  async decode(png) {
    const bmp = await createImageBitmap(new Blob([png as BlobPart], { type: 'image/png' }))
    const c = new OffscreenCanvas(bmp.width, bmp.height)
    const g = c.getContext('2d', { willReadFrequently: true })
    if (!g) throw new Error('2D canvas is not available')
    g.drawImage(bmp, 0, 0)
    bmp.close()
    const d = g.getImageData(0, 0, c.width, c.height)
    return { width: d.width, height: d.height, data: d.data }
  },
  async encode(r, mime = 'image/png', quality = 0.85) {
    const c = new OffscreenCanvas(r.width, r.height)
    const g = c.getContext('2d')
    if (!g) throw new Error('2D canvas is not available')
    g.putImageData(new ImageData(new Uint8ClampedArray(r.data), r.width, r.height), 0, 0)
    return new Uint8Array(await (await c.convertToBlob({ type: mime, quality })).arrayBuffer())
  },
}

// ---- tiny digit font for the grid labels (5 x 7) ---------------------------------------------------------------------
const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
}
const FONT_SCALE = 1.35 // about the size of cv2.putText(HERSHEY_SIMPLEX, 0.4)

function setPx(r: Raster, x: number, y: number, c: readonly [number, number, number]): void {
  if (x < 0 || y < 0 || x >= r.width || y >= r.height) return
  const o = (y * r.width + x) * 4
  r.data[o] = c[0]
  r.data[o + 1] = c[1]
  r.data[o + 2] = c[2]
  r.data[o + 3] = 255
}

/** Text with its baseline at y (like cv2.putText), left edge at x. */
function putText(r: Raster, text: string, x: number, y: number, c: readonly [number, number, number]): void {
  const gw = Math.round(5 * FONT_SCALE)
  const gh = Math.round(7 * FONT_SCALE)
  let px = x
  for (const ch of text) {
    const g = GLYPHS[ch]
    if (g) {
      for (let yy = 0; yy < gh; yy++)
        for (let xx = 0; xx < gw; xx++) {
          const row = g[Math.min(6, Math.floor((yy * 7) / gh))]!
          if (row[Math.min(4, Math.floor((xx * 5) / gw))] === '1') setPx(r, px + xx, y - gh + yy, c)
        }
    }
    px += gw + 2
  }
}

/** Overlay labelled grid lines (viz.draw_grid). Labels are in the original image frame (origin = crop offset). */
export function drawGrid(src: Raster, step = 80, origin: [number, number] = [0, 0]): Raster {
  const img = cloneRaster(src)
  const [ox, oy] = origin
  const mod = (a: number, n: number): number => ((a % n) + n) % n
  for (let x = mod(-ox, step); x < img.width; x += step) {
    for (let y = 0; y < img.height; y++) setPx(img, x, y, [255, 255, 0])
    putText(img, String(x + ox), x + 2, 12, [255, 255, 0])
  }
  for (let y = mod(-oy, step); y < img.height; y += step) {
    for (let x = 0; x < img.width; x++) setPx(img, x, y, [0, 255, 255])
    putText(img, String(y + oy), 2, y - 3, [0, 255, 255])
  }
  return img
}

/** cv2.resize(crop, size*zoom, INTER_CUBIC) of the square crop [x0, x0+size) x [y0, y0+size) (a = -0.75, replicated border). */
export function cropZoomCubic(src: Raster, x0: number, y0: number, size: number, zoom: number): Raster {
  const out = newRaster(size * zoom, size * zoom)
  const A = -0.75
  const w = (t: number): number[] => {
    const f = (x: number): number => {
      const ax = Math.abs(x)
      if (ax <= 1) return ((A + 2) * ax - (A + 3)) * ax * ax + 1
      if (ax < 2) return ((A * ax - 5 * A) * ax + 8 * A) * ax - 4 * A
      return 0
    }
    return [f(1 + t), f(t), f(1 - t), f(2 - t)]
  }
  const clampX = (v: number): number => Math.min(x0 + size - 1, Math.max(x0, v))
  const clampY = (v: number): number => Math.min(y0 + size - 1, Math.max(y0, v))
  for (let j = 0; j < out.height; j++) {
    const sy = (j + 0.5) / zoom - 0.5
    const iy = Math.floor(sy)
    const wy = w(sy - iy)
    for (let i = 0; i < out.width; i++) {
      const sx = (i + 0.5) / zoom - 0.5
      const ix = Math.floor(sx)
      const wx = w(sx - ix)
      for (let ch = 0; ch < 3; ch++) {
        let acc = 0
        for (let m = 0; m < 4; m++) {
          const yy = clampY(y0 + iy + m - 1)
          let row = 0
          for (let n = 0; n < 4; n++) row += wx[n]! * src.data[(yy * src.width + clampX(x0 + ix + n - 1)) * 4 + ch]!
          acc += wy[m]! * row
        }
        out.data[(j * out.width + i) * 4 + ch] = acc
      }
      out.data[(j * out.width + i) * 4 + 3] = 255
    }
  }
  return out
}

/** Mark grounded pixels (viz.draw_points): a red ring and a dot at each. */
export function drawPoints(src: Raster, points: Record<string, [number, number]>): Raster {
  const img = cloneRaster(src)
  for (const [u, v] of Object.values(points)) {
    const cx = Math.round(u)
    const cy = Math.round(v)
    for (let y = -6; y <= 6; y++)
      for (let x = -6; x <= 6; x++) {
        const d = Math.hypot(x, y)
        if ((d >= 4.2 && d <= 6.2) || d <= 1.2) setPx(img, cx + x, cy + y, [255, 60, 60])
      }
  }
  return img
}
