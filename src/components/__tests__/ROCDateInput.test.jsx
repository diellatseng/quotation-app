// src/components/__tests__/ROCDateInput.test.jsx
//
// Tests for <ROCDateInput />, a controlled date field that supports
// both ROC (民國) and CE (西元) display modes.
//
// Design notes (current implementation):
//  - The component is fully controlled. The active mode is driven by the
//    `useRoc` prop (no internal toggle button) — the parent (e.g. Step4Confirm)
//    owns the 民國/西元 switch.
//  - Internally the field always stores/emits CE date strings ("YYYY-MM-DD").
//  - Display uses 年月日 separators: ROC mode → "114年08月18日",
//    CE mode → "2025年08月18日".
//  - Accepted input: a fully-formatted "XXX年MM月DD日" string, or a raw numeric
//    run (7 digits for ROC "1141231", 8 digits for CE "20250818").
//
// NOTE on userEvent.type vs fireEvent.change:
//  userEvent.type fires onChange on EVERY keystroke, so asserting the last call
//  would check only the final character, not the complete value. Date fields are
//  committed as a whole value, so we use fireEvent.change to simulate the user
//  completing the full value.
//
// How to run only this file:
//   npx vitest run src/components/__tests__/ROCDateInput.test.jsx

import { vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ROCDateInput from '../ROCDateInput'

describe('ROCDateInput', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    // Reset call history before each test so assertions stay independent
    mockOnChange.mockClear()
  })

  // ───────────────────────────────────────────────────────────────
  // Rendering
  // ───────────────────────────────────────────────────────────────

  it('renders the label text when a label prop is provided', () => {
    render(<ROCDateInput label="報價日期" value="" onChange={mockOnChange} />)
    expect(screen.getByText('報價日期')).toBeInTheDocument()
  })

  it('renders without a label when label prop is omitted', () => {
    // No crash; the text input is still accessible via its aria-label
    render(<ROCDateInput value="" onChange={mockOnChange} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders without crashing when value is empty string', () => {
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    expect(screen.getByRole('textbox').value).toBe('')
  })

  // ───────────────────────────────────────────────────────────────
  // Display / value conversion
  // ───────────────────────────────────────────────────────────────

  it('displays a CE value converted to ROC 年月日 format by default (民國 mode)', () => {
    // value "2025-08-18" (CE) → displayed as "114年08月18日" because useRoc defaults to true
    render(<ROCDateInput value="2025-08-18" onChange={mockOnChange} />)
    expect(screen.getByRole('textbox').value).toBe('114年08月18日')
  })

  it('displays a CE value in 西元 年月日 format when useRoc is false', () => {
    // Regression guard: an existing CE value shown in 西元 mode must keep the
    // correct month separator ("月", not "年"). Previously a stray replace turned
    // "2025-08-18" into "2025年08年18日".
    render(<ROCDateInput value="2025-08-18" useRoc={false} onChange={mockOnChange} />)
    expect(screen.getByRole('textbox').value).toBe('2025年08月18日')
  })

  it('re-formats the display when useRoc toggles after blur (民國 ↔ 西元)', () => {
    const { rerender } = render(
      <ROCDateInput value="2025-08-18" useRoc onChange={mockOnChange} />
    )
    const input = screen.getByRole('textbox')
    expect(input.value).toBe('114年08月18日')

    // Simulate blur leaving a formatted ROC string in local state
    fireEvent.change(input, { target: { value: '114年08月18日' } })
    fireEvent.blur(input)
    expect(input.value).toBe('114年08月18日')

    // Parent toggles to 西元 — display should switch to CE format
    rerender(<ROCDateInput value="2025-08-18" useRoc={false} onChange={mockOnChange} />)
    expect(input.value).toBe('2025年08月18日')

    // Toggle back to 民國
    rerender(<ROCDateInput value="2025-08-18" useRoc onChange={mockOnChange} />)
    expect(input.value).toBe('114年08月18日')
  })

  // ───────────────────────────────────────────────────────────────
  // Controlled mode (useRoc prop) — placeholder / hint / aria-label
  // ───────────────────────────────────────────────────────────────

  it('shows the ROC placeholder and hint in 民國 mode (useRoc defaults to true)', () => {
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '114年12月31日 或 1141231')
    expect(screen.getByText(/民國年月日/)).toBeInTheDocument()
  })

  it('shows the CE placeholder and hint when useRoc is false', () => {
    render(<ROCDateInput label="日期" value="" useRoc={false} onChange={mockOnChange} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '2026年12月31日 或 20261231')
    expect(screen.getByText(/西元年月日/)).toBeInTheDocument()
  })

  it('uses a mode-aware aria-label when no label is provided', () => {
    const { rerender } = render(<ROCDateInput value="" onChange={mockOnChange} />)
    expect(screen.getByLabelText('民國日期')).toBeInTheDocument()
    rerender(<ROCDateInput value="" useRoc={false} onChange={mockOnChange} />)
    expect(screen.getByLabelText('西元日期')).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────
  // onChange behaviour — ROC (民國) mode
  // ───────────────────────────────────────────────────────────────

  it('calls onChange with the CE string when a full ROC date is entered (formatted)', () => {
    render(<ROCDateInput value="" onChange={mockOnChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '114年08月18日' } })
    expect(mockOnChange).toHaveBeenCalledWith('2025-08-18')
  })

  it('calls onChange with the CE string for raw 7-digit ROC input', () => {
    render(<ROCDateInput value="" onChange={mockOnChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1140818' } })
    expect(mockOnChange).toHaveBeenCalledWith('2025-08-18')
  })

  it('calls onChange with "" when the input is cleared', () => {
    render(<ROCDateInput value="2025-08-18" onChange={mockOnChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } })
    expect(mockOnChange).toHaveBeenCalledWith('')
  })

  it('calls onChange once per change event (not per keystroke)', () => {
    render(<ROCDateInput value="" onChange={mockOnChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1140818' } })
    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  // ───────────────────────────────────────────────────────────────
  // onChange behaviour — CE (西元) mode
  // ───────────────────────────────────────────────────────────────

  it('calls onChange with the CE string for raw 8-digit CE input when useRoc is false', () => {
    render(<ROCDateInput value="" useRoc={false} onChange={mockOnChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '20250818' } })
    expect(mockOnChange).toHaveBeenCalledWith('2025-08-18')
  })

  it('calls onChange with the CE string for a formatted CE date when useRoc is false', () => {
    render(<ROCDateInput value="" useRoc={false} onChange={mockOnChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2025年08月18日' } })
    expect(mockOnChange).toHaveBeenCalledWith('2025-08-18')
  })
})
