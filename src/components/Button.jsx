// src/components/Button.jsx — adapter: legacy API → shadcn/ui Button
import { Button as ShadcnButton } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const VARIANT_MAP = {
  primary: 'default',
  normal: 'outline',
  accent: 'accent',
  ghost: 'ghost',
  'ghost-inverse': 'ghost-inverse',
  danger: 'danger',
}

export const SIZE_MAP = {
  sm: 'sm',
  normal: 'md',
  lg: 'lg',
}

export default function Button({
  variant = 'normal',
  size = 'normal',
  className = '',
  style = {},
  children,
  disabled = false,
  type = 'button',
  ...rest
}) {
  return (
    <ShadcnButton
      type={type}
      variant={VARIANT_MAP[variant] ?? 'outline'}
      size={SIZE_MAP[size] ?? 'md'}
      className={cn('font-semibold', className)}
      style={style}
      disabled={disabled}
      {...rest}
    >
      {children}
    </ShadcnButton>
  )
}
