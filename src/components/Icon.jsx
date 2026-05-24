/**
 * Icon — Material Symbols wrapper component
 * Renders Google Material Symbols with consistent styling
 * Reference: https://developers.google.com/fonts/docs/material_symbols
 *
 * @param {string} name - Material Symbol name (e.g., 'expand_more', 'expand_less')
 * @param {object} style - Inline styles to override defaults
 * @param {string} title - Tooltip text / aria-label
 * @returns {JSX.Element}
 */
export default function Icon({ name, style = {}, title = '' }) {
  return (
    <span
      className="material-symbols-outlined"
      style={style}
      title={title}
      role="img"
      aria-label={title}
    >
      {name}
    </span>
  )
}
