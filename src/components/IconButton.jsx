import Icon from './Icon'
import Button from './Button'

/**
 * IconButton — Button with integrated Material Symbol icon (and optional label)
 * Uses the shared Button component for consistent styling
 *
 * @param {string} icon - Material Symbol name (e.g., 'delete', 'expand_more')
 * @param {string} label - Label text to display next to icon
 * @param {string} tooltip - Tooltip text on hover
 * @param {function} onClick - Click handler
 * @param {string} variant - Button variant: 'normal' | 'accent' | 'ghost' | 'danger' (default: 'normal')
 * @param {string} size - Button size: 'sm' | 'normal' | 'lg' (default: 'normal')
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles to override defaults
 * @param {boolean} disabled - Disable the button
 * @param {string} type - Button type (default: 'button')
 * @param {React.ReactNode} children - Optional custom label text to display next to icon (overrides label)
 * @returns {JSX.Element}
 *
 * Usage (icon + label):
 *  <IconButton icon="edit" label="編輯" tooltip="編輯說明" onClick={handleEdit} />
 *
 * Usage (icon only):
 *  <IconButton icon="delete" tooltip="刪除此項目" onClick={handleDelete} />
 *
 * Usage (icon + custom label):
 *  <IconButton icon="edit" tooltip="Edit" onClick={handleEdit}>
 *    自訂標籤
 *  </IconButton>
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
}) {
  // Display children if provided, otherwise display label
  const displayLabel = children || label

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
      title={tooltip}
      aria-label={tooltip || label}
      disabled={disabled}
    >
      <Icon name={icon} title={tooltip} />
      {displayLabel}
    </Button>
  )
}
