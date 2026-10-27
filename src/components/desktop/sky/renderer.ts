import type { CloudWorld } from './world'
import { ParticleField } from './field'
import { buildAtlas } from './atlas'
import { DensityGrid, type DensitySheet } from './density'
import { smoothstep } from './math'
import {
  ALPHA_MIN,
  DENSITY_OVERSAMPLE,
  INTERACTION as I,
  LIGHT,
  RAMP,
  REGION,
  regionBottom,
  type CellSize,
  type CloudPalette,
  type LayerSpec,
} from './config'

export type { DensitySheet }

export interface DrawTiming {
  density: number
  step: number
  glyphs: number
  drawn: number
  frames: number
}

const DEBUG = import.meta.env.DEV
const DIM_PER_HAZE = 0.35
const GLYPH_GAMMA = 1
const LEVELS = 6
const BUCKET_SHIFT = 4
const TONE_SHIFT = 6
const LEVEL_SHIFT = 8
const EDGE_FLOOR = 0.22
const EDGE_CURVE = 0.9

export const depthByte = (bucket: number, count: number): number =>
  count <= 1 ? 255 : Math.round((bucket / (count - 1)) * 255)

const layerContext = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d canvas unavailable')
  return ctx
}

export class AsciiRenderer {
  readonly field = new ParticleField()
  readonly timing: DrawTiming = { density: 0, step: 0, glyphs: 0, drawn: 0, frames: 0 }
  cell: CellSize = { w: 8, h: 13 }
  private readonly ctx: CanvasRenderingContext2D
  private readonly overlay = document.createElement('canvas')
  private readonly overlayCtx: CanvasRenderingContext2D
  private readonly grid = new DensityGrid()
  private sheet: DensitySheet | null = null
  private atlas: ImageBitmap | null = null
  private shown = new Uint16Array(0)
  private flying = new Int32Array(0)
  private tones = new Uint8Array(0)
  private light = new Float32Array(0)
  private overlayDirty = false
  private cols = 0
  private rows = 0
  private cw = 0
  private ch = 0
  private scale = 1
  private skyDev = 0
  private readonly glyphOf = new Uint8Array(256)
  private readonly alphaOf = new Float32Array(256)
  private readonly bucketOf = new Uint8Array(256)
  private readonly dim = new Float32Array(4)

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = layerContext(canvas)
    this.overlay.className = canvas.className
    this.overlay.setAttribute('aria-hidden', 'true')
    canvas.after(this.overlay)
    this.overlayCtx = layerContext(this.overlay)
    const last = RAMP.length - 2
    for (let a = 0; a < 256; a++) {
      const t = Math.max(0, (a - ALPHA_MIN) / (255 - ALPHA_MIN))
      this.glyphOf[a] = a < ALPHA_MIN ? 0 : 1 + Math.round(Math.pow(t, GLYPH_GAMMA) * last)
      this.alphaOf[a] = EDGE_FLOOR + (1 - EDGE_FLOOR) * Math.pow(a / 255, EDGE_CURVE)
    }
  }

  get pxPerX(): number {
    return DENSITY_OVERSAMPLE / this.cell.w
  }

  get pxPerY(): number {
    return DENSITY_OVERSAMPLE / this.cell.h
  }

  show(visible: boolean): void {
    this.canvas.classList.toggle('is-ready', visible)
    this.overlay.classList.toggle('is-ready', visible)
  }

  resize(width: number, height: number, dpr: number, horizon: number, cell: CellSize): boolean {
    const { canvas, overlay } = this
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    overlay.width = canvas.width
    overlay.height = canvas.height
    this.ctx.imageSmoothingEnabled = false
    this.overlayCtx.imageSmoothingEnabled = false
    this.scale = canvas.width / width
    const cw = Math.max(3, Math.round(cell.w * this.scale))
    const ch = Math.max(4, Math.round(cell.h * this.scale))
    const changed = cw !== this.cw || ch !== this.ch
    this.cw = cw
    this.ch = ch
    this.cell = { w: cw / this.scale, h: ch / this.scale }

    const reach = Math.min(canvas.height, Math.ceil(regionBottom(horizon, height) * this.scale))
    this.cols = Math.ceil(canvas.width / cw)
    this.rows = Math.max(1, Math.floor(reach / ch))
    this.skyDev = this.rows * ch

    const bottom = this.skyDev / this.scale
    const fadeEnd = Math.min(horizon * REGION.fadeTo, bottom - 2 * this.cell.h)
    const fadeStart = Math.min(horizon * REGION.fadeFrom, fadeEnd - 3 * this.cell.h)
    const rowFade = new Float32Array(this.rows)
    for (let j = 0; j < this.rows; j++) rowFade[j] = 1 - smoothstep(fadeStart, fadeEnd, (j + 0.5) * this.cell.h)
    this.grid.resize(this.cols, this.rows, rowFade)

    this.shown = new Uint16Array(this.cols * this.rows)
    this.flying = new Int32Array(this.cols * this.rows)
    this.tones = new Uint8Array(this.cols * this.rows)
    this.light = new Float32Array(this.cols)
    this.overlayDirty = false
    this.field.resize(this.cols, this.rows, this.cell.w, this.cell.h, width)
    if (changed) this.dropAtlas()
    return changed
  }

  async bakeAtlas(family: string, palette: CloudPalette, layers: readonly LayerSpec[]): Promise<ImageBitmap> {
    const source = buildAtlas(this.cw, this.ch, family, palette, layers)
    const bitmap = await createImageBitmap(source)
    source.width = 0
    return bitmap
  }

  install(atlas: ImageBitmap, sheet: DensitySheet, layers: readonly LayerSpec[]): void {
    this.dropAtlas()
    this.atlas = atlas
    this.sheet = sheet
    const count = layers.length
    for (let v = 0; v < 256; v++) {
      const bucket = count <= 1 ? 0 : Math.round((v / 255) * (count - 1))
      this.bucketOf[v] = bucket
      this.field.response[v] = layers[bucket].response
    }
    for (let b = 0; b < count; b++) this.dim[b] = 1 - layers[b].haze * DIM_PER_HAZE
    this.shown.fill(0)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.overlayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.overlayDirty = false
  }

  release(): void {
    this.sheet = null
    this.dropAtlas()
    this.overlay.remove()
  }

  draw(world: CloudWorld, dt: number, simulate: boolean): void {
    const { sheet, atlas, grid, canvas, ctx, cols, rows, cw, ch, scale, skyDev } = this
    if (!sheet || !atlas) return
    const t0 = DEBUG ? performance.now() : 0

    grid.compose(world.clouds, sheet, 1 / this.cell.w, 1 / this.cell.h)
    const data = grid.data
    const t1 = DEBUG ? performance.now() : 0
    if (simulate) this.field.step(dt, data)
    const t2 = DEBUG ? performance.now() : 0

    const { ox, oy } = this.field
    const { glyphOf, alphaOf, bucketOf, dim, shown, flying, tones, light } = this
    const [lit0, lit1, lit2] = LIGHT.tones
    light.fill(1)
    let drawn = 0
    let airborne = 0
    for (let j = 0; j < rows; j++) {
      const y = j * ch
      const last = j + 1 >= rows
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i
        const a = data[(k << 2) + 3]
        let key = 0
        if (a >= ALPHA_MIN) {
          const exposure = light[i]
          let tone = exposure > lit0 ? 0 : exposure > lit1 ? 1 : exposure > lit2 ? 2 : 3
          if (tone < 3 && !last && data[((k + cols) << 2) + 3] + LIGHT.edge < a) tone++
          light[i] = exposure * (1 - LIGHT.absorb * (a / 255))
          tones[k] = tone
          if (ox[k] !== 0 || oy[k] !== 0) {
            flying[airborne++] = k
          } else {
            const bucket = bucketOf[data[k << 2]]
            const level = Math.max(1, Math.round(alphaOf[a] * dim[bucket] * (LEVELS - 1)))
            key = glyphOf[a] | (bucket << BUCKET_SHIFT) | (tone << TONE_SHIFT) | (level << LEVEL_SHIFT)
          }
        } else {
          light[i] += (1 - light[i]) * LIGHT.recover
        }
        if (key === shown[k]) continue
        shown[k] = key
        const x = i * cw
        ctx.clearRect(x, y, cw, ch)
        if (key === 0) continue
        ctx.globalAlpha = (key >> LEVEL_SHIFT) / (LEVELS - 1)
        ctx.drawImage(atlas, (key & 15) * cw, ((key >> BUCKET_SHIFT) & 15) * ch, cw, ch, x, y, cw, ch)
        drawn++
      }
    }
    ctx.globalAlpha = 1

    if (airborne > 0 || this.overlayDirty) {
      const ov = this.overlayCtx
      const width = canvas.width
      ov.clearRect(0, 0, width, skyDev)
      this.overlayDirty = airborne > 0
      for (let n = 0; n < airborne; n++) {
        const k = flying[n]
        const dx = ox[k]
        const dy = oy[k]
        const x = (k % cols) * cw + Math.round(dx * scale)
        const y = Math.floor(k / cols) * ch + Math.round(dy * scale)
        if (x >= width || x + cw <= 0 || y + ch > skyDev || y < 0) continue
        const a = data[(k << 2) + 3]
        const bucket = bucketOf[data[k << 2]]
        const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / I.flyRange)
        const glyph = Math.max(1, Math.round(glyphOf[a] * (1 - I.glyphFade * t)))
        ov.globalAlpha = alphaOf[a] * dim[bucket] * (1 - I.alphaFade * t)
        ov.drawImage(atlas, glyph * cw, (bucket | (tones[k] << 2)) * ch, cw, ch, x, y, cw, ch)
        drawn++
      }
      ov.globalAlpha = 1
    }

    if (DEBUG) {
      const m = this.timing
      m.density += t1 - t0
      m.step += t2 - t1
      m.glyphs += performance.now() - t2
      m.drawn += drawn
      m.frames++
    }
  }

  private dropAtlas(): void {
    this.atlas?.close()
    this.atlas = null
  }
}
