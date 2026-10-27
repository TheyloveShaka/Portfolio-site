import { useEffect, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { useAnimations } from '@contexts/AnimationsContext'
import portrait from '@assets/photos/shaka-portrait.webp'

const noop = (e: MouseEvent | KeyboardEvent) => {
  e.preventDefault()
}

function Polaroids() {
  const { desktopRevealed } = useAnimations()
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const developed = desktopRevealed || reducedMotion
  const transitionDuration = reducedMotion ? '0ms' : 'var(--dur-develop)'

  return (
    <div className="polaroid-cluster">
      <div
        className="polaroid"
        role="img"
        tabIndex={0}
        aria-label="Portrait of Shaka Nathan K"
        onClick={noop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') noop(e)
        }}
      >
        <span className="polaroid__tape" aria-hidden="true" />
        <span className="polaroid__well">
          <span
            className="polaroid__veil"
            aria-hidden="true"
            style={{ opacity: developed ? 0 : 0.72, transitionDuration }}
          />
          <img
            src={portrait}
            alt=""
            aria-hidden="true"
            width={480}
            height={600}
            decoding="async"
            style={{ opacity: developed ? 1 : 0.35, transitionDuration }}
          />
        </span>
        <span className="polaroid__caption-wrap" aria-hidden="true" />
      </div>
    </div>
  )
}

export default Polaroids
