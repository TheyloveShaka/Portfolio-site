import { useEffect, useRef } from 'react'
import '@/styles/ascii-sky.css'

const RAMP = ' .:-=+*#%@'
const FRAME_MS = 1000 / 24
const MOBILE_QUERY = '(max-width: 767px)'
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'
const POINTER_QUERY = '(hover: hover) and (pointer: fine)'
const STATIC_TIME = 14
const MAX_DPR = 2
const PUSH_PER_FRAME = 3.2
const DECAY = 0.93
const MAX_DISPLACEMENT = 64
const EASE_POINTER = 0.2
const EASE_STRENGTH = 0.12
const HOLE_DEPTH = 0.6

interface Metrics {
  cellW: number
  cellH: number
  fontPx: number
  scaleX: number
  scaleY: number
  radius: number
}

const DESKTOP: Metrics = { cellW: 9, cellH: 16, fontPx: 13, scaleX: 260, scaleY: 120, radius: 130 }
const MOBILE: Metrics = { cellW: 13, cellH: 22, fontPx: 17, scaleX: 180, scaleY: 90, radius: 0 }

const hash = (ix: number, iy: number): number => {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967295
}

const fade = (t: number): number => t * t * (3 - 2 * t)

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

const valueNoise = (x: number, y: number): number => {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = fade(x - x0)
  const fy = fade(y - y0)
  const a = hash(x0, y0)
  const b = hash(x0 + 1, y0)
  const c = hash(x0, y0 + 1)
  const d = hash(x0 + 1, y0 + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

const cloudField = (x: number, y: number, t: number, m: Metrics): number => {
  const px = x / m.scaleX
  const py = y / m.scaleY
  const a = valueNoise(px - t * 0.05, py)
  const b = valueNoise(px * 2.1 - t * 0.08 + 17.3, py * 2.1 + t * 0.02)
  const c = valueNoise(px * 4.3 - t * 0.12 + 5.1, py * 4.3 - t * 0.03)
  return a * 0.58 + b * 0.28 + c * 0.14
}

function AsciiSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas ? canvas.getContext('2d') : null
    if (!canvas || !ctx) return undefined

    const rootStyle = getComputedStyle(document.documentElement)
    const ink = rootStyle.getPropertyValue('--ascii-sky-ink').trim()
    const family = rootStyle.getPropertyValue('--font-mono').trim()
    const mobileMq = window.matchMedia(MOBILE_QUERY)
    const reducedMq = window.matchMedia(REDUCED_QUERY)
    const pointerMq = window.matchMedia(POINTER_QUERY)

    let metrics = DESKTOP
    let cols = 0
    let rows = 0
    let width = 0
    let height = 0
    let dispX = new Float32Array(0)
    let dispY = new Float32Array(0)
    let interactive = false
    let reduced = reducedMq.matches
    let visible = true
    let rafId = 0
    let resizeRaf = 0
    let lastFrame = 0
    let cancelled = false
    const startTime = performance.now()
    const pointer = { x: 0, y: 0, sx: 0, sy: 0, seeded: false, target: 0, strength: 0 }

    const render = (t: number, withPointer: boolean) => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = ink
      ctx.font = `${metrics.fontPx}px ${family}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (withPointer) {
        pointer.sx += (pointer.x - pointer.sx) * EASE_POINTER
        pointer.sy += (pointer.y - pointer.sy) * EASE_POINTER
        pointer.strength += (pointer.target - pointer.strength) * EASE_STRENGTH
      }
      const active = withPointer && pointer.strength > 0.002
      const radius = metrics.radius
      const r2 = radius * radius

      for (let row = 0; row < rows; row += 1) {
        const cy = row * metrics.cellH + metrics.cellH / 2
        const vertical = 1 - smoothstep(0.5, 1, row / rows)
        for (let col = 0; col < cols; col += 1) {
          const i = row * cols + col
          const cx = col * metrics.cellW + metrics.cellW / 2
          let pushX = 0
          let pushY = 0
          let hole = 0
          if (active) {
            const dx = cx - pointer.sx
            const dy = cy - pointer.sy
            const d2 = dx * dx + dy * dy
            if (d2 < r2) {
              const dist = Math.sqrt(d2) || 1
              const w = (1 - dist / radius) ** 2 * pointer.strength
              pushX = (dx / dist) * w * PUSH_PER_FRAME
              pushY = (dy / dist) * w * PUSH_PER_FRAME
              hole = w
            }
          }
          if (withPointer) {
            dispX[i] = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, dispX[i] * DECAY + pushX))
            dispY[i] = Math.max(-MAX_DISPLACEMENT, Math.min(MAX_DISPLACEMENT, dispY[i] * DECAY + pushY))
          }
          const field = cloudField(cx - dispX[i], cy - dispY[i], t, metrics)
          const density = smoothstep(0.48, 0.78, field) * vertical * (1 - hole * HOLE_DEPTH)
          const idx = Math.min(RAMP.length - 1, Math.floor(density * RAMP.length))
          if (idx > 0) ctx.fillText(RAMP[idx], cx, cy)
        }
      }
    }

    const currentTime = () => (reduced ? STATIC_TIME : (performance.now() - startTime) / 1000)

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      const mobile = mobileMq.matches
      metrics = mobile ? MOBILE : DESKTOP
      interactive = !mobile && pointerMq.matches && !reduced
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(width / metrics.cellW)
      rows = Math.ceil(height / metrics.cellH)
      dispX = new Float32Array(cols * rows)
      dispY = new Float32Array(cols * rows)
      render(currentTime(), false)
    }

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick)
      if (now - lastFrame < FRAME_MS) return
      lastFrame = now
      render((now - startTime) / 1000, interactive)
    }

    const sync = () => {
      const shouldRun = !reduced && visible && !document.hidden
      if (shouldRun && rafId === 0) {
        lastFrame = 0
        rafId = requestAnimationFrame(tick)
      } else if (!shouldRun && rafId !== 0) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }

    const onMove = (e: MouseEvent) => {
      if (!interactive) return
      pointer.x = e.clientX
      pointer.y = e.clientY
      if (!pointer.seeded) {
        pointer.sx = e.clientX
        pointer.sy = e.clientY
        pointer.seeded = true
      }
      pointer.target = e.clientY < height + metrics.radius ? 1 : 0
    }
    const onLeave = () => {
      pointer.target = 0
    }
    const onResize = () => {
      cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(layout)
    }
    const onReducedChange = () => {
      reduced = reducedMq.matches
      layout()
      sync()
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    observer.observe(canvas)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('blur', onLeave)
    window.addEventListener('resize', onResize)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.addEventListener('visibilitychange', sync)
    reducedMq.addEventListener('change', onReducedChange)
    mobileMq.addEventListener('change', layout)

    const start = () => {
      if (cancelled) return
      layout()
      sync()
    }
    if (document.fonts) {
      document.fonts.load(`${DESKTOP.fontPx}px ${family}`).then(start, start)
    } else {
      start()
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      cancelAnimationFrame(resizeRaf)
      observer.disconnect()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('blur', onLeave)
      window.removeEventListener('resize', onResize)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('visibilitychange', sync)
      reducedMq.removeEventListener('change', onReducedChange)
      mobileMq.removeEventListener('change', layout)
    }
  }, [])

  return <canvas ref={canvasRef} className="ascii-sky" aria-hidden="true" />
}

export default AsciiSky
