// src/components/ROCDateInput.jsx
import { useState } from 'react'
import { 
  ceToRocInput, rocInputToCe, ceInputToCe,
  formatRocInputDisplay, formatCeInputDisplay
} from '../lib/rocDate'

/**
 * A date input that supports both ROC (民國) and CE (西元) formats.
 * Internally always stores/emits CE date strings (YYYY-MM-DD).
 * Display format uses 年月日 separators.
 */
export default function ROCDateInput({ value, onChange, id, label, required }) {
  const [useRoc, setUseRoc] = useState(true)
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

  const toggleMode = () => {
    // Prevent mode switching if there's an invalid date
    if (inputValue !== null && inputValue !== '' && error) {
      setError('請先修正日期格式')
      return
    }

    // If switching mode, reset inputValue to show converted format
    setInputValue(null)
    setUseRoc(r => !r)
  }

  const placeholder = useRoc ? '114年12月31日 或 1141231' : '2026年12月31日 或 20261231'

  return (
    <div>
      {label && (
        <div className="roc-label-row">
          <label htmlFor={id} className="field-label">{label}</label>
          <button
            type="button"
            onClick={toggleMode}
            className="roc-toggle"
            aria-label={useRoc ? '切換至西元' : '切換至民國'}
            disabled={error ? true : false}
          >
            {useRoc ? '民國' : '西元'}
          </button>
        </div>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className={`field-input ${error ? 'field-input-error' : ''}`}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        aria-label={label || (useRoc ? '民國日期' : '西元日期')}
      />
      {error && <p className="roc-error">{error}</p>}
      <p className="roc-hint">
        格式：{useRoc ? '民國年月日，例如 114年12月31日 或 1141231' : '西元年月日，例如 2026年12月31日 或 20261231'}
      </p>
    </div>
  )
}
