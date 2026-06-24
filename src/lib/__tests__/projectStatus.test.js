import { describe, expect, it } from 'vitest'
import { projectStatusFromQuotation, syncProjectStatusFromQuotation } from '../projectStatus'

describe('projectStatusFromQuotation', () => {
  it('is deprecated and always returns null', () => {
    expect(projectStatusFromQuotation('已報價')).toBeNull()
    expect(projectStatusFromQuotation('已確認')).toBeNull()
  })
})

describe('syncProjectStatusFromQuotation', () => {
  it('is a no-op', async () => {
    await expect(syncProjectStatusFromQuotation({}, 'proj-1', '已報價')).resolves.toBeUndefined()
  })
})
