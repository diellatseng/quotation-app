// src/components/__tests__/ROCDateInput.test.jsx
//
// Tests for <ROCDateInput />, a controlled date field that supports
// both ROC (民國) and CE (西元) entry modes.
//
// Key behaviours under test:
//  - Renders label and toggle button
//  - Displays a CE value converted to ROC format in the text box
//  - Starts in ROC mode by default; toggle button switches to CE mode and back
//  - Calls onChange with a CE string ("YYYY-MM-DD") regardless of entry mode
//  - Calls onChange with "" when the input is cleared
//  - Shows the correct placeholder and hint text for each mode
//  - Works without a label (label prop omitted)
//  - Handles an empty initial value without crashing
//
// NOTE on userEvent.type vs fireEvent.change:
//  userEvent.type fires onChange on EVERY keystroke, so asserting the last call
//  would check only the final character, not the complete value.
//  For date string inputs we use fireEvent.change to simulate the user
//  completing the full value — this matches how a date field behaves in practice
//  (the value is committed as a whole, not character by character).
//
// How to run only this file:
//   npm test -- --testPathPattern="ROCDateInput" --watchAll=false

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ROCDateInput from '../ROCDateInput'

describe('ROCDateInput', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    // Reset call history before each test so assertions stay independent
    mockOnChange.mockClear()
  })

  // ───────────────────────────────────────────────────────────────
  // Rendering
  // ───────────────────────────────────────────────────────────────

  it('renders the label text when a label prop is provided', () => {
    // Expected: the string "報價日期" appears in the document
    render(<ROCDateInput label="報價日期" value="" onChange={mockOnChange} />)
    expect(screen.getByText('報價日期')).toBeInTheDocument()
  })

  it('renders without a label when label prop is omitted', () => {
    // Expected: no crash; the text input is still accessible via its aria-label
    render(<ROCDateInput value="" onChange={mockOnChange} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders without crashing when value is empty string', () => {
    // Expected: component mounts cleanly; input value is ""
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    expect(screen.getByRole('textbox').value).toBe('')
  })

  // ───────────────────────────────────────────────────────────────
  // Display / value conversion
  // ───────────────────────────────────────────────────────────────

  it('converts and displays a CE value as ROC format in the text box', () => {
    // Input value "2025-08-18" (CE) → displayed as "114-08-18" (ROC)
    // because default mode is 民國
    render(<ROCDateInput value="2025-08-18" onChange={mockOnChange} />)
    expect(screen.getByRole('textbox').value).toBe('114-08-18')
  })

  it('displays a CE value as-is when in CE mode', async () => {
    // After toggling to 西元 mode, the value should not be converted
    const user = userEvent.setup()
    render(<ROCDateInput label="日期" value="2025-08-18" onChange={mockOnChange} />)
    await user.click(screen.getByText('民國')) // switch to CE mode
    expect(screen.getByRole('textbox').value).toBe('2025-08-18')
  })

  // ───────────────────────────────────────────────────────────────
  // Mode toggle
  // ───────────────────────────────────────────────────────────────

  it('shows "民國" toggle button by default (starts in ROC mode)', () => {
    // The button label reflects the *current* active mode
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    expect(screen.getByText('民國')).toBeInTheDocument()
  })

  it('switches button label from "民國" to "西元" after one click', async () => {
    // Expected: clicking once toggles to CE mode; button now shows "西元"
    const user = userEvent.setup()
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    await user.click(screen.getByText('民國'))
    expect(screen.getByText('西元')).toBeInTheDocument()
  })

  it('switches back to "民國" mode after a second toggle click', async () => {
    // Expected: two clicks → back to ROC mode; button shows "民國" again
    const user = userEvent.setup()
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    await user.click(screen.getByText('民國'))
    await user.click(screen.getByText('西元'))
    expect(screen.getByText('民國')).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────
  // onChange behaviour — ROC mode
  //
  // We use fireEvent.change (instead of userEvent.type) because date
  // inputs are filled as a complete value. userEvent.type fires onChange
  // on every keystroke, so the last call would be for the final character
  // alone, not the full date string.
  // ───────────────────────────────────────────────────────────────

  it('calls onChange with a CE string when user enters a full ROC date', () => {
    // User fills in "114-08-18" in ROC mode (default)
    // Expected: onChange receives the CE equivalent "2025-08-18"
    render(<ROCDateInput value="" onChange={mockOnChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '114-08-18' } })
    expect(mockOnChange).toHaveBeenCalledWith('2025-08-18')
  })

  it('calls onChange with "" when the input is cleared', () => {
    // User deletes all text
    // Expected: onChange receives "" (not null or undefined)
    render(<ROCDateInput value="2025-08-18" onChange={mockOnChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } })
    expect(mockOnChange).toHaveBeenCalledWith('')
  })

  it('calls onChange once per change event (not per keystroke)', () => {
    // Expected: one fireEvent.change → exactly one onChange call
    render(<ROCDateInput value="" onChange={mockOnChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '114-08-18' } })
    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  // ───────────────────────────────────────────────────────────────
  // onChange behaviour — CE mode
  // ───────────────────────────────────────────────────────────────

  it('calls onChange with the CE string as-is when user enters a date in CE mode', async () => {
    // After toggling to 西元, the raw value is passed through unchanged
    // Expected: onChange receives "2025-08-18" directly (no conversion)
    const user = userEvent.setup()
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    await user.click(screen.getByText('民國')) // switch to CE mode
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '2025-08-18' } })
    expect(mockOnChange).toHaveBeenCalledWith('2025-08-18')
  })

  // ───────────────────────────────────────────────────────────────
  // Placeholder and hint text
  // ───────────────────────────────────────────────────────────────

  it('shows ROC format hint text in default (民國) mode', () => {
    // Expected: hint paragraph contains "民國年-月-日"
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    expect(screen.getByText(/民國年-月-日/)).toBeInTheDocument()
  })

  it('shows CE format hint text after switching to 西元 mode', async () => {
    // Expected: after toggle, hint paragraph contains "西元年-月-日"
    const user = userEvent.setup()
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    await user.click(screen.getByText('民國'))
    expect(screen.getByText(/西元年-月-日/)).toBeInTheDocument()
  })
})
