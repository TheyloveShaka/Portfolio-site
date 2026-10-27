import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import '@/styles/tokens.css'

import '@fontsource/fira-mono/400.css'
import '@fontsource/fira-mono/500.css'
import '@fontsource/fira-sans/400.css'
import '@fontsource/fira-sans/600.css'
import '@fontsource/fira-sans/700.css'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/caveat'
import '@fontsource/fira-sans/400-italic.css'

import './index.css'
import '@/styles/decor.css'
import '@/styles/content-windows.css'
import { ThemeProvider } from '@contexts/ThemeContext.tsx'
import { AnimationsProvider } from '@contexts/AnimationsContext.tsx'
import { WindowsProvider } from '@contexts/WindowsContext.tsx'
import { ClientProvider } from '@contexts/ClientContext.tsx'

import firaMonoWoff2 from '@fontsource/fira-mono/files/fira-mono-latin-400-normal.woff2?url'
import firaSansRegularWoff2 from '@fontsource/fira-sans/files/fira-sans-latin-400-normal.woff2?url'
import firaSansBoldWoff2 from '@fontsource/fira-sans/files/fira-sans-latin-700-normal.woff2?url'
import bricolageWoff2 from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url'

const PRELOAD_FONT_URLS = [
  firaMonoWoff2,
  firaSansRegularWoff2,
  firaSansBoldWoff2,
  bricolageWoff2,
]

for (const href of PRELOAD_FONT_URLS) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'font'
  link.type = 'font/woff2'
  link.crossOrigin = 'anonymous'
  link.href = href
  document.head.appendChild(link)
}

createRoot(document.getElementById('root')!).render(
  <WindowsProvider>
    <AnimationsProvider>
      <ThemeProvider>
        <ClientProvider>
          <App />
        </ClientProvider>
      </ThemeProvider>
    </AnimationsProvider>
  </WindowsProvider>

)
