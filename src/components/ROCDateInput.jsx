// src/components/ROCDateInput.jsx
import { useState } from 'react'
import { ceToRocInput, rocInputToCe } from '../lib/rocDate'

/**
 * A date input that supports both ROC (民國) and CE (西元) formats.
 * Internally always stores/emits CE date strings (YYYY-MM-DD).
 */
export default function ROCDateInput({ value, onChange, id, label, required }) {
  const [useRoc, setUseRoc] = useState(true)

  const displayValue = useRoc ? ceToRocInput(value) : value

  const handleChange = (e) => {
    const raw = e.target.value
    if (!raw) { onChange(''); return }
    const ce = useRoc ? rocInputToCe(raw) : raw
    onChange(ce)
  }

  const toggleMode = () => setUseRoc(r => !r)

  const placeholder = useRoc ? '114-01-01 (民國)' : '2025-01-01 (西元)'

  return (
    <div>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <label htmlFor={id} className="field-label" style={{ margin: 0 }}>{label}</label>
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 10px',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            aria-label={useRoc ? '切換至西元' : '切換至民國'}
          >
            {useRoc ? '民國' : '西元'}
          </button>
        </div>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className="field-input"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        aria-label={label || (useRoc ? '民國日期' : '西元日期')}
      />
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
        格式：{useRoc ? '民國年-月-日，例如 114-08-18' : '西元年-月-日，例如 2025-08-18'}
      </p>
    </div>
  )
}
