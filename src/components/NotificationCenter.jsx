// src/components/NotificationCenter.jsx
import { useNotification } from '../context/NotificationContext'

const icons = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

export default function NotificationCenter() {
  const { toasts, dismiss } = useNotification()

  if (!toasts.length) return null

  return (
    <div
      className="toast-region"
      role="region"
      aria-label="通知"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast"
          data-type={toast.type || 'info'}
          role="alert"
          aria-atomic="true"
        >
          <span className="toast__icon" aria-hidden="true">
            {icons[toast.type]}
          </span>
          <span className="toast__message">
            {toast.message}
          </span>
          <button
            className="toast__dismiss"
            onClick={() => dismiss(toast.id)}
            aria-label="關閉通知"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
