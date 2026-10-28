import { useEffect, useRef, useState, type CSSProperties } from 'react'
import clippy, { Agent } from 'clippyts'

import WizardChat from './WizardChat'
import { useWindows } from '@contexts/WindowsContext'
import { durDevelop, durMinimise, prefersReducedMotion, staggerIcon, staggerObject } from '@/styles/motion'
import { greet, isMerlinBusy, playFriendly, playIdle } from './merlinActions'
import './wizard.css'

const INTRO_START_EVENT = 'portfolio:intro-start'
const INTRO_COMPLETE_EVENT = 'portfolio:intro-complete'
const MERLIN_EVENT = 'portfolio:open-merlin'
const INTRO_SAFETY_NET_MS = 20000

const useDesktopReady = (): boolean => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return undefined

    const isDone = () => document.body.dataset.introDone === 'true'
    const isStarted = () => document.body.dataset.introStarted === 'true' || isDone()

    if (isDone()) {
      setReady(true)
      return undefined
    }

    let safetyTimer: number | undefined

    const armSafetyNet = () => {
      if (safetyTimer !== undefined) return
      safetyTimer = window.setTimeout(() => setReady(true), INTRO_SAFETY_NET_MS)
    }

    if (isStarted()) armSafetyNet()

    const onIntroStart = () => armSafetyNet()
    const onIntroComplete = () => setReady(true)
    window.addEventListener(INTRO_START_EVENT, onIntroStart)
    window.addEventListener(INTRO_COMPLETE_EVENT, onIntroComplete)

    const interval = window.setInterval(() => {
      if (isDone()) {
        setReady(true)
      } else if (isStarted()) {
        armSafetyNet()
      }
    }, 400)

    return () => {
      window.removeEventListener(INTRO_START_EVENT, onIntroStart)
      window.removeEventListener(INTRO_COMPLETE_EVENT, onIntroComplete)
      window.clearInterval(interval)
      if (safetyTimer !== undefined) window.clearTimeout(safetyTimer)
    }
  }, [ready])

  return ready
}

const SPARKLE_PARTICLES = Array.from({ length: 7 }, (_, i) => ({
  angle: (360 / 7) * i,
  delay: (i % 3) * staggerIcon,
}))

const isNarrow = () => window.innerWidth < 768

const merlinHome = () => ({
  x: isNarrow() ? window.innerWidth / 2 - 64 : window.innerWidth - 150,
  y: window.innerHeight - 170,
})

const merlinSparklePosition = () => ({
  x: isNarrow() ? window.innerWidth / 2 : window.innerWidth - 100,
  y: window.innerHeight - 120,
})

type MerlinLifecycle = 'idle' | 'opening' | 'open' | 'closing'

const CLICK_DISTANCE_THRESHOLD_PX = 4
const DRAG_MOVED_THRESHOLD_PX = 12
const REHOME_SETTLE_MS = 400
const IDLE_MIN_MS = 25000
const IDLE_SPREAD_MS = 20000

const clampSprite = (el: HTMLElement) => {
  const root = getComputedStyle(document.documentElement)
  const margin = parseFloat(root.getPropertyValue('--sp-2')) || 8
  const taskbar = parseFloat(root.getPropertyValue('--taskbar-h')) || 40
  const rect = el.getBoundingClientRect()
  if (!rect.width) return
  const maxRight = window.innerWidth - margin
  const maxBottom = window.innerHeight - taskbar - margin
  let dx = 0
  let dy = 0
  if (rect.right > maxRight) dx = maxRight - rect.right
  if (rect.left + dx < margin) dx = margin - rect.left
  if (rect.bottom > maxBottom) dy = maxBottom - rect.bottom
  if (rect.top + dy < margin) dy = margin - rect.top
  if (!dx && !dy) return
  const style = getComputedStyle(el)
  el.style.left = `${parseFloat(style.left) + dx}px`
  el.style.top = `${parseFloat(style.top) + dy}px`
}

