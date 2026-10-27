import { createContext, useContext, ReactNode, type CSSProperties } from 'react'
import blissHill from '@assets/wallpaper/bliss-hill.webp'

const xpTheme = {
  app: {
    backgroundImage: `url(${blissHill})`,
    backgroundSize: 'cover',
  },
  button: {
    WebkitFontSmoothing: 'antialiased',
    boxSizing: 'border-box',
    border: '1px solid var(--xp-btn-border)',
    background: 'var(--xp-btn-face)',
    boxShadow: 'none',
    borderRadius: 'var(--radius-control)',
  },
  window: {
    background: 'var(--xp-title-active)',
    color: 'var(--n-0)',
    borderRadius: 'var(--radius-window)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--fs-chrome)',
    textShadow: 'var(--text-shadow-title)',
    boxSizing: 'border-box',
  },
  windowInactive: {
    background: 'var(--xp-title-inactive)',
    color: 'var(--n-0)',
    borderRadius: 'var(--radius-window)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 'var(--fw-bold)',
    fontSize: 'var(--fs-chrome)',
    textShadow: 'var(--text-shadow-title)',
    boxSizing: 'border-box',
  },
  field: {
    backgroundColor: 'var(--surface-window)',
    color: 'var(--ink-2)',
    marginTop: '-2px',
    fontWeight: 'var(--fw-regular)',
    boxSizing: 'border-box',
    borderRight: 'var(--frame-w) solid var(--xp-frame)',
    borderBottom: 'var(--frame-w) solid var(--xp-frame)',
    borderLeft: 'var(--frame-w) solid var(--xp-frame)',
  },
  navbar: {
    background: 'var(--xp-taskbar)',
  },
} satisfies Record<string, CSSProperties>

interface ThemeContextType {
  themeValues: typeof xpTheme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return (
    <ThemeContext.Provider value={{ themeValues: xpTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
