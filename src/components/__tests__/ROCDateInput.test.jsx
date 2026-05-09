// src/components/__tests__/ROCDateInput.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ROCDateInput from '../ROCDateInput'

describe('ROCDateInput', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with label', () => {
    render(<ROCDateInput label="報價日期" value="" onChange={mockOnChange} />)
    expect(screen.getByText('報價日期')).toBeInTheDocument()
  })

  it('displays ROC formatted value', () => {
    render(<ROCDateInput value="2025-08-18" onChange={mockOnChange} />)
    const input = screen.getByRole('textbox')
    expect(input.value).toBe('114-08-18')
  })

  it('toggles between ROC and CE mode', async () => {
    const user = userEvent.setup()
    render(<ROCDateInput label="日期" value="" onChange={mockOnChange} />)
    
    expect(screen.getByText('民國')).toBeInTheDocument()
    
    await user.click(screen.getByText('民國'))
    
    expect(screen.getByText('西元')).toBeInTheDocument()
  })

  it('converts ROC input to CE on change', async () => {
    const user = userEvent.setup()
    render(<ROCDateInput value="" onChange={mockOnChange} />)
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, '114-08-18')
    
    expect(mockOnChange).toHaveBeenCalledWith('2025-08-18')
  })
})
