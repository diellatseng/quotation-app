import { describe, expect, it } from 'vitest'
import {
  formatQuotationValidationMessage,
  validateQuotationForSend,
} from '../validateQuotation'

const complete = {
  clientId: 'client-1',
  projectName: '住宅新建工程',
  quoteNumber: 'QT-2025-00001',
  quoteDate: '2025-06-14',
  feeAmount: 100000,
  paymentStages: [
    { stage_name: '開工前', percentage: 50 },
    { stage_name: '完工後', percentage: 50 },
  ],
}

describe('validateQuotationForSend', () => {
  it('passes when all required fields are present', () => {
    expect(validateQuotationForSend(complete)).toEqual({ valid: true, missing: [] })
  })

  it('reports missing client and project name', () => {
    const result = validateQuotationForSend({
      ...complete,
      clientId: null,
      projectName: '  ',
    })
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('客戶')
    expect(result.missing).toContain('工程名稱')
  })

  it('reports invalid fee amount', () => {
    const result = validateQuotationForSend({ ...complete, feeAmount: 0 })
    expect(result.missing).toContain('報價金額 (未稅)')
  })

  it('reports payment stage field gaps and total percentage', () => {
    const result = validateQuotationForSend({
      ...complete,
      paymentStages: [{ stage_name: '', percentage: '' }, { stage_name: '完工', percentage: 40 }],
    })
    expect(result.missing).toContain('付款階段 1 名稱')
    expect(result.missing).toContain('付款階段 1 百分比')
    expect(result.missing).toContain('付款階段百分比總和（需為 100%）')
  })
})

describe('formatQuotationValidationMessage', () => {
  it('joins missing labels for toast display', () => {
    expect(formatQuotationValidationMessage(['客戶', '工程名稱'])).toBe(
      '無法發送報價，請補齊：客戶、工程名稱',
    )
  })
})
