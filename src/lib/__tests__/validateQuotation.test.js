import { describe, expect, it } from 'vitest'
import {
  formatQuotationValidationMessage,
  validateQuotationForSend,
  validateQuotationForDraft,
  validateQuotationRecordForSend,
  formatQuotationDraftValidationMessage,
} from '../validateQuotation'

const complete = {
  clientId: 'client-1',
  landSection: '鹽埕段一小段 123',
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

  it('reports missing client and land section', () => {
    const result = validateQuotationForSend({
      ...complete,
      clientId: null,
      landSection: '  ',
    })
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('客戶')
    expect(result.missing).toContain('地號')
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

const draftComplete = {
  clientId: 'client-1',
  quoteNumber: 'QT-2025-00001',
  quoteDate: '2025-06-14',
  feeAmount: 100000,
  paymentStages: complete.paymentStages,
}

describe('validateQuotationForDraft', () => {
  it('passes when required draft fields are present', () => {
    expect(validateQuotationForDraft(draftComplete)).toEqual({ valid: true, missing: [] })
  })

  it('reports missing fee amount', () => {
    const result = validateQuotationForDraft({
      ...draftComplete,
      feeAmount: 0,
    })
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('報價金額 (未稅)')
  })

  it('reports missing payment stages', () => {
    const result = validateQuotationForDraft({
      ...draftComplete,
      paymentStages: [],
    })
    expect(result.missing).toContain('付款階段')
  })

  it('reports payment stage total not equal to 100%', () => {
    const result = validateQuotationForDraft({
      ...draftComplete,
      paymentStages: [{ stage_name: '開工前', percentage: 40 }],
    })
    expect(result.missing).toContain('付款階段百分比總和（需為 100%）')
  })
})
describe('formatQuotationDraftValidationMessage', () => {
  it('joins missing labels for toast display', () => {
    expect(formatQuotationDraftValidationMessage(['報價金額 (未稅)'])).toBe(
      '無法儲存草稿，請補齊：報價金額 (未稅)',
    )
  })
})

describe('validateQuotationRecordForSend', () => {
  it('uses linked project land_section, not quotation snapshot', () => {
    const result = validateQuotationRecordForSend(
      {
        client_id: 'client-1',
        land_section: '',
        quote_number: 'QT-2025-00001',
        quote_date: '2025-06-14',
        fee_amount: 100000,
        projects: { land_section: '鹽埕段一小段 123' },
      },
      complete.paymentStages,
    )
    expect(result).toEqual({ valid: true, missing: [] })
  })

  it('reports missing land section when project has none', () => {
    const result = validateQuotationRecordForSend(
      {
        client_id: 'client-1',
        land_section: '鹽埕段一小段 123',
        quote_number: 'QT-2025-00001',
        quote_date: '2025-06-14',
        fee_amount: 100000,
        projects: { land_section: '' },
      },
      complete.paymentStages,
    )
    expect(result.missing).toContain('地號')
  })
})

describe('formatQuotationValidationMessage', () => {
  it('joins missing labels for toast display', () => {
    expect(formatQuotationValidationMessage(['客戶', '地號'])).toBe(
      '無法發送報價，請補齊：客戶、地號',
    )
  })
})
