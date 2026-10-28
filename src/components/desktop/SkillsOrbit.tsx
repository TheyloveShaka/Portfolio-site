import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { brandedTools } from '@/data/stack'
import '@/styles/orbit.css'

interface SkillsOrbitProps {
  className?: string
}

interface RingConfig {
  radius: number
  count: number
  duration: number
  direction: 'cw' | 'ccw'
}

const RING_CONFIG: RingConfig[] = [
  { radius: 108, count: 10, duration: 18, direction: 'cw' },
  { radius: 166, count: 14, duration: 24, direction: 'ccw' },
  { radius: 224, count: 18, duration: 30, direction: 'cw' },
  { radius: 282, count: 22, duration: 38, direction: 'ccw' },
]

const MOBILE_RING_COUNT = 3
const HEMISPHERE_SIZE = 128
const CHIP_SIZE = 32
const GLYPH_SIZE = 24
const EDGE_PX = 4

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

function useFitScale(ref: RefObject<HTMLDivElement>, naturalWidth: number, naturalHeight: number): number {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const measure = () => {
      const width = node.clientWidth
      const height = node.clientHeight
      if (!width || !height) return
      const next = Math.min(width / naturalWidth, height / naturalHeight)
      setScale(prev => (Math.abs(prev - next) < 0.001 ? prev : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, naturalWidth, naturalHeight])
  return scale
}

function SkillsOrbit({ className = '' }: SkillsOrbitProps) {
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobile()

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const [offscreen, setOffscreen] = useState(false)
  const [tabHidden, setTabHidden] = useState(() => typeof document !== 'undefined' && document.hidden)

  useEffect(() => {
    if (reducedMotion) return undefined
    const node = bodyRef.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(node)

    const onVisibility = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  const isPaused = offscreen || tabHidden

  const ringConfig = useMemo(
    () => (isMobile ? RING_CONFIG.slice(0, MOBILE_RING_COUNT) : RING_CONFIG),
    [isMobile]
  )
  const outerRadius = ringConfig[ringConfig.length - 1].radius
  const center = outerRadius + CHIP_SIZE / 2 + EDGE_PX
  const stageWidth = center * 2
  const scale = useFitScale(bodyRef, stageWidth, center)

  let toolCursor = 0
  const rings = ringConfig.map(ring => {
    const chips = Array.from({ length: ring.count }, (_, i) => {
      const tool = brandedTools[toolCursor % brandedTools.length]
      toolCursor += 1
      return {
        key: `${ring.radius}-${i}`,
        angle: (360 * i) / ring.count,
        tool,
      }
    })
    return { ...ring, chips }
  })

  const uniqueToolNames = useMemo(() => Array.from(new Set(brandedTools.map(t => t.name))), [])

  return (
    <section
      className={`orbit-panel ${className}`.trim()}
      role="group"
      aria-labelledby="skills-orbit-heading"
    >
      <span id="skills-orbit-heading" className="orbit-panel__title">
        Tools I work with
      </span>

      <div ref={bodyRef} className="orbit-panel__body grain">
        <div
          className={`orbit-fan ${!reducedMotion && isPaused ? 'orbit-fan--paused' : ''}`.trim()}
          style={{
            width: `${stageWidth}px`,
            height: `${center}px`,
            transform: `translateX(-50%) scale(${scale})`,
          }}
        >
          <div
            className="orbit-hemisphere"
            aria-hidden="true"
            style={{
              width: `${HEMISPHERE_SIZE}px`,
              height: `${HEMISPHERE_SIZE / 2}px`,
              left: `${center - HEMISPHERE_SIZE / 2}px`,
              top: `${center - HEMISPHERE_SIZE / 2}px`,
              borderRadius: `${HEMISPHERE_SIZE / 2}px ${HEMISPHERE_SIZE / 2}px 0 0`,
            }}
          />

          {rings.map(ring => (
            <div
              key={`arc-${ring.radius}`}
              className="orbit-guide-arc"
              aria-hidden="true"
              style={{
                width: `${ring.radius * 2}px`,
                height: `${ring.radius * 2}px`,
                left: `${center - ring.radius}px`,
                top: `${center - ring.radius}px`,
              }}
            />
          ))}

          {rings.map(ring => {
            const ringAnimName = ring.direction === 'cw' ? 'orbit-ring-cw' : 'orbit-ring-ccw'
            const chipAnimName = ring.direction === 'cw' ? 'orbit-chip-counter-a' : 'orbit-chip-counter-b'
            return (
              <div
                key={ring.radius}
                className="orbit-ring"
                aria-hidden="true"
                style={{
                  left: `${center}px`,
                  top: `${center}px`,
                  animationName: reducedMotion ? undefined : ringAnimName,
                  animationDuration: reducedMotion ? undefined : `${ring.duration}s`,
                }}
              >
                {ring.chips.map(chip => (
                  <div
                    key={chip.key}
                    className="orbit-spoke"
                    style={{ transform: `rotate(${chip.angle}deg) translateX(${ring.radius}px)` }}
                  >
                    <div
                      className="orbit-chip"
                      style={{
                        width: `${CHIP_SIZE}px`,
                        height: `${CHIP_SIZE}px`,
                        marginLeft: `${-CHIP_SIZE / 2}px`,
                        marginTop: `${-CHIP_SIZE / 2}px`,
                        '--base-angle': `${-chip.angle}deg`,
                        animationName: reducedMotion ? undefined : chipAnimName,
                        animationDuration: reducedMotion ? undefined : `${ring.duration}s`,
                      } as CSSProperties}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width={GLYPH_SIZE}
                        height={GLYPH_SIZE}
                        aria-hidden="true"
                      >
                        <path d={chip.tool.icon.path} fill={`#${chip.tool.icon.hex}`} />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <ul className="sr-only" aria-label="Complete list of tools">
        {uniqueToolNames.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </section>
  )
}

export default SkillsOrbit
