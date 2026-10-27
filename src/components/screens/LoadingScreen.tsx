import { useCallback, useEffect, useRef, useState } from 'react'
import { WindupChildren, Pause, Pace, Effect } from 'windups'

import { useWindows } from '@contexts/WindowsContext'
import { useAnimations } from '@contexts/AnimationsContext'
import { loadFastBootFlag } from '@/utils/zenFs'
import { bootHandoff, durFast, durHandoff } from '@/styles/motion'

const INTRO_START_EVENT = 'portfolio:intro-start'
const INTRO_COMPLETE_EVENT = 'portfolio:intro-complete'

const signalIntroStart = () => {
  document.body.dataset.introStarted = 'true'
  window.dispatchEvent(new CustomEvent(INTRO_START_EVENT))
}

const signalIntroComplete = () => {
  document.body.dataset.introDone = 'true'
  window.dispatchEvent(new CustomEvent(INTRO_COMPLETE_EVENT))
}

const warmSecondaryFonts = () => {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  document.fonts.load('600 13px \'Fira Sans\'').catch(() => {})
  document.fonts.load('500 23px \'Caveat Variable\'').catch(() => {})
  document.fonts.load('600 26px \'Caveat Variable\'').catch(() => {})
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Stage = 'bios' | 'done'

const REDUCED_HOLD_MS = 600

const LoadingScreen = () => {
  const [stage, setStage] = useState<Stage>('bios')
  const [isHandingOff, setIsHandingOff] = useState(false)
  const [fastBootChecked, setFastBootChecked] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const { aboutWindow } = useWindows()
  const { revealDesktop } = useAnimations()

  const handoffRef = useRef(false)

  const moveFocusIntoAbout = useCallback(() => {
    let attempts = 0
    const tryFocus = () => {
      const closeBtn = document.querySelector<HTMLButtonElement>('#window-about .close-window')
      if (closeBtn && closeBtn.offsetParent !== null) {
        closeBtn.focus()
        return
      }
      attempts += 1
      if (attempts < 20) window.requestAnimationFrame(tryFocus)
    }
    window.requestAnimationFrame(tryFocus)
  }, [])

  const handleDesktopHandoff = useCallback(() => {
    if (handoffRef.current) return
    handoffRef.current = true

    signalIntroComplete()

    const reduced = prefersReducedMotion()
    const revealDuration = reduced ? 0 : durFast / 1000
    const revealDelay = reduced ? 0 : bootHandoff.taskbarRise / 1000

    revealDesktop({ duration: revealDuration, delay: revealDelay })

    const openAbout = () => {
      aboutWindow.openOrFocus()
      moveFocusIntoAbout()
    }

    if (reduced) {
      setStage('done')
      openAbout()
      return
    }

    setIsHandingOff(true)
    window.setTimeout(() => setStage('done'), durHandoff)
    window.setTimeout(openAbout, bootHandoff.aboutOpen)
  }, [revealDesktop, aboutWindow, moveFocusIntoAbout])

  const skipBoot = useCallback(() => {
    handleDesktopHandoff()
  }, [handleDesktopHandoff])

  const skipLoading = useCallback(() => {
    handoffRef.current = true
    setStage('done')

    revealDesktop({ duration: durFast / 1000, delay: 0 })

    window.setTimeout(() => {
      aboutWindow.openOrFocus()
      moveFocusIntoAbout()
    }, bootHandoff.aboutOpen)

    signalIntroComplete()
  }, [revealDesktop, aboutWindow, moveFocusIntoAbout])

  useEffect(() => {
    setReducedMotion(prefersReducedMotion())
    warmSecondaryFonts()

    loadFastBootFlag((isFastboot) => {
      if (isFastboot) {
        skipLoading()
      } else {
        signalIntroStart()
      }
      setFastBootChecked(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!fastBootChecked || stage !== 'bios') return undefined

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') skipBoot()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [fastBootChecked, stage, skipBoot])

  useEffect(() => {
    if (!fastBootChecked || stage !== 'bios' || !reducedMotion) return undefined
    const t = window.setTimeout(handleDesktopHandoff, REDUCED_HOLD_MS)
    return () => window.clearTimeout(t)
  }, [fastBootChecked, stage, reducedMotion, handleDesktopHandoff])

  if (!fastBootChecked || stage !== 'bios') return null

  return (
    <div className={`boot-screen ${isHandingOff ? 'boot-screen--leaving' : ''}`} id="bootRoot">
      <div className="boot-screen-text" id="boot-text">
        {reducedMotion ? (
          <>
            Shaka's Portfolio
            <br />
            Hardware check OK
            <br />
            Loading
            <br />
            Ready
            <br />
            Loading complete...
          </>
        ) : (
          <WindupChildren>
            <Pace ms={8}>
              Shaka's Portfolio
              <br />
              <Pause ms={30} />
              Hardware check OK
              <br />
              <Pause ms={30} />
              Loading
              <br />
              <Pause ms={30} />
              Ready
              <br />
              <Pause ms={30} />
              Loading complete
              <Pace ms={90}>...</Pace>
              <Effect fn={handleDesktopHandoff} />
            </Pace>
          </WindupChildren>
        )}
      </div>
      <button type="button" className="boot-skip" onClick={skipBoot}>
        Skip boot
      </button>
    </div>
  )
}

export default LoadingScreen
