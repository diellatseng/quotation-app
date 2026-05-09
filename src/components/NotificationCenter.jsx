// src/components/NotificationCenter.jsx
import { useNotification } from '../context/NotificationContext'

const icons = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

const colors = {
  success: {
    bg: 'var(--color-success-bg)',
    border: 'var(--color-success)',
    text: 'var(--color-success)',
  },
  error: {
    bg: 'var(--color-danger-bg)',
    border: 'var(--color-danger)',
    text: 'var(--color-danger)',
  },
  warning: {
    bg: 'var(--color-warning-bg)',
    border: 'var(--color-warning)',
    text: 'var(--color-warning)',
  },
  info: {
    bg: 'var(--color-info-bg)',
    border: 'var(--color-info)',
    text: 'var(--color-info)',
  },
}

export default function NotificationCenter() {
  const { toasts, dismiss } = useNotification()

  if (!toasts.length) return null

  return (
    <div
      role="region"
      aria-label="通知"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'var(--space-6)',
        right: 'var(--space-6)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        maxWidth: '360px',
        width: 'calc(100vw - 3rem)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => {
        const c = colors[toast.type] || colors.info
        return (
          <div
            key={toast.id}
            role="alert"
            aria-atomic="true"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              padding: 'var(--space-4)',
              background: c.bg,
              border: `1.5px solid ${c.border}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              pointerEvents: 'all',
              animation: 'slideIn 200ms ease',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: 'var(--text-md)',
                color: c.text,
                fontWeight: 700,
                flexShrink: 0,
                lineHeight: 1,
                marginTop: '2px',
              }}
            >
              {icons[toast.type]}
            </span>
            <span style={{
              flex: 1,
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
              lineHeight: 1.5,
            }}>
              {toast.message}
            </span>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="關閉通知"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--text-md)',
                lineHeight: 1,
                padding: '2px',
                flexShrink: 0,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              ×
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
