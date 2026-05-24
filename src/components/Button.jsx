/**
 * Button — shared button with `type` (variant) and `size` props
 * - `variant` controls color/background/border: 'normal' | 'accent' | 'ghost' | 'danger'
 * - `size` controls padding/height: 'sm' | 'normal' | 'lg'
 *
 * Props:
 *  - variant: string
 *  - size: string
 *  - className: string (extra classes)
 *  - style: object (inline overrides)
 *  - children
 *  - ...rest (onClick, type, disabled, aria-*)
 */
export default function Button({
  variant = 'normal',
  size = 'normal',
  className = '',
  style = {},
  children,
  ...rest
}) {
  const cls = `btn btn--${variant} btn--size-${size} ${className}`.trim()
  return (
    <button className={cls} style={style} {...rest}>
      {children}
    </button>
  )
}
