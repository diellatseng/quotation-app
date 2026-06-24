import { describe, expect, it } from 'vitest'
import { needsStartWorkConfirmation } from '../startProjectWork'

describe('needsStartWorkConfirmation', () => {
  it('requires confirmation for 已報價', () => {
    expect(needsStartWorkConfirmation('已報價')).toBe(true)
  })

  it('does not require confirmation for other statuses', () => {
    expect(needsStartWorkConfirmation('已確認報價')).toBe(false)
    expect(needsStartWorkConfirmation('進行中')).toBe(false)
  })
})
