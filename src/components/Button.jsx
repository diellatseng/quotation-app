// src/components/Button.jsx
import React from 'react'

const VARIANT_MAP = {
  // Clear, high-contrast signature action
  primary: 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-sm focus-visible:ring-2 focus-visible:ring-primary',

  // Secondary layout boundary button
  normal: 'bg-card text-foreground border border-border hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-border',

  // Clean brand highlights—now scaling independently from structural colors
  accent: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm focus-visible:ring-2 focus-visible:ring-accent',

  // Completely clear base, inherits parent background characteristics safely
  ghost: 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground focus-visible:bg-muted',

  // Destructive layout action—now fully configurable on a per-theme basis
  danger: 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 shadow-sm focus-visible:ring-2 focus-visible:ring-destructive',
}

const SIZE_MAP = {
  sm: 'h-8 px-3 text-xs gap-1 rounded-sm',
  normal: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-6 text-base gap-2 rounded-lg',
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
  const baseClasses = 'inline-flex items-center justify-center font-semibold whitespace-nowrap cursor-pointer transition-colors duration-200 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed select-none outline-none'

  const variantClasses = VARIANT_MAP[variant] || VARIANT_MAP.normal
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.normal

  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim()

  return (
    <button
      type={type}
      className={combinedClasses}
      style={style}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}