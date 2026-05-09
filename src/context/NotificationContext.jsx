// src/context/NotificationContext.js
import { createContext, useContext, useState, useCallback, useRef } from 'react'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timerRefs = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timerRefs.current[id])
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const notify = useCallback((message, type = 'info', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      timerRefs.current[id] = setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const success = useCallback((msg, dur) => notify(msg, 'success', dur), [notify])
  const error   = useCallback((msg, dur) => notify(msg, 'error', dur || 6000), [notify])
  const warning = useCallback((msg, dur) => notify(msg, 'warning', dur), [notify])
  const info    = useCallback((msg, dur) => notify(msg, 'info', dur), [notify])

  return (
    <NotificationContext.Provider value={{ toasts, notify, success, error, warning, info, dismiss }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
