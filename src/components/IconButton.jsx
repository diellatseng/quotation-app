// src/components/IconButton.jsx
import React from 'react'
import Icon from './Icon'
import Button from './Button'

/**
 * IconButton — Button with integrated Material Symbol icon and optional text label
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

  return (
    <Button
      type={type}
      onClick={onClick}
      variant={variant}
      size={size}
      className={className}
      style={style}
      disabled={disabled}
      title={tooltip || label}
      aria-label={tooltip || label}
      {...rest}
    >
      {icon && (
        <Icon
          name={icon}
          className={size === 'sm' ? 'text-[18px]' : 'text-[20px]'}
        />
      )}
      {displayLabel && <span>{displayLabel}</span>}
    </Button>
  )
}