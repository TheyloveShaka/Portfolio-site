import type { CloudWorld } from './world'
import { ParticleField } from './field'
import { buildAtlas } from './atlas'
import { ALPHA_MIN, DENSITY_OVERSAMPLE, INTERACTION as I, RAMP, type CellSize, type CloudPalette, type LayerSpec } from './config'

export type DensitySheet = ImageBitmap[][]

export interface DrawTiming {
  density: number
  step: number
  glyphs: number
  drawn: number
  frames: number
}

const DEBUG = import.meta.env.DEV
const DIM_PER_HAZE = 0.35
const GLYPH_GAMMA = 1.2
const LEVELS = 16
const BUCKET_SHIFT = 4
const LEVEL_SHIFT = 6

export const depthByte = (bucket: number, count: number): number =>
  count <= 1 ? 255 : Math.round((bucket / (count - 1)) * 255)

export const closeSheet = (sheet: DensitySheet): void => {
  for (const layer of sheet) for (const sprite of layer) sprite.close()
}

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
  private readonly gridCanvas = document.createElement('canvas')
  private readonly gridCtx: CanvasRenderingContext2D
  private sheet: DensitySheet | null = null
  private atlas: ImageBitmap | null = null
  private shown = new Uint16Array(0)
  private flying = new Int32Array(0)
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
    const gridCtx = this.gridCanvas.getContext('2d', { willReadFrequently: true })
    if (!gridCtx) throw new Error('2d canvas unavailable')
    this.gridCtx = gridCtx
    this.ctx = layerContext(canvas)
    this.overlay.className = canvas.className
    this.overlay.setAttribute('aria-hidden', 'true')
    canvas.after(this.overlay)
    this.overlayCtx = layerContext(this.overlay)
    const last = RAMP.length - 2
    for (let a = 0; a < 256; a++) {
      const t = Math.max(0, (a - ALPHA_MIN) / (255 - ALPHA_MIN))
      this.glyphOf[a] = a < ALPHA_MIN ? 0 : 1 + Math.round(Math.pow(t, GLYPH_GAMMA) * last)
      this.alphaOf[a] = 0.38 + 0.62 * (a / 255)
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
    const { canvas, overlay, gridCanvas, gridCtx } = this
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
    this.skyDev = Math.min(canvas.height, Math.ceil((horizon + this.cell.h) * this.scale))
    this.cols = Math.ceil(canvas.width / cw)
    this.rows = Math.ceil(this.skyDev / ch)
    gridCanvas.width = this.cols
    gridCanvas.height = this.rows
    gridCtx.imageSmoothingEnabled = true
    gridCtx.imageSmoothingQuality = 'medium'
    this.shown = new Uint16Array(this.cols * this.rows)
    this.flying = new Int32Array(this.cols * this.rows)
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
    this.dropSheet()
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
    this.dropSheet()
    this.dropAtlas()
    this.gridCanvas.width = 0
    this.overlay.remove()
  }

  draw(world: CloudWorld, dt: number, simulate: boolean): void {
    const { sheet, atlas, gridCtx, canvas, ctx, cols, rows, cw, ch, scale, skyDev } = this
    if (!sheet || !atlas) return
    const t0 = DEBUG ? performance.now() : 0
    const ix = 1 / this.cell.w
    const iy = 1 / this.cell.h

    gridCtx.globalAlpha = 1
    gridCtx.clearRect(0, 0, cols, rows)
    for (const cloud of world.clouds) {
      const sprites = sheet[cloud.layer]
      for (const item of cloud.items) {
        if (item.dx > world.width || item.dx + item.dw < 0) continue
        gridCtx.globalAlpha = item.alpha
        gridCtx.drawImage(sprites[item.sprite], item.dx * ix, item.dy * iy, item.dw * ix, item.dh * iy)
      }
    }
    const data = gridCtx.getImageData(0, 0, cols, rows).data
    const t1 = DEBUG ? performance.now() : 0
    if (simulate) this.field.step(dt, data)
    const t2 = DEBUG ? performance.now() : 0

    const { ox, oy } = this.field
    const { glyphOf, alphaOf, bucketOf, dim, shown, flying } = this
    let drawn = 0
    let airborne = 0
    for (let j = 0; j < rows; j++) {
      const y = j * ch
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i
        const a = data[(k << 2) + 3]
        let key = 0
        if (a >= ALPHA_MIN) {
          if (ox[k] !== 0 || oy[k] !== 0) {
            flying[airborne++] = k
          } else {
            const bucket = bucketOf[data[k << 2]]
            const level = Math.min(LEVELS - 1, (alphaOf[a] * dim[bucket] * LEVELS) | 0)
            key = glyphOf[a] | (bucket << BUCKET_SHIFT) | (level << LEVEL_SHIFT)
          }
        }
        if (key === shown[k]) continue
        shown[k] = key
        const x = i * cw
        ctx.clearRect(x, y, cw, ch)
        if (key === 0) continue
        ctx.globalAlpha = ((key >> LEVEL_SHIFT) + 0.5) / LEVELS
        ctx.drawImage(atlas, (key & 15) * cw, ((key >> BUCKET_SHIFT) & 3) * ch, cw, ch, x, y, cw, ch)
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
        if (x >= width || x + cw <= 0 || y >= skyDev || y + ch <= 0) continue
        const a = data[(k << 2) + 3]
        const bucket = bucketOf[data[k << 2]]
        const t = Math.min(1, Math.sqrt(dx * dx + dy * dy) / I.flyRange)
        const glyph = Math.max(1, Math.round(glyphOf[a] * (1 - I.glyphFade * t)))
        ov.globalAlpha = alphaOf[a] * dim[bucket] * (1 - I.alphaFade * t)
        ov.drawImage(atlas, glyph * cw, bucket * ch, cw, ch, x, y, cw, ch)
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

  private dropSheet(): void {
    if (this.sheet) closeSheet(this.sheet)
    this.sheet = null
  }

  private dropAtlas(): void {
    this.atlas?.close()
    this.atlas = null
  }
}
