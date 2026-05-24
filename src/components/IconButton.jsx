import Icon from './Icon'

/**
 * IconButton — Button with integrated Material Symbol icon
 * Avoids repetition of title and ensures consistent styling
 *
 * @param {string} icon - Material Symbol name (e.g., 'delete', 'expand_more')
 * @param {string} title - Tooltip text (applied to both button and icon)
 * @param {function} onClick - Click handler
 * @param {string} className - Additional CSS classes (e.g., 'btn-xs--danger')
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
  className = 'btn-xs',
  style = {},
  label = '',
  disabled = false,
  type = 'button',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      title={title}
      aria-label={label || title}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 var(--space-2)',
        ...style,
      }}
    >
      <Icon name={icon} title={title} />
    </button>
  )
}
