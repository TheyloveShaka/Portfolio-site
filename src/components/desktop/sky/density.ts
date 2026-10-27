import type { Cloud } from './world'

export interface SpriteDensity {
  w: number
  h: number
  alpha: Uint8Array
  depth: number
}

export type DensitySheet = SpriteDensity[][]

const MIN_GAIN = 0.004

export class DensityGrid {
  cols = 0
  rows = 0
  data = new Uint8ClampedArray(0)
  private rowFade = new Float32Array(0)
  private colX0 = new Int32Array(0)
  private colX1 = new Int32Array(0)
  private colFx = new Float32Array(0)

  resize(cols: number, rows: number, rowFade: Float32Array): void {
    this.cols = cols
    this.rows = rows
    this.data = new Uint8ClampedArray(cols * rows * 4)
    this.rowFade = rowFade
    this.colX0 = new Int32Array(cols)
    this.colX1 = new Int32Array(cols)
    this.colFx = new Float32Array(cols)
  }

  compose(clouds: readonly Cloud[], sheet: DensitySheet, ix: number, iy: number): void {
    const { cols, rows, data, rowFade, colX0, colX1, colFx } = this
    data.fill(0)
    for (const cloud of clouds) {
      const sprites = sheet[cloud.layer]
      for (const item of cloud.items) {
        const gx = item.dx * ix
        const gy = item.dy * iy
        const gw = item.dw * ix
        const gh = item.dh * iy
        if (gw <= 0 || gh <= 0) continue
        const i0 = Math.max(0, Math.floor(gx))
        const i1 = Math.min(cols - 1, Math.ceil(gx + gw) - 1)
        const j0 = Math.max(0, Math.floor(gy))
        const j1 = Math.min(rows - 1, Math.ceil(gy + gh) - 1)
        if (i1 < i0 || j1 < j0) continue

        const { alpha, w: sw, h: sh, depth } = sprites[item.sprite]
        const sx = sw / gw
        const sy = sh / gh
        const maxX = sw - 1
        const maxY = sh - 1

        for (let i = i0; i <= i1; i++) {
          const u = (i + 0.5 - gx) * sx - 0.5
          const x0 = Math.floor(u)
          const x1 = x0 + 1
          colFx[i] = u - x0
          colX0[i] = x0 < 0 ? 0 : x0 > maxX ? maxX : x0
          colX1[i] = x1 < 0 ? 0 : x1 > maxX ? maxX : x1
        }

        for (let j = j0; j <= j1; j++) {
          const gain = rowFade[j] * item.alpha
          if (gain < MIN_GAIN) continue
          const v = (j + 0.5 - gy) * sy - 0.5
          const y0 = Math.floor(v)
          const y1 = y0 + 1
          const fy = v - y0
          const r0 = (y0 < 0 ? 0 : y0 > maxY ? maxY : y0) * sw
          const r1 = (y1 < 0 ? 0 : y1 > maxY ? maxY : y1) * sw
          const rowBase = j * cols
          for (let i = i0; i <= i1; i++) {
            const x0 = colX0[i]
            const x1 = colX1[i]
            const fx = colFx[i]
            const a00 = alpha[r0 + x0]
            const a01 = alpha[r1 + x0]
            const top = a00 + (alpha[r0 + x1] - a00) * fx
            const bottom = a01 + (alpha[r1 + x1] - a01) * fx
            const s = (top + (bottom - top) * fy) * gain
            if (s < 1) continue
            const q = (rowBase + i) << 2
            const under = data[q + 3]
            if (under === 0) {
              data[q] = depth
              data[q + 3] = s
            } else {
              const keep = 1 - s / 255
              const out = s + under * keep
              data[q] = (data[q] * under * keep + depth * s) / out
              data[q + 3] = out
            }
          }
        }
      }
    }
  }
}
