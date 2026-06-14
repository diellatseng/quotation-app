// src/context/AppearanceContext.jsx
// Single source of truth for all user-facing appearance preferences:
//   • theme        → color palette, drives [data-theme] (light / dark / future)
//   • contrast     → high-contrast accessibility mode, drives [data-contrast]
//   • baseFontSize → font scaling, drives the --base-font-size custom property
// These three axes are independent and compose (e.g. dark theme + high contrast).
// All persisted together under one localStorage key.
import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'qapp_theme'

const defaults = {
  theme: 'light',     // 'light' | 'dark' | future custom themes
  contrast: 'normal', // 'normal' | 'high'
  baseFontSize: 18,   // px — all other sizes scale from this
}

const AppearanceContext = createContext(null)

export function AppearanceProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
    } catch { return defaults }
  })

  // Reflect preferences onto :root whenever they change
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', settings.theme)
    root.setAttribute('data-contrast', settings.contrast)
    root.style.setProperty('--base-font-size', `${settings.baseFontSize}px`)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) } catch {}
  }, [settings])

  const setTheme = (theme) =>
    setSettings(s => ({ ...s, theme }))

  const setFontSize = (size) => {
    const clamped = Math.min(Math.max(size, 14), 24) // 14–24px range
    setSettings(s => ({ ...s, baseFontSize: clamped }))
  }

  const toggleContrast = () =>
    setSettings(s => ({ ...s, contrast: s.contrast === 'high' ? 'normal' : 'high' }))

  return (
    <AppearanceContext.Provider value={{ ...settings, setTheme, setFontSize, toggleContrast }}>
      {children}
    </AppearanceContext.Provider>
  )
}

export const useAppearance = () => useContext(AppearanceContext)
