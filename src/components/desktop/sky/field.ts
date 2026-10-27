import { clamp } from './math'
import { ALPHA_MIN, INTERACTION as I } from './config'

const MAX_RINGS = 3
const OMEGA2 = I.omega * I.omega
const PUSH_ACC = I.push * OMEGA2
const GOLDEN = 2.399963
const DEBUG = import.meta.env.DEV

export class ParticleField {
  cols = 0
  rows = 0
  ox = new Float32Array(0)
  oy = new Float32Array(0)
  peak = 0
  readonly response = new Float32Array(256).fill(1)
  private vx = new Float32Array(0)
  private vy = new Float32Array(0)
  private spring = new Float32Array(0)
  private cellW = 1
  private cellH = 1
  private reach = 1
  private px = 0
  private py = 0
  private lastX = 0
  private lastY = 0
  private lastT = 0
  private strength = 0
  private speed = 0
  private idle = 0
  private tracking = false
  private moving = false
  private ringLive = 0
  private ringNext = 0
  private readonly ringX = new Float32Array(MAX_RINGS)
  private readonly ringY = new Float32Array(MAX_RINGS)
  private readonly ringAge = new Float32Array(MAX_RINGS).fill(-1)
  private readonly ringStrength = new Float32Array(MAX_RINGS)

  get awake(): boolean {
    return this.moving || this.ringLive > 0 || (this.strength > 0 && this.idle < I.hold + I.fade)
  }

  resize(cols: number, rows: number, cellW: number, cellH: number, viewWidth: number): void {
    this.cellW = cellW
    this.cellH = cellH
    this.reach = viewWidth < 768 ? I.compactScale : 1
    if (cols !== this.cols || rows !== this.rows) {
      this.cols = cols
      this.rows = rows
      const n = cols * rows
      this.ox = new Float32Array(n)
      this.oy = new Float32Array(n)
      this.vx = new Float32Array(n)
      this.vy = new Float32Array(n)
      this.spring = new Float32Array(n)
      for (let k = 0; k < n; k++) this.spring[k] = 0.88 + 0.24 * (((k * 2654435761) >>> 0) / 4294967296)
    }
    this.reset()
  }

  reset(): void {
    this.ox.fill(0)
    this.oy.fill(0)
    this.vx.fill(0)
    this.vy.fill(0)
    this.ringAge.fill(-1)
    this.ringLive = 0
    this.moving = false
    this.strength = 0
    this.tracking = false
    this.speed = 0
    this.peak = 0
  }

  aim(x: number, y: number, t: number, strength: number): void {
    if (this.tracking) {
      const dt = Math.max((t - this.lastT) / 1000, 0.004)
      const v = Math.min(Math.hypot(x - this.lastX, y - this.lastY) / dt, I.maxSpeed)
      this.speed += (v - this.speed) * 0.5
    }
    this.tracking = true
    this.lastX = x
    this.lastY = y
    this.lastT = t
    this.px = x
    this.py = y
    this.strength = strength
    this.idle = 0
  }

  release(): void {
    this.tracking = false
    this.strength = 0
  }

  shock(x: number, y: number, strength: number): void {
    const r = this.ringNext
    this.ringNext = (r + 1) % MAX_RINGS
    if (this.ringAge[r] < 0) this.ringLive++
    this.ringX[r] = x
    this.ringY[r] = y
    this.ringAge[r] = 0
    this.ringStrength[r] = strength
  }

  step(dt: number, data: Uint8ClampedArray): void {
    this.idle += dt
    this.speed *= Math.exp(-dt / I.speedDecay)
    const presence = this.strength > 0 ? clamp(1 - (this.idle - I.hold) / I.fade, 0, 1) : 0
    if (presence > 0) this.push(dt, data, presence * this.strength)
    for (let r = 0; r < MAX_RINGS; r++) {
      if (this.ringAge[r] < 0) continue
      this.ringAge[r] += dt
      if (this.ringAge[r] > I.ringLife) {
        this.ringAge[r] = -1
        this.ringLive--
        continue
      }
      this.wave(r, dt, data)
    }
    if (this.moving || presence > 0 || this.ringLive > 0) this.integrate(dt)
  }

