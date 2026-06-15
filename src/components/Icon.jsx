// src/components/Icon.jsx
import { cn } from '@/lib/utils'
import { getIcon } from '@/lib/icons'

/**
 * Icon — Lucide wrapper (legacy Material Symbol names still accepted via lib/icons).
 */
export default function Icon({ name, style = {}, title = '', className = '' }) {
  const LucideIcon = getIcon(name)
  if (!LucideIcon) return null

  const decorative = !title

  return (
    <LucideIcon
      className={cn('shrink-0', className)}
      style={style}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    />
  )
}
