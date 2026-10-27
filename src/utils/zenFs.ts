import { configure, fs, InMemory } from '@zenfs/core'
import { IndexedDB } from '@zenfs/dom'
import { IconPositions, WindowKey } from '@contexts/WindowsContext'

export const defaultIconPositions: IconPositions = {
  about: { gridColumnStart: 1, gridRowStart: 1 },
  caseStudies: { gridColumnStart: 1, gridRowStart: 2 },
  hireMe: { gridColumnStart: 1, gridRowStart: 3 },
  approach: { gridColumnStart: 1, gridRowStart: 4 },
  terminal2: { gridColumnStart: 1, gridRowStart: 5 },
  deviceInfo: { gridColumnStart: 1, gridRowStart: 6 },
  resume: { gridColumnStart: 1, gridRowStart: 7 },
  start: { gridColumnStart: 99, gridRowStart: 99 },
  caseStudy: { gridColumnStart: 99, gridRowStart: 99 },
  merlinChat: { gridColumnStart: 99, gridRowStart: 99 },
}

const ICON_POSITIONS_KEY = '/iconPositions.v7.json'

const MAX_GRID_INDEX = 20

const isPlausibleGridPosition = (pos: unknown): pos is { gridColumnStart: number; gridRowStart: number } => {
  if (!pos || typeof pos !== 'object') return false
  const { gridColumnStart, gridRowStart } = pos as Record<string, unknown>
  return (
    typeof gridColumnStart === 'number' && gridColumnStart >= 1 && gridColumnStart <= MAX_GRID_INDEX &&
    typeof gridRowStart === 'number' && gridRowStart >= 1 && gridRowStart <= MAX_GRID_INDEX
  )
}

const CONFIGURE_TIMEOUT_MS = 1500

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('ZenFS configure timed out')), ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })

const configureFs = async (): Promise<void> => {
  try {
    await withTimeout(configure({ mounts: { '/': IndexedDB } }), CONFIGURE_TIMEOUT_MS)
  } catch (error) {
    console.error(
      'ZenFS IndexedDB backend unavailable (likely blocked by a second open tab); falling back to an in-memory filesystem for this tab.',
      error,
    )
    try {
      await configure({ mounts: { '/': InMemory } })
    } catch (fallbackError) {
      console.error('ZenFS in-memory fallback also failed; filesystem-backed persistence is disabled for this session.', fallbackError)
    }
  }
}

export const fsReady: Promise<void> = configureFs()

export const loadIconPositions = async (callback: (positions:IconPositions|null) => void) => {
  await fsReady
  try {
    if (fs.existsSync(ICON_POSITIONS_KEY)) {
      const data = fs.readFileSync(ICON_POSITIONS_KEY, 'utf-8')
      const positions = JSON.parse(data)
      const sanitized: IconPositions = { ...defaultIconPositions }
      for (const key in positions) {
        const typedKey = key as WindowKey
        if (typedKey === 'start' || typedKey === 'caseStudy' || isPlausibleGridPosition(positions[typedKey])) {
          sanitized[typedKey] = positions[typedKey]
        }
      }
      callback(sanitized)
    } else {
      callback(null)
    }
  } catch (error) {
    console.error('Error loading icon positions:', error)
    callback(null)
  }
}

export const saveIconPositions = async (positions: IconPositions) => {
  if (JSON.stringify(defaultIconPositions) == JSON.stringify(positions)
  ) {return}
  await fsReady
  try {
    fs.writeFileSync(ICON_POSITIONS_KEY, JSON.stringify(positions))
  } catch (error) {
    console.error('Error saving icon positions:', error)
  }
}

export type WindowDocumentPosition = { x: number; y: number }
export type WindowPositions = Partial<Record<WindowKey, WindowDocumentPosition>>

export const loadWindowPositions = async (callback: (positions: WindowPositions | null) => void) => {
  await fsReady
  try {
    if (fs.existsSync('/windowPositions.json')) {
      const data = fs.readFileSync('/windowPositions.json', 'utf-8')
      callback(JSON.parse(data))
    } else {
      callback(null)
    }
  } catch (error) {
    console.error('Error loading window positions:', error)
    callback(null)
  }
}

export const saveWindowPositions = async (positions: WindowPositions) => {
  await fsReady
  try {
    fs.writeFileSync('/windowPositions.json', JSON.stringify(positions))
  } catch (error) {
    console.error('Error saving window positions:', error)
  }
}

export const defaultFastBootFlag = false

export const loadFastBootFlag = async (callback: (flag: boolean, flagExists?: boolean) => void) => {
  await fsReady
  try {
    if (fs.existsSync('/fastBootFlag.json')) {
      const data = fs.readFileSync('/fastBootFlag.json', 'utf-8')
      const flag = JSON.parse(data)
      callback(flag as boolean, true)
    } else {
      callback(defaultFastBootFlag, false)
    }
  } catch (error) {
    console.error('Error loading fast boot flag:', error)
    callback(defaultFastBootFlag)
  }
}

export const saveFastBootFlag = async (flag: boolean) => {
  await fsReady
  try {
    fs.writeFileSync('/fastBootFlag.json', JSON.stringify(flag))
  } catch (error) {
    console.error('Error saving fast boot flag:', error)
  }
}

