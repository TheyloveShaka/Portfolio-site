export const TAU = Math.PI * 2

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const smoothstep = (e0: number, e1: number, x: number): number => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const lattice = (ix: number, iy: number, seed: number): number => {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967295
}

const fade = (t: number): number => t * t * (3 - 2 * t)

const valueNoise = (x: number, y: number, seed: number): number => {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = fade(x - x0)
  const fy = fade(y - y0)
  const a = lattice(x0, y0, seed)
  const b = lattice(x0 + 1, y0, seed)
  const c = lattice(x0, y0 + 1, seed)
  const d = lattice(x0 + 1, y0 + 1, seed)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

export const fbm = (x: number, y: number, seed: number, octaves: number): number => {
  let sum = 0
  let amp = 1
  let norm = 0
  let freq = 1
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * freq, y * freq, seed + o * 101) * amp
    norm += amp
    amp *= 0.5
    freq *= 2.03
  }
  return sum / norm
}
