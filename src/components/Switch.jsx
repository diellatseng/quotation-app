/**
 * Material 3 inspired Switch component with dual labels
 * 
 * Usage with dual labels:
 * <Switch
 *   checked={isEnabled}
 *   onChange={(val) => setIsEnabled(val)}
 *   labelOff="ROC"
 *   labelOn="CE"
 *   id="dateFormat"
 * />
 * 
 * Usage with single label:
 * <Switch
 *   checked={showArchived}
 *   onChange={setShowArchived}
 *   label="顯示已封存"
 *   id="archiveToggle"
 * />
 */

import '../styles/Switch.css'

export default function Switch({
  checked = false,
  onChange,
  label = null,
  labelOff = 'Off',
  labelOn = 'On',
  id,
  ariaLabel,
  disabled = false,
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  const handleClick = () => {
    if (!disabled) {
      onChange?.(!checked)
    }
  }

  const handleKeyDown = (e) => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange?.(!checked)
    }
  }

  // Single label mode
  if (label !== null) {
    return (
      <div className={`switch-wrapper switch-wrapper--${size}`}>
        <label htmlFor={id} className="switch-label-single">
          {label}
        </label>
        
        <button
          id={id}
          role="switch"
          type="button"
          className={`switch ${checked ? 'switch--on' : 'switch--off'} switch--${size} ${disabled ? 'switch--disabled' : ''}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-checked={checked}
          aria-label={ariaLabel || label}
          disabled={disabled}
        >
          <span className="switch-thumb" />
        </button>
      </div>
    )
  }

  // Dual label mode
  return (
    <div className={`switch-wrapper switch-wrapper--${size}`}>
      <label htmlFor={id} className="switch-label-off">
        {labelOff}
      </label>
      
      <button
        id={id}
        role="switch"
        type="button"
        className={`switch ${checked ? 'switch--on' : 'switch--off'} switch--${size} ${disabled ? 'switch--disabled' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-checked={checked}
        aria-label={ariaLabel || `${labelOff} / ${labelOn}`}
        disabled={disabled}
      >
        <span className="switch-thumb" />
      </button>

      <label htmlFor={id} className="switch-label-on">
        {labelOn}
      </label>
    </div>
  )
}
