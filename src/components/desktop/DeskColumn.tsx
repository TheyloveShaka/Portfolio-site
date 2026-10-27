import { useCallback, useEffect, useRef } from 'react'
import Polaroids from '@components/desktop/Polaroids'
import StickyNote from '@components/desktop/StickyNote'
import GithubActivity from '@components/desktop/GithubActivity'
import '@/styles/desk.css'

const DESKTOP_MIN_WIDTH = 768
const MERLIN_RESERVE_PX = 182
const MIN_SCALE = 0.5

function DeskColumn() {
  const columnRef = useRef<HTMLDivElement>(null)

  const fit = useCallback(() => {
    const el = columnRef.current
    if (!el) return
    if (window.innerWidth < DESKTOP_MIN_WIDTH) {
      el.style.setProperty('--desk-scale', '1')
      return
    }
    const natural = el.offsetHeight
    if (!natural) return
    const available = window.innerHeight - el.offsetTop - MERLIN_RESERVE_PX
    const scale = Math.min(1, Math.max(MIN_SCALE, available / natural))
    el.style.setProperty('--desk-scale', scale.toFixed(3))
  }, [])

  useEffect(() => {
    const el = columnRef.current
    if (!el) return undefined
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    window.addEventListener('resize', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [fit])

  return (
    <div ref={columnRef} className="desk-column">
      <Polaroids />
      <StickyNote />
      <GithubActivity />
    </div>
  )
}

export default DeskColumn
