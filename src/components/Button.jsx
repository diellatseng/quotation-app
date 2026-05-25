/**
 * Button — shared button with `variant` and `size` props
 * - `variant` controls color/background/border: 'primary' | 'normal' | 'accent' | 'ghost' | 'danger'
 * - `size` controls padding/height: 'sm' | 'normal' | 'lg'
 *
 * Props:
 *  - variant: string ('primary' | 'normal' | 'accent' | 'ghost' | 'danger')
 *  - size: string ('sm' | 'normal' | 'lg')
 *  - className: string (extra classes)
 *  - style: object (inline overrides)
 *  - children
 *  - ...rest (onClick, type, disabled, aria-*)
 *
 * Usage:
 *  <Button variant="primary" size="lg">新增</Button>
 *  <Button variant="ghost" size="sm">取消</Button>
 */

import '../styles/components/Button.css'

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
