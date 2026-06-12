// src/components/Icon.jsx
import React from 'react'

/**
 * Icon — Material Symbols wrapper component
 * Renders Google Material Symbols with consistent styling using Tailwind utilities
 */
export default function Icon({ name, style = {}, title = '', className = '' }) {
  return (
    <span
      className={`material-symbols-outlined select-none align-middle ${className}`}
      style={style}
      title={title}
      role="img"
      aria-label={title}
    >
      {name}
    </span>
  )
}