import '../styles/components/FilterPill.css'

/**
 * FilterPill — Selection/filter toggle button
 * 
 * A pill-shaped button for toggling filter selections.
 * Displays active/inactive state via aria-pressed and styling.
 * 
 * @param {boolean} pressed - Whether this filter is currently selected
 * @param {function} onChange - Callback when pill is clicked
 * @param {string} children - Pill text content
 * @param {object} rest - Additional props (className, style, etc.)
 * 
 * @example
 * <FilterPill pressed={statusFilter === '草稿'} onChange={() => setStatusFilter('草稿')}>
 *   草稿
 * </FilterPill>
 */
export default function FilterPill({ pressed = false, onChange, children, ...rest }) {
  return (
    <button
      className="filter-pill"
      aria-pressed={pressed}
      onClick={onChange}
      {...rest}
    >
      {children}
    </button>
  )
}
