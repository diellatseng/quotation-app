import { describe, expect, it } from 'vitest'
import { groupDisbursementsByStage, sumDisbursements } from '../disbursements'

describe('sumDisbursements', () => {
  it('sums amounts', () => {
    expect(sumDisbursements([
      { amount: 100 },
      { amount: 250.5 },
    ])).toBe(350.5)
  })

  it('returns 0 for empty list', () => {
    expect(sumDisbursements([])).toBe(0)
  })
})

describe('groupDisbursementsByStage', () => {
  it('groups by payment_stage_id', () => {
    const map = groupDisbursementsByStage([
      { payment_stage_id: 'a', name: '規費', amount: 100 },
      { payment_stage_id: 'b', name: '郵資', amount: 50 },
      { payment_stage_id: 'a', name: '雜項', amount: 20 },
    ])

    expect(map.get('a')).toHaveLength(2)
    expect(map.get('b')).toHaveLength(1)
    expect(map.get('c')).toBeUndefined()
  })
})
