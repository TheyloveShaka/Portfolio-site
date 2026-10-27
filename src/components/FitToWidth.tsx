import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface FitToWidthProps {
  children: ReactNode
}

function FitToWidth({ children }: FitToWidthProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState<{ scale: number; height?: number }>({ scale: 1 })

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return undefined
    const measure = () => {
      const natural = inner.offsetWidth
      const available = outer.clientWidth
      if (!natural || !available) return
      const scale = Math.min(1, available / natural)
      const height = Math.round(inner.offsetHeight * scale)
      setFit((prev) => (prev.scale === scale && prev.height === height ? prev : { scale, height }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(outer)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={outerRef} className="fit-width" style={{ height: fit.height }}>
      <div ref={innerRef} className="fit-width__inner" style={{ transform: `scale(${fit.scale})` }}>
        {children}
      </div>
    </div>
  )
}

export default FitToWidth
