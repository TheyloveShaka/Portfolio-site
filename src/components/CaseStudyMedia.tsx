import { useEffect, useRef, useState } from 'react'
import { TbPlayerPlayFilled } from 'react-icons/tb'
import type { CaseStudy } from '@/data/caseStudies'

interface CaseStudyMediaProps {
  study: CaseStudy
  variant: 'tile' | 'viewer'
  active?: boolean
  onVisibilityChange?: (ratio: number) => void
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isSaveData = () =>
  typeof navigator !== 'undefined' && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)

function CaseStudyMedia({ study, variant, active = true, onVisibilityChange }: CaseStudyMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [manuallyPlaying, setManuallyPlaying] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        onVisibilityChange?.(entry.intersectionRatio)
      },
      { threshold: [0, 0.5, 1] },
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasVideo = Boolean(study.video) && !videoFailed
  const autoplayAllowed = hasVideo && inView && active && !prefersReducedMotion() && !isSaveData()
  const showVideo = autoplayAllowed || (hasVideo && manuallyPlaying)

  return (
    <div ref={containerRef} className={`case-media case-media--${variant}`}>
      {showVideo && study.video ? (
        <video
          className="case-media__video"
          src={study.video}
          muted
          loop
          autoPlay
          playsInline
          onLoadedMetadata={(e) => {
            e.currentTarget.defaultPlaybackRate = 0.7
            e.currentTarget.playbackRate = 0.7
          }}
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <div className="case-media__poster" role="img" aria-label={`${study.title} walkthrough, pending`}>
          <span className="case-media__poster-label">Walkthrough recording pending</span>
          <span className="case-media__poster-name">{study.title}</span>
        </div>
      )}
      {hasVideo && !showVideo && (
        <button
          type="button"
          className="case-media__play"
          onClick={(e) => {
            e.stopPropagation()
            setManuallyPlaying(true)
          }}
        >
          <TbPlayerPlayFilled aria-hidden="true" />
          Play walkthrough
        </button>
      )}
    </div>
  )
}

export default CaseStudyMedia
