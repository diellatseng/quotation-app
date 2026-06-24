import { describe, expect, it } from 'vitest'
import { needsStartWorkConfirmation } from '../startProjectWork'

describe('needsStartWorkConfirmation', () => {
  it('requires confirmation when quoted but not confirmed', () => {
    expect(needsStartWorkConfirmation([{ status: '已報價' }])).toBe(true)
  })

  it('does not require confirmation when confirmed exists', () => {
    expect(needsStartWorkConfirmation([
      { status: '已報價' },
      { status: '已確認' },
    ])).toBe(false)
  })

  it('does not require confirmation without quoted quotation', () => {
    expect(needsStartWorkConfirmation([{ status: '草稿' }])).toBe(false)
    expect(needsStartWorkConfirmation([])).toBe(false)
  })
})
