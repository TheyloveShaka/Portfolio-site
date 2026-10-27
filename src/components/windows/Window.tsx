import { CgClose } from 'react-icons/cg'
import { useTheme } from '@contexts/ThemeContext'
import { WindowProps } from '@/types'
import { type CSSProperties, ReactNode, useEffect, useRef, useState } from 'react'
import { DraggableCore } from 'react-draggable'
import { useMediaQuery } from 'react-responsive'
import { useWindows } from '@contexts/WindowsContext'
import {
  clampToViewport,
  clampWindowPosition,
  computeDefaultWindowPosition,
  computeMerlinDockPosition,
  getCanvasMetrics,
  RAIL_CLEARANCE_PX,
} from '@/utils/windowLayout'

interface Window {
  window: WindowProps
  children: ReactNode;
  mobileMaxHeight?: string
  innerScroll?: boolean
}

const DRAG_THRESHOLD_PX = 4

function Window({ window: win, children, mobileMaxHeight, innerScroll }: Window) {
  const { openOrFocusWindow, closeWindow, windowPositions, setWindowPosition, isWindowFocused } = useWindows()
  const nodeRef = useRef<HTMLDivElement>(null)
  const { themeValues } = useTheme()
  const isMobile = useMediaQuery({ maxWidth: 767 })
  const isMerlinDock = win.elementId === 'merlinChat'
  const floatsOnMobile = win.elementId === 'about' || isMerlinDock
  const isInFlowMobile = isMobile && !floatsOnMobile

  const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number } | null>(null)
  const hasPlacedRef = useRef(false)

  const dragRef = useRef({ engaged: false, dx: 0, dy: 0 })

  const persisted = windowPositions[win.elementId]
  const focused = isWindowFocused(win.elementId)

  useEffect(() => {
    if (isInFlowMobile || !nodeRef.current) return undefined
    const el = nodeRef.current
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setMeasuredSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [isInFlowMobile])

  useEffect(() => {
    if (isInFlowMobile || persisted || hasPlacedRef.current || !measuredSize) return
    hasPlacedRef.current = true
    if (isMerlinDock) {
      setWindowPosition(win.elementId, computeMerlinDockPosition(measuredSize))
      return
    }
    let initialPosition: { x: number; y: number }
    if (win.elementId === 'about') {
      if (isMobile) {
        initialPosition = { x: 12, y: 16 }
      } else {
        const shortViewport = typeof globalThis.window !== 'undefined' && globalThis.window.innerHeight < 760
        initialPosition = { x: shortViewport ? RAIL_CLEARANCE_PX : 120, y: 32 }
      }
    } else {
      initialPosition = computeDefaultWindowPosition(measuredSize)
    }
    setWindowPosition(win.elementId, clampWindowPosition(initialPosition, measuredSize, getCanvasMetrics()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInFlowMobile, isMobile, persisted, measuredSize])

  useEffect(() => {
    if (isInFlowMobile) return undefined
    const onResize = () => {
      if (!measuredSize) return
      const current = windowPositions[win.elementId]
      if (!current) return
      const clamped = isMerlinDock
        ? clampToViewport(current, measuredSize)
        : clampWindowPosition(current, measuredSize, getCanvasMetrics())
      if (clamped.x !== current.x || clamped.y !== current.y) {
        setWindowPosition(win.elementId, clamped)
      }
    }
    globalThis.window.addEventListener('resize', onResize)
    return () => globalThis.window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInFlowMobile, measuredSize, win.elementId])

  const handleWindowMouseDown = () => openOrFocusWindow(win.elementId)

  const handleDragStart = () => {
    dragRef.current = { engaged: false, dx: 0, dy: 0 }
  }

  const handleDrag = (_e: unknown, data: { deltaX: number; deltaY: number }) => {
    const drag = dragRef.current
    drag.dx += data.deltaX
    drag.dy += data.deltaY

    if (!drag.engaged) {
      const travelled = Math.hypot(drag.dx, drag.dy)
      if (travelled < DRAG_THRESHOLD_PX) return
      drag.engaged = true
    }

    const base = windowPositions[win.elementId] ?? { x: 0, y: 0 }
    const next = { x: base.x + drag.dx, y: base.y + drag.dy }
    const size = measuredSize ?? { width: 0, height: 0 }
    const clamped = isMerlinDock
      ? clampToViewport(next, size)
      : clampWindowPosition(next, size, getCanvasMetrics())
    setWindowPosition(win.elementId, clamped)
    drag.dx = 0
    drag.dy = 0
  }

  const handleDragStop = () => {
    dragRef.current.engaged = false
  }

  const outerFieldStyle = { ...themeValues.field }
  const clampHeight = isMobile ? mobileMaxHeight : 'var(--window-max-h)'
  const scrollStyle: CSSProperties = innerScroll
    ? {
        maxHeight: clampHeight ?? 'var(--window-max-h)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }
    : {
        maxHeight: clampHeight,
        overflow: 'auto',
        overscrollBehaviorY: 'contain',
      }
  const innerStyle: CSSProperties | undefined = innerScroll
    ? { display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }
    : undefined

  const titleBarTheme = focused ? themeValues.window : themeValues.windowInactive

  const titleBar = (
    <div
      className="handle window-titlebar"
      style={{ ...titleBarTheme, touchAction: isInFlowMobile ? 'manipulation' : 'none' }}
    >
      <span id="title" className="window-titlebar__text" style={{ color: titleBarTheme.color }}>
        {win.caption}
      </span>
      <button
        type="button"
        className="close-window unstyledButton"
        onClick={() => closeWindow(win.elementId)}
        aria-label="Close window"
      >
        <span className="close-window-glyph">
          <CgClose aria-hidden="true" />
        </span>
      </button>
    </div>
  )

  if (isInFlowMobile) {
    return (
      <div
        id={`window-${win.elementId}`}
        data-window-root
        style={{ zIndex: win.zIndex }}
        className="relative mx-2 my-4"
        onMouseDown={handleWindowMouseDown}
      >
        {titleBar}
        <div style={outerFieldStyle} className="grain">
          <div style={scrollStyle}>
            <div style={innerStyle}>{children}</div>
          </div>
        </div>
      </div>
    )
  }

  if (isMerlinDock) {
    const dockPosition = persisted ?? { x: -9999, y: -9999 }
    return (
      <DraggableCore handle=".handle" cancel=".close-window" onStart={handleDragStart} onDrag={handleDrag} onStop={handleDragStop}>
        <div
          ref={nodeRef}
          id={`window-${win.elementId}`}
          style={{
            zIndex: win.zIndex,
            left: dockPosition.x,
            top: dockPosition.y,
            visibility: persisted ? 'visible' : 'hidden',
          }}
          className="fixed merlin-dock-window shadow-window"
          onMouseDown={handleWindowMouseDown}
        >
          {titleBar}
          <div style={outerFieldStyle} className="grain">
            <div style={{ ...scrollStyle, maxHeight: mobileMaxHeight ?? scrollStyle.maxHeight }}>
              <div style={innerStyle}>{children}</div>
            </div>
          </div>
        </div>
      </DraggableCore>
    )
  }

  const position = persisted ?? { x: -9999, y: -9999 }

  const mobileFloatStyle = isMobile ? { width: 'calc(100vw - 24px)' } : undefined

  return (
    <DraggableCore handle=".handle" cancel=".close-window" onStart={handleDragStart} onDrag={handleDrag} onStop={handleDragStop}>
      <div
        ref={nodeRef}
        id={`window-${win.elementId}`}
        data-window-root
        style={{
          zIndex: win.zIndex,
          left: position.x,
          top: position.y,
          visibility: persisted ? 'visible' : 'hidden',
          ...mobileFloatStyle,
        }}
        className={isMobile ? 'absolute h-fit shadow-window' : 'absolute max-w-fit h-fit shadow-window'}
        onMouseDown={handleWindowMouseDown}
      >
        {titleBar}
        <div style={outerFieldStyle} className="grain">
          <div style={scrollStyle}>
            <div style={innerStyle}>{children}</div>
          </div>
        </div>
      </div>
    </DraggableCore>
  )
}

export default Window
