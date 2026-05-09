// src/context/ThemeContext.js
import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'qapp_theme'

const defaults = {
  baseFontSize: 18,   // px — all other sizes scale from this
  contrast: 'normal', // 'normal' | 'high'
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
    } catch { return defaults }
  })

  // Apply CSS variables to :root whenever theme changes
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--base-font-size', `${theme.baseFontSize}px`)
    root.setAttribute('data-contrast', theme.contrast)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(theme)) } catch {}
  }, [theme])

  const setFontSize = (size) => {
    const clamped = Math.min(Math.max(size, 14), 24) // 14–24px range
    setTheme(t => ({ ...t, baseFontSize: clamped }))
  }

  const toggleContrast = () =>
    setTheme(t => ({ ...t, contrast: t.contrast === 'high' ? 'normal' : 'high' }))

  return (
    <ThemeContext.Provider value={{ ...theme, setFontSize, toggleContrast }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
