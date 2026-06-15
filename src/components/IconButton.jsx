// src/components/IconButton.jsx
import { Button as ShadcnButton } from '@/components/ui/button'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { SIZE_MAP, VARIANT_MAP } from './Button'

/**
 * IconButton — shadcn Button with Lucide icon and optional text label.
 */
export default function IconButton({
  icon,
  label = '',
  tooltip = '',
  onClick,
  variant = 'normal',
  size = 'normal',
  className = '',
  style = {},
  disabled = false,
  type = 'button',
  children = null,
  ...rest
}) {
  const displayLabel = children || label
  const LucideIcon = icon ? getIcon(icon) : null
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4'

  return (
    <ShadcnButton
      type={type}
      onClick={onClick}
      variant={VARIANT_MAP[variant] ?? 'outline'}
      size={SIZE_MAP[size] ?? 'md'}
      className={cn('font-semibold', className)}
      style={style}
      disabled={disabled}
      title={tooltip || label}
      aria-label={tooltip || label || undefined}
      {...rest}
    >
      {LucideIcon && <LucideIcon className={iconClass} />}
      {displayLabel ? <span>{displayLabel}</span> : null}
    </ShadcnButton>
  )
}
