// src/components/NotificationCenter.jsx
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotification } from '../context/NotificationContext'

const TOAST_ICONS = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
}

// Per-type colour variants (background + border + icon colour)
const TOAST_STYLES = {
  success: { box: 'bg-green-50 border-green-600', icon: 'text-green-600' },
  error: { box: 'bg-red-50 border-red-600', icon: 'text-red-600' },
  warning: { box: 'bg-amber-50 border-amber-600', icon: 'text-amber-600' },
  info: { box: 'bg-blue-50 border-blue-600', icon: 'text-blue-600' },
}

export default function NotificationCenter() {
  const { toasts, dismiss } = useNotification()

  if (!toasts.length) return null

  return (
    <div
      className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-[360px] w-[calc(100vw-3rem)] pointer-events-none"
      role="region"
      aria-label="通知"
      aria-live="polite"
    >
      {toasts.map(toast => {
        const variant = TOAST_STYLES[toast.type] || TOAST_STYLES.info
        const ToastIcon = TOAST_ICONS[toast.type] || TOAST_ICONS.info
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-md border-[1.5px] shadow-lg pointer-events-auto animate-in slide-in-from-right-5 fade-in duration-200 ${variant.box}`}
            role="alert"
            aria-atomic="true"
          >
            <span className={`shrink-0 mt-0.5 ${variant.icon}`} aria-hidden="true">
              <ToastIcon className="size-5 shrink-0" />
            </span>
            <span className="flex-1 text-sm text-foreground leading-snug">
              {toast.message}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
              onClick={() => dismiss(toast.id)}
              aria-label="關閉通知"
            >
              <X className="size-4 shrink-0" aria-hidden="true" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
