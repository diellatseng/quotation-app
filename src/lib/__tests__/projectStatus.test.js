import { describe, expect, it } from 'vitest'
import { projectStatusFromQuotation } from '../projectStatus'

describe('projectStatusFromQuotation', () => {
  it('does not sync draft quotation to project status', () => {
    expect(projectStatusFromQuotation('草稿')).toBeNull()
  })

  it('maps sent quotation to quoted project', () => {
    expect(projectStatusFromQuotation('已報價')).toBe('已報價')
  })

  it('maps confirmed quotation to confirmed-quote project', () => {
    expect(projectStatusFromQuotation('已確認')).toBe('已確認報價')
  })

  it('does not map closed quotation', () => {
    expect(projectStatusFromQuotation('已結案')).toBeNull()
  })
})
