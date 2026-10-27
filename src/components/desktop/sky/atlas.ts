import { lerp } from './math'
import {
  ATLAS_BUCKETS,
  GLYPH_ADVANCE,
  RAMP,
  TONES,
  TONE_MIX,
  type CloudPalette,
  type LayerSpec,
  type RGB,
} from './config'

const HAZE_MIX = 1.1
const SHADE_HAZE = 0.55
const SHADOW_DARKEN = 0.6
const SHADOW_FROM = 6
const SHADOW_ALPHA_MIN = 0.16
const SHADOW_ALPHA_MAX = 0.5
const HEAVY_FROM = 9
const WEIGHT_LIGHT = 400
const WEIGHT_HEAVY = 500
const BASELINE = 0.35

const css = (c: RGB, a = 1): string => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`

const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

const darken = (c: RGB, f: number): RGB => [c[0] * f, c[1] * f, c[2] * f]

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
  atlas.height = ATLAS_BUCKETS * TONES * ch
  const ctx = atlas.getContext('2d')
  if (!ctx) return atlas

  const px = glyphFontPx(cw, ch)
  const drop = Math.max(1, Math.round(cw / 8))
  const baseline = Math.round(ch / 2 + px * BASELINE)
  const shadowRgb = darken(palette.ink, SHADOW_DARKEN)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  layers.forEach((layer, bucket) => {
    const haze = Math.min(1, layer.haze * HAZE_MIX)
    const lit = mix(palette.lit, palette.haze, haze)
    const shade = mix(palette.shade, palette.haze, haze * SHADE_HAZE)
    for (let tone = 0; tone < TONES; tone++) {
      const row = bucket | (tone << 2)
      const body = css(mix(lit, shade, TONE_MIX[tone]))
      for (let g = 1; g < RAMP.length; g++) {
        ctx.save()
        ctx.beginPath()
        ctx.rect(g * cw, row * ch, cw, ch)
        ctx.clip()
        ctx.font = `${g >= HEAVY_FROM ? WEIGHT_HEAVY : WEIGHT_LIGHT} ${px}px ${family}`
        if (g >= SHADOW_FROM) {
          const alpha = lerp(SHADOW_ALPHA_MIN, SHADOW_ALPHA_MAX, (g - SHADOW_FROM) / (RAMP.length - 1 - SHADOW_FROM))
          ctx.fillStyle = css(shadowRgb, alpha)
          ctx.fillText(RAMP[g], g * cw + cw / 2, row * ch + baseline + drop)
        }
        ctx.fillStyle = body
        ctx.fillText(RAMP[g], g * cw + cw / 2, row * ch + baseline)
        ctx.restore()
      }
    }
  })
  return atlas
}
