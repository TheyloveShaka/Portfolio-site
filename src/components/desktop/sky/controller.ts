import { AsciiRenderer, closeSheet, depthByte, type DrawTiming } from './renderer'
import { CloudWorld } from './world'
import { bakeDensity, renderDensity } from './sprites'
import {
  INTERACTION,
  LAYERS,
  cellFor,
  pickLayers,
  resolveGlyphFont,
  resolvePalette,
  resolveQuality,
  spriteSize,
  type PaletteOverride,
} from './config'

export interface CloudSkyOptions {
  density: number
  speed: number
  layers?: number
  interaction: number
  palette?: PaletteOverride
  isNight: boolean
}

interface CloudSkyDebug {
  readonly maxDisplacement: number
  readonly avgJsMs: number
  readonly maxJsMs: number
  readonly frames: number
  readonly awake: boolean
  readonly timing: DrawTiming
  resetStats: () => void
}

const debugHost = window as unknown as { __cloudSky?: CloudSkyDebug }

const MAX_DT = 0.1
const REBUILD_BELOW = 0.72
const REBUILD_ABOVE = 1.4
const FRAME_MS = 1000 / 30
const IDLE_FRAME_MS = 1000 / 15
const FONT_WAIT_MS = 1500

const whenDesktopReady = (run: () => void): (() => void) => {
  if (document.body.dataset.introDone === 'true') {
    const id = window.setTimeout(run, 120)
    return () => window.clearTimeout(id)
  }
  const onDone = (): void => {
    window.setTimeout(run, 120)
  }
  window.addEventListener('portfolio:intro-complete', onDone, { once: true })
  return () => window.removeEventListener('portfolio:intro-complete', onDone)
}

const whenGlyphsReady = (family: string): Promise<void> => {
  const load = document.fonts.load(`16px ${family}`).then(() => undefined)
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, FONT_WAIT_MS))
  return Promise.race([load, timeout]).catch(() => undefined)
}

