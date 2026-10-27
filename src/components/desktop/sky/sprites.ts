import { clamp, fbm, mulberry32, smoothstep, TAU } from './math'
import type { SpriteDensity } from './density'

interface Puff {
  x: number
  y: number
  r: number
}

export interface DensitySpec {
  w: number
  h: number
  seed: number
  depth: number
  pxPerX: number
  pxPerY: number
}

const BASE_FRACTION = 0.8

const buildPuffs = (W: number, H: number, baseY: number, rng: () => number): Puff[] => {
  const puffs: Puff[] = []
  const left = W * 0.1
  const span = W * 0.8
  const envelope = (x: number): number => Math.pow(Math.max(Math.sin(Math.PI * clamp((x - left) / span, 0, 1)), 0), 0.6)
  const lumps = 3 + Math.floor(rng() * 3)

  for (let i = 0; i < lumps; i++) {
    const lx = left + span * ((i + 0.5 + (rng() - 0.5) * 0.45) / lumps)
    const lift = 0.7 + 0.5 * rng()
    const R = Math.min(
      W * (0.085 + 0.1 * rng()) * (0.55 + 0.65 * envelope(lx)),
      (baseY - H * 0.05) / (lift + 1.5),
      (lx - W * 0.02) / 1.6,
      (W * 0.98 - lx) / 1.6,
    )
    const ly = baseY - R * lift
    const total = Math.round(16 + rng() * 8)
    puffs.push({ x: lx, y: ly, r: R * 0.9 })
    for (let j = 0; j < total; j++) {
      const shell = j < total * 0.7
      const theta = shell ? -Math.PI * (-0.03 + 1.06 * rng()) : -Math.PI * rng()
      const rho = shell ? R * (0.72 + 0.32 * rng()) : R * 0.55 * rng()
      const r = shell ? R * (0.34 + 0.2 * rng()) : R * (0.5 + 0.25 * rng())
      puffs.push({ x: lx + Math.cos(theta) * rho, y: ly + Math.sin(theta) * rho * 0.92, r })
    }
  }

  const baseCount = Math.round(12 + rng() * 6)
  for (let i = 0; i < baseCount; i++) {
    const x = W * 0.16 + W * 0.68 * rng()
    const r = W * (0.04 + 0.045 * rng()) * (0.5 + 0.7 * envelope(x))
    puffs.push({ x, y: baseY - r * (0.5 + 0.3 * rng()), r })
  }

  const parents = puffs.filter((p) => p.r > W * 0.03)
  const detail = Math.round(38 + rng() * 24)
  for (let i = 0; i < detail; i++) {
    const parent = parents[Math.floor(rng() * parents.length)]
    const theta = -Math.PI * (-0.04 + 1.08 * rng())
    const dist = parent.r * (0.78 + 0.22 * rng())
    const r = parent.r * (0.16 + 0.2 * rng())
    const y = parent.y + Math.sin(theta) * dist
    const x = parent.x + Math.cos(theta) * dist
    if (y > baseY - r * 0.4 || y < r + H * 0.01 || x < r + W * 0.01 || x > W - r - W * 0.01) continue
    puffs.push({ x, y, r })
  }
  return puffs
}

export const renderDensity = (spec: DensitySpec): SpriteDensity => {
  const cw = Math.max(8, Math.ceil(spec.w * spec.pxPerX))
  const ch = Math.max(6, Math.ceil(spec.h * spec.pxPerY))
  const alpha = new Uint8Array(cw * ch)
  const sprite: SpriteDensity = { w: cw, h: ch, alpha, depth: spec.depth }
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return sprite

  const rng = mulberry32(spec.seed)
  const baseY = spec.h * BASE_FRACTION
  const puffs = buildPuffs(spec.w, spec.h, baseY, rng)

  ctx.setTransform(cw / spec.w, 0, 0, ch / spec.h, 0, 0)
  for (const p of puffs) {
    const body = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
    const weight = 0.5 + 0.35 * rng()
    body.addColorStop(0, `rgba(255,255,255,${weight})`)
    body.addColorStop(0.55, `rgba(255,255,255,${weight * 0.82})`)
    body.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, TAU)
    ctx.fill()
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  const px = ctx.getImageData(0, 0, cw, ch).data
  for (let y = 0; y < ch; y++) {
    const v = y / ch
    const base = 1 - smoothstep(BASE_FRACTION - 0.03, BASE_FRACTION + 0.1, v)
    for (let x = 0; x < cw; x++) {
      const a = px[(y * cw + x) * 4 + 3]
      if (a === 0) continue
      const grain = smoothstep(0.3, 0.72, fbm((x / cw) * 9, (y / ch) * 6, spec.seed, 3))
      const body = Math.pow(a / 255, 1.5) * 255
      alpha[y * cw + x] = clamp(body * (0.45 + 0.95 * grain) * base, 0, 255)
    }
  }
  canvas.width = 0
  return sprite
}