  private push(dt: number, data: Uint8ClampedArray, gain: number): void {
    const { cols, rows, cellW, cellH, px, py, vx, vy, response } = this
    const radius = I.radius * this.reach
    const r2 = radius * radius
    const accel = (PUSH_ACC * this.reach + I.burst * this.speed) * gain * dt
    const i0 = Math.max(0, Math.floor((px - radius) / cellW))
    const i1 = Math.min(cols - 1, Math.floor((px + radius) / cellW))
    const j0 = Math.max(0, Math.floor((py - radius) / cellH))
    const j1 = Math.min(rows - 1, Math.floor((py + radius) / cellH))
    for (let j = j0; j <= j1; j++) {
      const hy = (j + 0.5) * cellH - py
      for (let i = i0; i <= i1; i++) {
        const k = j * cols + i
        if (data[(k << 2) + 3] < ALPHA_MIN) continue
        const hx = (i + 0.5) * cellW - px
        const d2 = hx * hx + hy * hy
        if (d2 >= r2) continue
        const d = Math.sqrt(d2)
        const u = 1 - d / radius
        const g = u * u * (3 - 2 * u) * accel * response[data[k << 2]]
        if (d < 1) {
          vx[k] += Math.cos(k * GOLDEN) * g
          vy[k] += Math.sin(k * GOLDEN) * g
        } else {
          vx[k] += (hx / d) * g
          vy[k] += (hy / d) * g
        }
      }
    }
  }

  private wave(ring: number, dt: number, data: Uint8ClampedArray): void {
    const { cols, rows, cellW, cellH, vx, vy, response } = this
    const cx = this.ringX[ring]
    const cy = this.ringY[ring]
    const p = this.ringAge[ring] / I.ringLife
    const q = 1 - p
    const band = I.ringBand * this.reach
    const radius = I.ringRadius * this.reach * (1 - q * q * q)
    const reachOut = radius + band
    const accel = I.ringAcc * q * Math.sqrt(q) * this.ringStrength[ring] * dt
    const i0 = Math.max(0, Math.floor((cx - reachOut) / cellW))
    const i1 = Math.min(cols - 1, Math.floor((cx + reachOut) / cellW))
    const j0 = Math.max(0, Math.floor((cy - reachOut) / cellH))
    const j1 = Math.min(rows - 1, Math.floor((cy + reachOut) / cellH))
    for (let j = j0; j <= j1; j++) {
      const hy = (j + 0.5) * cellH - cy
      for (let i = i0; i <= i1; i++) {
        const k = j * cols + i
        if (data[(k << 2) + 3] < ALPHA_MIN) continue
        const hx = (i + 0.5) * cellW - cx
        const d = Math.sqrt(hx * hx + hy * hy)
        const e = (d - radius) / band
        if (e <= -1 || e >= 1) continue
        const w = 1 - e * e
        const g = w * w * accel * response[data[k << 2]]
        if (d < 1) {
          vx[k] += Math.cos(k * GOLDEN) * g
          vy[k] += Math.sin(k * GOLDEN) * g
        } else {
          vx[k] += (hx / d) * g
          vy[k] += (hy / d) * g
        }
      }
    }
  }

  private integrate(dt: number): void {
    const { ox, oy, vx, vy, spring } = this
    const n = this.cols * this.rows
    const damp = 2 * I.zeta * I.omega
    let moving = false
    let peak2 = this.peak * this.peak
    for (let k = 0; k < n; k++) {
      let x = ox[k]
      let y = oy[k]
      let u = vx[k]
      let v = vy[k]
      if (x === 0 && y === 0 && u === 0 && v === 0) continue
      const s = spring[k]
      const stiff = OMEGA2 * s * s
      const drag = damp * s
      u += (-stiff * x - drag * u) * dt
      v += (-stiff * y - drag * v) * dt
      x += u * dt
      y += v * dt
      if (Math.abs(x) < I.settleDist && Math.abs(y) < I.settleDist && Math.abs(u) < I.settleSpeed && Math.abs(v) < I.settleSpeed) {
        x = 0
        y = 0
        u = 0
        v = 0
      } else {
        moving = true
        if (DEBUG) peak2 = Math.max(peak2, x * x + y * y)
      }
      ox[k] = x
      oy[k] = y
      vx[k] = u
      vy[k] = v
    }
    this.moving = moving
    if (DEBUG) this.peak = Math.sqrt(peak2)
  }
}
