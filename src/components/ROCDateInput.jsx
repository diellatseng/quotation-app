// src/components/ROCDateInput.jsx
import { useState, useEffect } from 'react'
import {
  ceToRocInput, rocInputToCe, ceInputToCe,
  formatRocInputDisplay, formatCeInputDisplay, formatCeDisplay
} from '../lib/rocDate'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

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

  // Parent toggles 民國/西元 — drop any formatted local string so displayValue
  // is re-derived from the CE value in the new mode.
  useEffect(() => {
    setInputValue(null)
    setError('')
  }, [useRoc])

  // Show inputValue while typing, otherwise show converted prop value
  const displayValue = inputValue !== null ? inputValue : (useRoc ? ceToRocInput(value) : formatCeDisplay(value))

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

  const placeholder = useRoc
    ? '民國年月日，例如 114年12月31日 或 1141231'
    : '西元年月日，例如 2026年12月31日 或 20261231'

  const ariaLabel = label || (useRoc ? '民國日期' : '西元日期')

  return (
    <Field data-invalid={error ? true : undefined}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        size="md"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-label={label ? undefined : ariaLabel}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