const Wizard = () => {
  const desktopReady = useDesktopReady()
  const { windows, openOrFocusWindow } = useWindows()
  const chatOpen = windows.merlinChat.visibility
  const [lifecycle, setLifecycle] = useState<MerlinLifecycle>('idle')
  const [sparkle, setSparkle] = useState<{ x: number; y: number } | null>(null)
  const agentRef = useRef<Agent | null>(null)
  const loadStartedRef = useRef(false)
  const sparkleTimeoutRef = useRef<number>()
  const lifecycleTimeoutRef = useRef<number>()
  const skipFirstLifecycleSyncRef = useRef(true)
  const mouseDownPointRef = useRef<{ x: number; y: number } | null>(null)
  const chatOpenRef = useRef(false)
  const userDraggedRef = useRef(false)
  const placedRef = useRef<{ x: number; y: number } | null>(null)
  const idleTimerRef = useRef<number>()
  const openOrFocusWindowRef = useRef(openOrFocusWindow)
  useEffect(() => {
    openOrFocusWindowRef.current = openOrFocusWindow
  }, [openOrFocusWindow])

  useEffect(() => {
    chatOpenRef.current = chatOpen
    if (!chatOpen) return
    const agent = agentRef.current
    if (agent) greet(agent)
  }, [chatOpen])

  useEffect(() => {
    if (!desktopReady) return undefined
    const tick = () => {
      const agent = agentRef.current
      const paused = document.hidden || chatOpenRef.current || isMerlinBusy() || prefersReducedMotion()
      if (agent && !paused) playIdle(agent)
      schedule()
    }
    const schedule = () => {
      idleTimerRef.current = window.setTimeout(tick, IDLE_MIN_MS + Math.random() * IDLE_SPREAD_MS)
    }
    schedule()
    return () => {
      if (idleTimerRef.current !== undefined) window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = undefined
    }
  }, [desktopReady])

  useEffect(() => {
    if (skipFirstLifecycleSyncRef.current) {
      skipFirstLifecycleSyncRef.current = false
      return undefined
    }
    const duration = prefersReducedMotion() ? 0 : durMinimise
    setLifecycle(chatOpen ? 'opening' : 'closing')
    lifecycleTimeoutRef.current = window.setTimeout(() => {
      setLifecycle(chatOpen ? 'open' : 'idle')
    }, duration)
    return () => {
      if (lifecycleTimeoutRef.current) window.clearTimeout(lifecycleTimeoutRef.current)
    }
  }, [chatOpen])

  useEffect(() => {
    if (!desktopReady || loadStartedRef.current) return undefined

    if (document.querySelector('.clippy')) return undefined

    loadStartedRef.current = true

    let mouseDownHandler: ((e: MouseEvent) => void) | undefined
    let clickHandler: ((e: MouseEvent) => void) | undefined
    let dblClickGuard: ((e: MouseEvent) => void) | undefined
    let settle: (() => void) | undefined
    let onPointerEnd: (() => void) | undefined
    let onViewportChange: (() => void) | undefined
    let rehomeTimer: number | undefined
    let el: HTMLElement | null = null

    clippy.load({
      name: 'Merlin',
      successCb: (agent) => {
        agentRef.current = agent
        agent.show(true)
        const home = merlinHome()
        agent.moveTo(home.x, home.y, 0)

        setSparkle(merlinSparklePosition())
        sparkleTimeoutRef.current = window.setTimeout(() => setSparkle(null), durDevelop + staggerObject * 2)

        el = document.querySelector('.clippy') as HTMLElement | null
        if (el) {
          el.style.zIndex = '4'
          el.setAttribute('role', 'button')
          el.setAttribute('aria-label', 'Ask Merlin')

          mouseDownHandler = (e: MouseEvent) => {
            mouseDownPointRef.current = { x: e.clientX, y: e.clientY }
          }
          clickHandler = (e: MouseEvent) => {
            const start = mouseDownPointRef.current
            mouseDownPointRef.current = null
            if (!start) return
            const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y)
            if (distance >= CLICK_DISTANCE_THRESHOLD_PX) return
            if (chatOpenRef.current && agentRef.current) playFriendly(agentRef.current)
            openOrFocusWindowRef.current('merlinChat')
          }
          dblClickGuard = (e: MouseEvent) => {
            if (e.target instanceof Element && e.target.closest('.clippy')) e.stopPropagation()
          }
          el.addEventListener('mousedown', mouseDownHandler)
          el.addEventListener('click', clickHandler)
          document.addEventListener('dblclick', dblClickGuard, true)

          const sprite = el
          const placeAt = (point: { x: number; y: number }) => {
            sprite.style.left = `${point.x}px`
            sprite.style.top = `${point.y}px`
            placedRef.current = point
          }
          const homeSprite = () => {
            placeAt(merlinHome())
            if (isNarrow()) {
              const rect = sprite.getBoundingClientRect()
              if (rect.width) {
                const centreError = window.innerWidth / 2 - (rect.left + rect.width / 2)
                placeAt({ x: parseFloat(sprite.style.left) + centreError, y: parseFloat(sprite.style.top) })
              }
            }
            clampSprite(sprite)
            const rect = sprite.getBoundingClientRect()
            placedRef.current = { x: rect.left, y: rect.top }
          }
          const rehome = () => {
            if (userDraggedRef.current) {
              clampSprite(sprite)
              return
            }
            homeSprite()
          }
          const noteDrag = () => {
            const placed = placedRef.current
            if (!placed || userDraggedRef.current) return
            const rect = sprite.getBoundingClientRect()
            const moved = Math.hypot(rect.left - placed.x, rect.top - placed.y)
            if (moved > DRAG_MOVED_THRESHOLD_PX) userDraggedRef.current = true
          }
          homeSprite()
          settle = () => window.requestAnimationFrame(() => clampSprite(sprite))
          onPointerEnd = () => window.requestAnimationFrame(() => {
            noteDrag()
            clampSprite(sprite)
          })
          onViewportChange = () => window.requestAnimationFrame(rehome)
          settle()
          rehomeTimer = window.setTimeout(rehome, REHOME_SETTLE_MS)
          window.addEventListener('resize', onViewportChange)
          window.addEventListener('orientationchange', onViewportChange)
          window.addEventListener('mouseup', onPointerEnd)
          window.addEventListener('touchend', onPointerEnd)
        }
      },
      failCb: (error) => {
        console.error('Merlin failed to load', error)
      },
    })

    const handleMerlinEvent = () => openOrFocusWindowRef.current('merlinChat')
    window.addEventListener(MERLIN_EVENT, handleMerlinEvent)

    return () => {
      if (sparkleTimeoutRef.current) window.clearTimeout(sparkleTimeoutRef.current)
      window.removeEventListener(MERLIN_EVENT, handleMerlinEvent)
      if (rehomeTimer !== undefined) window.clearTimeout(rehomeTimer)
      if (onViewportChange) {
        window.removeEventListener('resize', onViewportChange)
        window.removeEventListener('orientationchange', onViewportChange)
      }
      if (onPointerEnd) {
        window.removeEventListener('mouseup', onPointerEnd)
        window.removeEventListener('touchend', onPointerEnd)
      }
      if (el) {
        if (mouseDownHandler) el.removeEventListener('mousedown', mouseDownHandler)
        if (clickHandler) el.removeEventListener('click', clickHandler)
      }
      if (dblClickGuard) document.removeEventListener('dblclick', dblClickGuard, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopReady])

  if (!desktopReady) return null

  return (
    <>
      {sparkle && (
        <div
          className="wizard-sparkle"
          style={{ left: sparkle.x, top: sparkle.y }}
        >
          {SPARKLE_PARTICLES.map((p) => (
            <span
              key={p.angle}
              className="wizard-sparkle__particle"
              style={
                {
                  '--wizard-sparkle-angle': `${p.angle}deg`,
                  '--wizard-sparkle-delay': `${p.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
          <style>{`
            .wizard-sparkle__particle {
              position: absolute;
              top: 0;
              left: 0;
              width: 6px;
              height: 6px;
              margin: -3px 0 0 -3px;
              border-radius: 50%;
              background: radial-gradient(circle, #ffffff 0%, #9ed0ff 55%, rgba(47, 113, 205, 0) 100%);
              opacity: 0;
              animation: wizard-sparkle-burst 620ms ease-out forwards;
              animation-delay: var(--wizard-sparkle-delay, 0ms);
              transform: rotate(var(--wizard-sparkle-angle, 0deg)) translateX(0) scale(0.4);
            }
            @keyframes wizard-sparkle-burst {
              0% {
                opacity: 0;
                transform: rotate(var(--wizard-sparkle-angle, 0deg)) translateX(0) scale(0.4);
              }
              30% {
                opacity: 1;
              }
              100% {
                opacity: 0;
                transform: rotate(var(--wizard-sparkle-angle, 0deg)) translateX(38px) scale(1);
              }
            }
          `}</style>
        </div>
      )}
      {(chatOpen || lifecycle === 'closing') && (
        <div data-merlin-lifecycle={lifecycle}>
          <WizardChat agentRef={agentRef} />
        </div>
      )}
    </>
  )
}

export default Wizard
