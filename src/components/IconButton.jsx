import Icon from './Icon'
import Button from './Button'

/**
 * IconButton — Button with integrated Material Symbol icon
 * Uses the shared Button component for consistent styling
 *
 * @param {string} icon - Material Symbol name (e.g., 'delete', 'expand_more')
 * @param {string} title - Tooltip text (applied to both button and icon)
 * @param {function} onClick - Click handler
 * @param {string} variant - Button variant: 'normal' | 'accent' | 'ghost' | 'danger' (default: 'normal')
 * @param {string} size - Button size: 'sm' | 'normal' | 'lg' (default: 'normal')
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles to override defaults
 * @param {string} label - aria-label for accessibility
 * @param {boolean} disabled - Disable the button
 * @param {string} type - Button type (default: 'button')
 * @returns {JSX.Element}
 */
export default function IconButton({
  icon,
  title = '',
  onClick,
  variant = 'normal',
  size = 'normal',
  className = '',
  style = {},
  label = '',
  disabled = false,
  type = 'button',
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      variant={variant}
      size={size}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        ...style,
      }}
      title={title}
      aria-label={label || title}
      disabled={disabled}
    >
      <Icon name={icon} title={title} />
    </Button>
  )
}
