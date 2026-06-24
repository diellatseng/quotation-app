import { describe, expect, it } from 'vitest'
import {
  grandTotalFromFee,
  stageAmountFromPercentage,
  stagesFromPreset,
  PAYMENT_STAGE_PRESETS,
} from '../paymentStagePresets'
import { validateManualPaymentStages } from '../paymentStages'

describe('grandTotalFromFee', () => {
  it('adds 5% tax when tax included', () => {
    expect(grandTotalFromFee(100000, true)).toBe(105000)
  })

  it('returns fee when tax excluded', () => {
    expect(grandTotalFromFee(100000, false)).toBe(100000)
  })
})

describe('stagesFromPreset', () => {
  it('computes amounts from contract total', () => {
    const stages = stagesFromPreset(PAYMENT_STAGE_PRESETS[0], 100000)
    expect(stages).toHaveLength(2)
    expect(stages[0].amount).toBe(stageAmountFromPercentage(100000, 50))
  })
})

describe('validateManualPaymentStages', () => {
  it('requires stage names and amounts', () => {
    expect(validateManualPaymentStages([], 100)).toBe('請至少新增一個付款階段')
    expect(validateManualPaymentStages([{ stage_name: '', amount: 0 }], 100)).toMatch(/名稱/)
    expect(validateManualPaymentStages([{ stage_name: '開工', amount: 0 }], 100)).toMatch(/金額/)
    expect(validateManualPaymentStages([{ stage_name: '開工', amount: 50000 }], 0)).toMatch(/合約/)
    expect(validateManualPaymentStages([{ stage_name: '開工', amount: 50000 }], 100000)).toBeNull()
  })
})

describe('importPaymentStagesFromQuotation', () => {
  it('throws when quotation has no stages', async () => {
    const supabase = {
      from(table) {
        if (table === 'quotations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({ data: { fee_amount: 100, tax_included: false }, error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'payment_stages') {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({ data: [], error: null }),
              }),
            }),
          }
        }
        return {}
      },
    }

    const { importPaymentStagesFromQuotation } = await import('../paymentStages')
    await expect(importPaymentStagesFromQuotation(supabase, 'proj-1', 'q-1')).rejects.toThrow(/尚無付款階段/)
  })
})
