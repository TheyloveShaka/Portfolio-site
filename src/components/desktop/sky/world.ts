import { clamp, lerp, mulberry32, TAU } from './math'
import { BASE_SPRITE_WIDTH, SPRITE_ASPECT, horizonY, viewScale, type LayerSpec } from './config'

export interface WorldOptions {
  layers: readonly LayerSpec[]
  slots: number
  density: number
  speed: number
  countScale: number
  seed: number
}

export interface CloudItem {
  sprite: number
  w1: number
  h1: number
  bx: number
  by: number
  bs: number
  ba: number
  phase: number
  period: number
  ampX: number
  ampY: number
  ampS: number
  ampA: number
  dx: number
  dy: number
  dw: number
  dh: number
  alpha: number
}

export interface Cloud {
  layer: number
  x: number
  y: number
  speed: number
  margin: number
  alpha: number
  items: CloudItem[]
}

export class CloudWorld {
  readonly clouds: Cloud[] = []
  width = 0
  height = 0
  scale = 1
  horizon = 0
  private time = 0
  private populatedWidth = 0

  constructor(private readonly opts: WorldOptions) {}

  resize(width: number, height: number): void {
    const prevW = this.width
    const prevH = this.height
    this.width = width
    this.height = height
    this.scale = viewScale(width)
    this.horizon = horizonY(width, height)
    if (!prevW || Math.abs(width / this.populatedWidth - 1) > 0.3) {
      this.populate()
    } else {
      for (const cloud of this.clouds) {
        cloud.x *= width / prevW
        cloud.y *= height / prevH
      }
    }
    this.refresh()
  }

  step(dt: number): void {
    this.time += dt
    const k = this.scale
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * this.opts.speed * k * dt
      if (cloud.x > this.width + cloud.margin) cloud.x -= this.width + 2 * cloud.margin
      for (const item of cloud.items) this.project(cloud, item)
    }
  }

  refresh(): void {
    for (const cloud of this.clouds) for (const item of cloud.items) this.project(cloud, item)
  }

  private project(cloud: Cloud, item: CloudItem): void {
    const k = this.scale
    const phase = (TAU * this.time) / item.period + item.phase
    const s = item.bs * (1 + item.ampS * Math.sin(phase * 0.7 + 2.1))
    item.dw = item.w1 * s * k
    item.dh = item.h1 * s * k
    const cx = cloud.x + (item.bx + item.ampX * Math.sin(phase)) * k
    const cy = cloud.y + (item.by + item.ampY * Math.sin(phase * 0.83 + 1.7)) * k
    item.dx = cx - item.dw / 2
    item.dy = cy - item.dh / 2
    item.alpha = clamp(item.ba * (1 + item.ampA * Math.sin(phase * 1.17 + 0.6)), 0, 1) * cloud.alpha
  }

  private populate(): void {
    const rng = mulberry32(this.opts.seed)
    const { layers, slots, density, countScale } = this.opts
    const k = this.scale
    const widthFactor = clamp(this.width / 1440, 0.8, 1.5)
    this.clouds.length = 0
    this.populatedWidth = this.width

    layers.forEach((layer, li) => {
      const w1 = BASE_SPRITE_WIDTH * layer.scale
      const h1 = w1 * SPRITE_ASPECT
      const margin = 1.2 * w1 * k
      const span = this.width + 2 * margin
      const count = Math.max(1, Math.round(layer.clouds * density * countScale * widthFactor * (span / this.width)))
      const offset = rng()

      for (let n = 0; n < count; n++) {
        const x = -margin + span * ((n + 0.5 + (rng() - 0.5) * 0.5) / count)
        const band = (offset + n * 0.618) % 1
        const y = lerp(layer.band[0], layer.band[1], band) * this.horizon
        const members = 2 + (rng() < 0.45 ? 1 : 0)
        const main = Math.floor(rng() * slots)
        const items: CloudItem[] = []

        for (let j = 0; j < members; j++) {
          const lead = j === 0
          const side = j % 2 === 1 ? 1 : -1
          items.push({
            sprite: slots > 1 ? (main + j) % slots : 0,
            w1,
            h1,
            bx: lead ? 0 : side * w1 * (0.32 + 0.22 * rng()),
            by: lead ? 0 : (rng() - 0.5) * h1 * 0.3 - (j === 2 ? h1 * 0.1 : 0),
            bs: lead ? 0.95 + 0.25 * rng() : 0.7 + 0.3 * rng(),
            ba: lead ? 1 : 0.72 + 0.25 * rng(),
            phase: TAU * rng(),
            period: 38 + 50 * rng(),
            ampX: w1 * 0.035 * (1 + rng()),
            ampY: h1 * 0.03 * (1 + rng()),
            ampS: 0.04,
            ampA: 0.16,
            dx: 0,
            dy: 0,
            dw: 0,
            dh: 0,
            alpha: 0,
          })
        }
        items.reverse()
        this.clouds.push({
          layer: li,
          x,
          y,
          speed: layer.speed * (0.85 + 0.3 * rng()),
          margin,
          alpha: layer.alpha,
          items,
        })
      }
    })
  }
}
