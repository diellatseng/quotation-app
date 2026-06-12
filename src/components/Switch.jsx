// src/components/Switch.jsx
/**
 * Material 3 inspired Switch component with dual labels
 */
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

  // Size specifications mapping
  const sizeMap = {
    sm: {
      wrapper: 'gap-2',
      track: 'w-9 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-4',
      text: 'text-xs'
    },
    md: {
      wrapper: 'gap-3',
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
      text: 'text-sm'
    },
    lg: {
      wrapper: 'gap-4',
      track: 'w-14 h-8',
      thumb: 'w-6 h-6',
      translate: 'translate-x-6',
      text: 'text-base'
    }
  }

  const currentSize = sizeMap[size] || sizeMap.md

  const trackClasses = `relative inline-flex items-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${currentSize.track} ${checked ? 'bg-primary' : 'bg-muted-foreground/30 dark:bg-muted-foreground/50'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`

  const thumbClasses = `inline-block rounded-full bg-white shadow transition-transform duration-200 transform ${currentSize.thumb} ${checked ? currentSize.translate : 'translate-x-0.5'
    }`

  const labelBase = `font-medium select-none transition-colors duration-200 ${currentSize.text} ${disabled ? 'text-muted-foreground/40' : 'cursor-pointer'
    }`

  if (label !== null) {
    return (
      <div className={`inline-flex items-center ${currentSize.wrapper}`}>
        <label htmlFor={id} className={`${labelBase} text-foreground`}>
          {label}
        </label>

        <button
          id={id}
          role="switch"
          type="button"
          className={trackClasses}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-checked={checked}
          aria-label={ariaLabel || label}
          disabled={disabled}
        >
          <span className={thumbClasses} />
        </button>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center ${currentSize.wrapper}`}>
      <label
        htmlFor={id}
        className={`${labelBase} ${!checked && !disabled ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {labelOff}
      </label>

      <button
        id={id}
        role="switch"
        type="button"
        className={trackClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-checked={checked}
        aria-label={ariaLabel || `${labelOff} / ${labelOn}`}
        disabled={disabled}
      >
        <span className={thumbClasses} />
      </button>

      <label
        htmlFor={id}
        className={`${labelBase} ${checked && !disabled ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {labelOn}
      </label>
    </div>
  )
}