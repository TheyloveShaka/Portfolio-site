import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

import mycomp from '@assets/icons/xp/mycomp.png'
import info from '@assets/icons/xp/about.png'
import cmd from '@assets/icons/xp/cmd.png'
import mydocs from '@assets/icons/xp/mydocs.png'
import textDoc from '@assets/icons/xp/text-doc.png'
import merlinIcon from '@assets/icons/xp/merlin.svg'
import { WindowProps } from '@/types'
import {
  loadIconPositions,
  saveIconPositions,
  defaultIconPositions,
  loadWindowPositions,
  saveWindowPositions,
  WindowDocumentPosition,
  WindowPositions,
} from '@/utils/zenFs'

export type WindowKey = 'terminal2' | 'about' | 'deviceInfo' | 'caseStudies' | 'hireMe' | 'approach' | 'caseStudy' | 'start' | 'resume' | 'merlinChat'

interface WindowsContextType {
  windows: Record<WindowKey, WindowProps>;
  startWindow: WindowProps;
  terminalWindow: WindowProps;
  aboutWindow: WindowProps;
  deviceInfoWindow: WindowProps;
  caseStudiesWindow: WindowProps;
  hireMeWindow: WindowProps;
  approachWindow: WindowProps;
  caseStudyWindow: WindowProps;
  resumeWindow: WindowProps;
  openOrFocusWindow: (windowKey: WindowKey) => void;
  closeWindow: (windowKey: WindowKey) => void;
  windowPositions: WindowPositions;
  setWindowPosition: (windowKey: WindowKey, position: WindowDocumentPosition) => void;
  isWindowFocused: (windowKey: WindowKey) => boolean;
  selectedCaseStudyId: string | null;
  openCaseStudy: (caseStudyId: string) => void;
}

const WindowsContext = createContext<WindowsContextType | undefined>(undefined)

interface WindowsProviderProps {
  children: ReactNode;
}

type IconCoordinates = {
  gridColumnStart: number;
  gridRowStart: number;
};

export type IconPositions = Record<WindowKey, IconCoordinates>

export const WindowsProvider = ({ children }: WindowsProviderProps) => {
  const [openWindowsQueue, setOpenWindowsQueue] = useState<WindowKey[]>([])
  const [iconPositions, setIconPositions] = useState<IconPositions>(defaultIconPositions)
  const [windowPositions, setWindowPositions] = useState<WindowPositions>({})
  const [selectedCaseStudyId, setSelectedCaseStudyId] = useState<string | null>(null)

  const openOrFocusWindow = (windowKey: WindowKey) => {
    const wasAlreadyOpen = openWindowsQueue.includes(windowKey)

    setOpenWindowsQueue(prevWindows => {
      const newOrder = [...prevWindows]
      const index = newOrder.indexOf(windowKey)
      if (index !== -1) {
        newOrder.splice(index, 1)
      }
      newOrder.push(windowKey)
      return newOrder
    })

    if (wasAlreadyOpen && windowKey !== 'merlinChat' && typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        const el = document.getElementById(`window-${windowKey}`)
        if (!el) return
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
      })
    }
  }

  const setWindowPosition = (windowKey: WindowKey, position: WindowDocumentPosition) => {
    setWindowPositions(prev => ({ ...prev, [windowKey]: position }))
  }

  const isWindowFocused = (windowKey: WindowKey): boolean =>
    openWindowsQueue.length > 0 && openWindowsQueue[openWindowsQueue.length - 1] === windowKey

  const closeWindow = (windowKey: WindowKey) => {
    setOpenWindowsQueue(prevWindows => prevWindows.filter(key => key !== windowKey))
  }

  const openCaseStudy = (caseStudyId: string) => {
    setSelectedCaseStudyId(caseStudyId)
    openOrFocusWindow('caseStudy')
  }

  const createWindowConfig = (windowKey: WindowKey, xpIcon: string, caption: string): WindowProps => ({
    xpIcon,
    caption,
    elementId: windowKey,
    close: () => closeWindow(windowKey),
    openOrFocus: () => openOrFocusWindow(windowKey),
    visibility: openWindowsQueue?.includes(windowKey) ?? false,
    zIndex: (openWindowsQueue.indexOf(windowKey) + 5),
    gridColumnStart: iconPositions[windowKey].gridColumnStart,
    gridRowStart: iconPositions[windowKey].gridRowStart
  })

  const windows = {
    start: createWindowConfig('start', cmd, 'Start'),
    terminal2: createWindowConfig('terminal2', cmd, 'Terminal'),
    about: createWindowConfig('about', info, 'About'),
    deviceInfo: createWindowConfig('deviceInfo', mycomp, 'Device'),
    caseStudies: createWindowConfig('caseStudies', mydocs, 'Projects'),
    hireMe: createWindowConfig('hireMe', textDoc, 'Hire Me'),
    approach: createWindowConfig('approach', textDoc, 'My Approach.txt'),
    caseStudy: createWindowConfig('caseStudy', mydocs, 'Project'),
    resume: createWindowConfig('resume', textDoc, 'Resume'),
    merlinChat: createWindowConfig('merlinChat', merlinIcon, 'Ask Merlin'),
  }

  useEffect(() => {
    loadIconPositions((positions) => {
      if (positions) {
        setIconPositions(positions)
      }
    })
  }, [])

  useEffect(() => {
    saveIconPositions(iconPositions)
  }, [iconPositions])

  useEffect(() => {
    loadWindowPositions((positions) => {
      if (!positions) return
      const clamped: WindowPositions = {}
      for (const key in positions) {
        const pos = positions[key as WindowKey]
        if (pos) clamped[key as WindowKey] = pos
      }
      setWindowPositions(clamped)
    })
  }, [])

  useEffect(() => {
    if (Object.keys(windowPositions).length === 0) return
    saveWindowPositions(windowPositions)
  }, [windowPositions])

  return (
    <WindowsContext.Provider
      value={{
        windows,
        resumeWindow: windows.resume,
        startWindow: windows.start,
        terminalWindow: windows.terminal2,
        aboutWindow: windows.about,
        deviceInfoWindow: windows.deviceInfo,
        caseStudiesWindow: windows.caseStudies,
        hireMeWindow: windows.hireMe,
        approachWindow: windows.approach,
        caseStudyWindow: windows.caseStudy,
        openOrFocusWindow,
        closeWindow,
        windowPositions,
        setWindowPosition,
        isWindowFocused,
        selectedCaseStudyId,
        openCaseStudy,
      }}
    >
      {children}
    </WindowsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWindows = () => {
  const context = useContext(WindowsContext)
  if (context === undefined) {
    throw new Error('useWindows must be used within a WindowsProvider')
  }
  return context
}
