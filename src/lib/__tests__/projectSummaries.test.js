import { describe, expect, it } from 'vitest'
import {
  getBillingSummary,
  getQuotationSummary,
} from '../projectSummaries'

describe('getQuotationSummary', () => {
  it('returns 無報價 when empty', () => {
    expect(getQuotationSummary([])).toBe('無報價')
  })

  it('returns 草稿 when only drafts exist', () => {
    expect(getQuotationSummary([{ status: '草稿' }])).toBe('草稿')
  })

  it('returns 已確認 when any quotation is confirmed', () => {
    expect(getQuotationSummary([
      { status: '草稿' },
      { status: '已確認' },
    ])).toBe('已確認')
  })

  it('returns 已報價 when quoted but not confirmed', () => {
    expect(getQuotationSummary([{ status: '已報價' }])).toBe('已報價')
  })
})

describe('getBillingSummary', () => {
  const stages = [{ id: 's1' }, { id: 's2' }]

  it('returns 未設定 without stages', () => {
    expect(getBillingSummary([], [])).toBe('未設定')
  })

  it('returns 未請款 when no invoices', () => {
    expect(getBillingSummary(stages, [])).toBe('未請款')
  })

  it('returns 已結清 when all stages received', () => {
    expect(getBillingSummary(stages, [
      { payment_stage_id: 's1', status: '已收款' },
      { payment_stage_id: 's2', status: '已收款' },
    ])).toBe('已結清')
  })

  it('returns 部分收款 when some received', () => {
    expect(getBillingSummary(stages, [
      { payment_stage_id: 's1', status: '已收款' },
      { payment_stage_id: 's2', status: '已請款' },
    ])).toBe('部分收款')
  })

  it('returns 請款中 when invoiced but none received', () => {
    expect(getBillingSummary(stages, [
      { payment_stage_id: 's1', status: '已請款' },
    ])).toBe('請款中')
  })
})
