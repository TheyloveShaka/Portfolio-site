import { clamp } from './math'

export type RGB = readonly [number, number, number]

export interface CloudPalette {
  lit: RGB
  haze: RGB
  ink: RGB
}

export type PaletteOverride = Partial<Record<keyof CloudPalette, string>>

export interface LayerSpec {
  scale: number
  speed: number
  alpha: number
  haze: number
  band: readonly [number, number]
  clouds: number
  response: number
}

export interface Quality {
  layers: number
  spritesPerLayer: number
  countScale: number
  maxDpr: number
  cellScale: number
}

export interface CellSize {
  w: number
  h: number
}

export const BASE_SPRITE_WIDTH = 460
export const SPRITE_ASPECT = 0.62
export const REFERENCE_WIDTH = 1440

export const HILL = { imageW: 1920, imageH: 1200, horizon: 0.58 } as const

export const RAMP = ' .\'`:-=+*#%@'
export const GLYPH_ADVANCE = 0.6
export const ALPHA_MIN = 30
export const DENSITY_OVERSAMPLE = 2
export const COMPACT_BELOW = 768
export const CELL_DESKTOP: CellSize = { w: 8, h: 13 }
export const CELL_COMPACT: CellSize = { w: 9, h: 14 }

export const INTERACTION = {
  radius: 140,
  push: 90,
  burst: 1.1,
  maxSpeed: 2400,
  speedDecay: 0.12,
  hold: 0.35,
  fade: 1,
  omega: 7,
  zeta: 0.8,
  ringRadius: 400,
  ringLife: 0.8,
  ringBand: 70,
  ringAcc: 12000,
  flyRange: 90,
  glyphFade: 0.88,
  alphaFade: 0.35,
  compactScale: 0.75,
  touch: 0.45,
  settleDist: 0.15,
  settleSpeed: 2,
} as const

export const LAYERS: readonly LayerSpec[] = [
  { scale: 0.36, speed: 3, alpha: 0.6, haze: 0.4, band: [0.04, 0.3], clouds: 5, response: 0.35 },
  { scale: 0.58, speed: 5.5, alpha: 0.76, haze: 0.22, band: [0.12, 0.46], clouds: 3.4, response: 0.55 },
  { scale: 0.85, speed: 9, alpha: 0.9, haze: 0.08, band: [0.28, 0.68], clouds: 2.5, response: 0.8 },
  { scale: 1.05, speed: 14, alpha: 0.97, haze: 0, band: [0.5, 0.88], clouds: 1, response: 1 },
]

const LAYER_PICKS: Record<number, readonly number[]> = {
  1: [2],
  2: [1, 3],
  3: [0, 2, 3],
  4: [0, 1, 2, 3],
}

export const pickLayers = (count: number): readonly number[] => LAYER_PICKS[clamp(Math.round(count), 1, 4)]

export const spriteSize = (layer: LayerSpec, scale: number): { w: number; h: number } => {
  const w = BASE_SPRITE_WIDTH * layer.scale * scale
  return { w, h: w * SPRITE_ASPECT }
}

export const viewScale = (width: number): number => clamp(width / REFERENCE_WIDTH, 0.42, 1.2)

export const horizonY = (width: number, height: number): number => {
  const s = Math.max(width / HILL.imageW, height / HILL.imageH)
  const imageH = HILL.imageH * s
  return height - imageH + imageH * HILL.horizon
}

export const cellFor = (width: number, quality: Quality): CellSize => {
  const base = width < COMPACT_BELOW ? CELL_COMPACT : CELL_DESKTOP
  return { w: base.w * quality.cellScale, h: base.h * quality.cellScale }
}

export const resolveQuality = (requestedLayers?: number): Quality => {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  const lowEnd = (nav.hardwareConcurrency ?? 8) <= 4 || nav.connection?.saveData === true
  const ceiling = lowEnd ? 3 : 4
  const layers = clamp(Math.round(requestedLayers ?? ceiling), 1, ceiling)
  return lowEnd
    ? { layers, spritesPerLayer: 2, countScale: 0.6, maxDpr: 1.5, cellScale: 1.3 }
    : { layers, spritesPerLayer: 3, countScale: 1, maxDpr: 2, cellScale: 1 }
}

const parseHex = (value: string): RGB => {
  const m = /^#?([0-9a-f]{6})$/i.exec(value.trim())
  if (!m) return [255, 255, 255]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const resolvePalette = (isNight: boolean, override?: PaletteOverride): CloudPalette => {
  const styles = getComputedStyle(document.documentElement)
  const cloud = isNight ? '--cloud-night-' : '--cloud-'
  const ink = isNight ? '--sky-night-top' : '--sky-top'
  return {
    lit: parseHex(override?.lit ?? styles.getPropertyValue(cloud + 'lit')),
    haze: parseHex(override?.haze ?? styles.getPropertyValue(cloud + 'haze')),
    ink: parseHex(override?.ink ?? styles.getPropertyValue(ink)),
  }
}

export const resolveGlyphFont = (): string => {
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()
  return family || 'monospace'
}