export const startCloudSky = (canvas: HTMLCanvasElement, opts: CloudSkyOptions): (() => void) => {
  const host = canvas.parentElement ?? canvas
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const quality = resolveQuality(opts.layers)
  const layerIds = pickLayers(quality.layers)
  const layers = layerIds.map((id) => LAYERS[id])
  const palette = resolvePalette(opts.isNight, opts.palette)
  const dpr = Math.min(window.devicePixelRatio || 1, quality.maxDpr)
  const renderer = new AsciiRenderer(canvas)
  const world = new CloudWorld({
    layers,
    slots: quality.spritesPerLayer,
    density: opts.density,
    speed: opts.speed,
    countScale: quality.countScale,
    seed: opts.isNight ? 7 : 3,
  })

  let alive = true
  let reduced = reducedQuery.matches
  let raf = 0
  let last = 0
  let buildToken = 0
  let spriteScale = 0
  let sized = false
  let ready = false
  let started = false
  let cancelWait: () => void = () => {}
  let jsTotal = 0
  let jsMax = 0
  let frames = 0

  const paintStatic = (): void => {
    world.refresh()
    renderer.draw(world, 0, false)
  }

  const tick = (now: number): void => {
    raf = requestAnimationFrame(tick)
    const gap = now - last
    if (gap < FRAME_MS) return
    if (!renderer.field.awake && gap < IDLE_FRAME_MS) return
    const dt = Math.min(gap / 1000, MAX_DT)
    last = now
    const t0 = import.meta.env.DEV ? performance.now() : 0
    world.step(dt)
    renderer.draw(world, dt, true)
    if (import.meta.env.DEV) {
      const spent = performance.now() - t0
      jsTotal += spent
      jsMax = Math.max(jsMax, spent)
      frames++
    }
  }

  const start = (): void => {
    if (raf || reduced || document.hidden || !ready || !alive) return
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  const stop = (): void => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  const build = async (): Promise<void> => {
    const token = ++buildToken
    const family = resolveGlyphFont()
    await whenGlyphsReady(family)
    if (!alive || token !== buildToken) return
    started = true
    const scale = world.scale
    const baked = Promise.all(
      layers.map((layer, li) => {
        const size = spriteSize(layer, scale)
        const depth = depthByte(li, layers.length)
        return Promise.all(
          Array.from({ length: quality.spritesPerLayer }, (_, slot) =>
            bakeDensity(
              renderDensity({
                ...size,
                seed: layerIds[li] * 1000 + slot * 37 + 11,
                depth,
                pxPerX: renderer.pxPerX,
                pxPerY: renderer.pxPerY,
              }),
            ),
          ),
        )
      }),
    )
    const [atlas, sheet] = await Promise.all([renderer.bakeAtlas(family, palette, layers), baked])
    if (!alive || token !== buildToken) {
      atlas.close()
      closeSheet(sheet)
      return
    }
    renderer.install(atlas, sheet, layers)
    spriteScale = scale
    ready = true
    renderer.show(true)
    if (reduced) paintStatic()
    else start()
  }

  const onResize = (width: number, height: number): void => {
    if (width < 1 || height < 1) return
    world.resize(width, height)
    const cellChanged = renderer.resize(width, height, dpr, world.horizon, cellFor(width, quality))
    if (!sized) {
      sized = true
      cancelWait = whenDesktopReady(() => void build())
      return
    }
    if (!started) return
    const ratio = world.scale / spriteScale
    if (cellChanged || ratio < REBUILD_BELOW || ratio > REBUILD_ABOVE) void build()
    else if (reduced) paintStatic()
  }

  const observer = new ResizeObserver((entries) => {
    const box = entries[0]?.contentRect
    if (box) onResize(Math.round(box.width), Math.round(box.height))
  })
  observer.observe(host)

  const aim = (x: number, y: number, t: number, strength: number): void => {
    if (reduced) return
    renderer.field.aim(x, y, t, strength)
  }

  const onPointerMove = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return
    aim(e.clientX, e.clientY, e.timeStamp, opts.interaction)
  }

  const onPointerDown = (e: PointerEvent): void => {
    if (reduced) return
    const touch = e.pointerType === 'touch'
    renderer.field.shock(e.clientX, e.clientY, touch ? INTERACTION.touch * opts.interaction : opts.interaction)
  }

  const onTouchMove = (e: TouchEvent): void => {
    const touch = e.touches[0]
    if (touch) aim(touch.clientX, touch.clientY, e.timeStamp, INTERACTION.touch * opts.interaction)
  }

  const onRelease = (): void => {
    renderer.field.release()
  }

  const onVisibility = (): void => {
    if (document.hidden) stop()
    else start()
  }

  const onReducedChange = (e: MediaQueryListEvent): void => {
    reduced = e.matches
    if (reduced) {
      stop()
      renderer.field.reset()
      if (ready) paintStatic()
    } else {
      start()
    }
  }

  document.addEventListener('visibilitychange', onVisibility)
  reducedQuery.addEventListener('change', onReducedChange)
  if (opts.interaction > 0) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onRelease, { passive: true })
    window.addEventListener('touchcancel', onRelease, { passive: true })
    document.documentElement.addEventListener('mouseleave', onRelease)
  }

  if (import.meta.env.DEV) {
    const debug: CloudSkyDebug = {
      get maxDisplacement() {
        return renderer.field.peak
      },
      get avgJsMs() {
        return frames ? jsTotal / frames : 0
      },
      get maxJsMs() {
        return jsMax
      },
      get frames() {
        return frames
      },
      get awake() {
        return renderer.field.awake
      },
      get timing() {
        return renderer.timing
      },
      resetStats: () => {
        jsTotal = 0
        jsMax = 0
        frames = 0
        Object.assign(renderer.timing, { density: 0, step: 0, glyphs: 0, drawn: 0, frames: 0 })
      },
    }
    debugHost.__cloudSky = debug
  }

  return () => {
    alive = false
    buildToken++
    cancelWait()
    stop()
    observer.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    reducedQuery.removeEventListener('change', onReducedChange)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onRelease)
    window.removeEventListener('touchcancel', onRelease)
    document.documentElement.removeEventListener('mouseleave', onRelease)
    if (import.meta.env.DEV) delete debugHost.__cloudSky
    renderer.show(false)
    renderer.release()
  }
}
