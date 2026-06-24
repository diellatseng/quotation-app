// src/context/AppearanceContext.jsx
// User-facing appearance preferences:
//   • theme        → color palette via [data-theme] (default | high-contrast)
//   • baseFontSize → font scaling via --base-font-size on <html>
import { createContext, useContext, useState, useEffect } from 'react'
import { APP_THEMES, DEFAULT_THEME, isAppTheme } from '@/lib/themes'

const STORAGE_KEY = 'qapp_theme'

const defaults = {
  theme: DEFAULT_THEME,
  baseFontSize: 18,
}

function normalizeSavedSettings(raw) {
  const merged = { ...defaults, ...raw }
  let theme = merged.theme
  if (theme === 'light') theme = DEFAULT_THEME
  if (raw?.contrast === 'high' && theme === DEFAULT_THEME) theme = 'high-contrast'
  if (!isAppTheme(theme)) theme = DEFAULT_THEME
  return {
    theme,
    baseFontSize: merged.baseFontSize,
  }
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? normalizeSavedSettings(JSON.parse(saved)) : defaults
  } catch {
    return defaults
  }
}

function applyAppearanceToDocument(settings) {
  const root = document.documentElement
  root.setAttribute('data-theme', settings.theme)
  root.style.setProperty('--base-font-size', `${settings.baseFontSize}px`)
}

const AppearanceContext = createContext(null)

export function AppearanceProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const initial = loadSettings()
    if (typeof document !== 'undefined') applyAppearanceToDocument(initial)
    return initial
  })

  useEffect(() => {
    applyAppearanceToDocument(settings)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch { /* ignore quota / private mode */ }
  }, [settings])

  const setTheme = (theme) => {
    if (!isAppTheme(theme)) return
    setSettings((s) => ({ ...s, theme }))
  }

  const setFontSize = (size) => {
    const clamped = Math.min(Math.max(size, 14), 24)
    setSettings((s) => ({ ...s, baseFontSize: clamped }))
  }

  return (
    <AppearanceContext.Provider value={{ ...settings, setTheme, setFontSize }}>
      {children}
    </AppearanceContext.Provider>
  )
}

export const useAppearance = () => useContext(AppearanceContext)

export { APP_THEMES }
