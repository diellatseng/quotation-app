import { describe, expect, it } from 'vitest'
import {
  baseFeeFromGrand,
  grandTotalFromFee,
  addPaymentStage,
  defaultPaymentStages,
  remainingStagePercentage,
  stageAmountFromPercentage,
  stagesFromPreset,
  PAYMENT_STAGE_PRESETS,
} from '../paymentStagePresets'
import { validateManualPaymentSetup, saveManualPaymentStages, paymentSetupSourceLabel } from '../paymentStages'

describe('grandTotalFromFee', () => {
  it('adds 5% tax when tax included', () => {
    expect(grandTotalFromFee(100000, true)).toBe(105000)
  })

  it('returns fee when tax excluded', () => {
    expect(grandTotalFromFee(100000, false)).toBe(100000)
  })
})

describe('baseFeeFromGrand', () => {
  it('reverses tax-inclusive total for manual edit', () => {
    expect(baseFeeFromGrand(105000, true)).toBe(100000)
    expect(baseFeeFromGrand(100000, false)).toBe(100000)
  })
})

describe('defaultPaymentStages', () => {
  it('returns three default stages matching quotation wizard', () => {
    const stages = defaultPaymentStages()
    expect(stages).toHaveLength(3)
    expect(stages.map(s => s.stage_name)).toEqual(['開工前', '施工中', '完工後'])
    expect(stages.map(s => s.percentage)).toEqual([30, 40, 30])
  })
})

describe('addPaymentStage', () => {
  it('auto-fills remainder percentage when under 100%', () => {
    const stages = addPaymentStage([
      { id: '1', stage_name: '開工', percentage: 30, amount: 30000 },
    ], 100000)
    expect(stages).toHaveLength(2)
    expect(stages[1].percentage).toBe(70)
    expect(stages[1].amount).toBe(70000)
  })

  it('uses 0% when already at 100%', () => {
    const stages = addPaymentStage([
      { id: '1', stage_name: '全部', percentage: 100, amount: 100000 },
    ], 100000)
    expect(stages[1].percentage).toBe(0)
  })

  it('computes remaining percentage helper', () => {
    expect(remainingStagePercentage([{ percentage: 30 }, { percentage: 40 }])).toBe(30)
  })
})

describe('stagesFromPreset', () => {
  it('computes amounts from contract total', () => {
    const stages = stagesFromPreset(PAYMENT_STAGE_PRESETS[0], 100000)
    expect(stages).toHaveLength(2)
    expect(stages[0].amount).toBe(stageAmountFromPercentage(100000, 50))
  })
})

describe('validateManualPaymentSetup', () => {
  it('requires contract amount, stage names, percentages, and amounts', () => {
    const { valid, missing } = validateManualPaymentSetup({
      contractTotal: '',
      taxIncluded: false,
      stages: [],
    })
    expect(valid).toBe(false)
    expect(missing).toContain('合約金額 (未稅)')
    expect(missing).toContain('付款階段')
  })

  it('rejects zero contract amount', () => {
    const stages = defaultPaymentStages(0)
    const { valid, missing } = validateManualPaymentSetup({
      contractTotal: 0,
      taxIncluded: false,
      stages,
    })
    expect(valid).toBe(false)
    expect(missing).toContain('合約金額 (未稅)')
  })

  it('rejects zero stage amounts when contract amount is set', () => {
    const stages = defaultPaymentStages(0)
    const { valid, missing } = validateManualPaymentSetup({
      contractTotal: 100000,
      taxIncluded: false,
      stages,
    })
    expect(valid).toBe(false)
    stages.forEach((_, idx) => {
      expect(missing).toContain(`付款階段 ${idx + 1} 金額`)
    })
  })

  it('accepts valid default stages', () => {
    const stages = defaultPaymentStages(100000)
    const { valid } = validateManualPaymentSetup({
      contractTotal: 100000,
      taxIncluded: false,
      stages,
    })
    expect(valid).toBe(true)
  })
})

describe('paymentSetupSourceLabel', () => {
  it('returns manual label when no source quotation', () => {
    expect(paymentSetupSourceLabel({ source_quotation_id: null }, [])).toEqual({
      mode: 'manual',
      text: '手動建立',
    })
  })

  it('returns quotation number when imported from quotation', () => {
    expect(paymentSetupSourceLabel(
      { source_quotation_id: 'q-1' },
      [{ id: 'q-1', quote_number: 'Q2026-001', version: 1 }],
    )).toEqual({
      mode: 'quotation',
      text: '報價單',
      quoteNumber: 'Q2026-001',
    })
  })
})

describe('saveManualPaymentStages', () => {
  it('throws when contract amount is zero', async () => {
    await expect(
      saveManualPaymentStages({ from: () => ({}) }, 'proj-1', defaultPaymentStages(0), {
        contractTotal: 0,
        taxIncluded: false,
      }),
    ).rejects.toThrow(/合約金額/)
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
