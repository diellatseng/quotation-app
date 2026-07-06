import { beforeEach, describe, expect, it } from 'vitest'
import { loadColumnVisibility, saveColumnVisibility } from '../dataTableColumnVisibility'

describe('dataTableColumnVisibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns defaults when nothing is saved', () => {
    expect(loadColumnVisibility('clients', { address: false })).toEqual({ address: false })
  })

  it('merges saved preferences over defaults', () => {
    saveColumnVisibility('clients', { address: true, phone: false })
    expect(loadColumnVisibility('clients', { address: false })).toEqual({
      address: true,
      phone: false,
    })
  })

  it('ignores invalid saved JSON', () => {
    localStorage.setItem('qapp_dt_cols_clients', '{bad json')
    expect(loadColumnVisibility('clients', { address: false })).toEqual({ address: false })
  })
})
