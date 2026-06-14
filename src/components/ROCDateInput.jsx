// src/components/ROCDateInput.jsx
import { useState } from 'react'
import { 
  ceToRocInput, rocInputToCe, ceInputToCe,
  formatRocInputDisplay, formatCeInputDisplay
} from '../lib/rocDate'

/**
 * A controlled date input that supports both ROC (民國) and CE (西元) formats.
 * Internally always stores/emits CE date strings (YYYY-MM-DD).
 * Display format uses 年月日 separators.
 * 
 * Props:
 *   value {string} - CE date string (YYYY-MM-DD)
 *   onChange {function} - Callback when date changes
 *   useRoc {boolean} - Current mode (controlled from parent)
 *   id {string} - HTML id for input
 *   label {string} - Label text
 *   required {boolean} - Whether field is required
 */
export default function ROCDateInput({ value, onChange, useRoc = true, id, label, required }) {
  const [inputValue, setInputValue] = useState(null) // null = not editing, shows prop value
  const [error, setError] = useState('')

  // Show inputValue while typing, otherwise show converted prop value
  const displayValue = inputValue !== null ? inputValue : (useRoc ? ceToRocInput(value) : (value ? `${value.replace(/-/g, '年')}日` : ''))

  const handleChange = (e) => {
    const raw = e.target.value
    setInputValue(raw)
    setError('')

    if (!raw) { 
      onChange('')
      return 
    }

    // Try to convert - only emit if valid
    if (useRoc) {
      const ce = rocInputToCe(raw)
      if (ce) {
        onChange(ce)
      }
    } else {
      const ce = ceInputToCe(raw)
      if (ce) {
        onChange(ce)
      }
    }
  }

  const handleBlur = () => {
    if (inputValue === null || inputValue === '') {
      setInputValue(null)
      return
    }

    // Try to parse and auto-format
    let formattedValue = ''
    let isValid = false
    let ceDateValue = ''

    if (useRoc) {
      ceDateValue = rocInputToCe(inputValue)
      if (ceDateValue) {
        formattedValue = formatRocInputDisplay(inputValue)
        isValid = true
      }
    } else {
      ceDateValue = ceInputToCe(inputValue)
      if (ceDateValue) {
        formattedValue = formatCeInputDisplay(inputValue)
        isValid = true
      }
    }

    if (isValid) {
      // Valid date: show formatted display and emit CE value
      setInputValue(formattedValue)
      onChange(ceDateValue)
      setError('')
    } else {
      // Invalid date: show error and keep raw input visible
      setError('無效的日期格式')
      // Keep inputValue so user can see what they typed and fix it
    }
  }

  const placeholder = useRoc ? '114年12月31日 或 1141231' : '2026年12月31日 或 20261231'

  return (
    <div>
      {label && <label htmlFor={id} className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className={`w-full h-10 px-3 text-sm bg-background border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all ${error
          ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
          : 'border-border focus:ring-primary/20 focus:border-primary'
          }`}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        aria-label={label || (useRoc ? '民國日期' : '西元日期')}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      <p className="text-xs text-muted-foreground mt-1">
        格式：{useRoc ? '民國年月日，例如 114年12月31日 或 1141231' : '西元年月日，例如 2026年12月31日 或 20261231'}
      </p>
    </div>
  )
}
