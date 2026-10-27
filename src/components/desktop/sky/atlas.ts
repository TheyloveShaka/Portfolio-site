import { lerp } from './math'
import { GLYPH_ADVANCE, RAMP, type CloudPalette, type LayerSpec, type RGB } from './config'

const HAZE_MIX = 1.1
const SHADOW_ALPHA = 0.3
const BASELINE = 0.35

const css = (c: RGB, a = 1): string => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`

const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

export const glyphFontPx = (cw: number, ch: number): number => Math.min(cw / GLYPH_ADVANCE, ch * 1.05)

export const buildAtlas = (
  cw: number,
  ch: number,
  family: string,
  palette: CloudPalette,
  layers: readonly LayerSpec[],
): HTMLCanvasElement => {
  const atlas = document.createElement('canvas')
  atlas.width = RAMP.length * cw
  atlas.height = layers.length * ch
  const ctx = atlas.getContext('2d')
  if (!ctx) return atlas

  const px = glyphFontPx(cw, ch)
  const drop = Math.max(1, Math.round(cw / 8))
  const baseline = Math.round(ch / 2 + px * BASELINE)
  ctx.font = `${px}px ${family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  layers.forEach((layer, row) => {
    const tint = mix(palette.lit, palette.haze, Math.min(1, layer.haze * HAZE_MIX))
    for (let g = 1; g < RAMP.length; g++) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(g * cw, row * ch, cw, ch)
      ctx.clip()
      ctx.fillStyle = css(palette.ink, SHADOW_ALPHA)
      ctx.fillText(RAMP[g], g * cw + cw / 2, row * ch + baseline + drop)
      ctx.fillStyle = css(tint)
      ctx.fillText(RAMP[g], g * cw + cw / 2, row * ch + baseline)
      ctx.restore()
    }
  })
  return atlas
}
