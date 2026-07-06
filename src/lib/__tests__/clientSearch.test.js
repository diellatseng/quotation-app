import { describe, expect, it } from 'vitest'
import { clientGlobalFilterFn, matchesClientSearch } from '../clientSearch'

describe('matchesClientSearch', () => {
  const client = {
    company_name: '範例建設',
    phone: '07-1234567',
    email: 'test@example.com',
    responsible_person_name: '王小明',
  }

  it('matches company name', () => {
    expect(matchesClientSearch(client, '範例')).toBe(true)
  })

  it('matches responsible person', () => {
    expect(matchesClientSearch(client, '王小明')).toBe(true)
  })

  it('returns true for empty query', () => {
    expect(matchesClientSearch(client, '')).toBe(true)
  })

  it('returns false when no field matches', () => {
    expect(matchesClientSearch(client, '不存在')).toBe(false)
  })
})

describe('clientGlobalFilterFn', () => {
  it('delegates to matchesClientSearch', () => {
    expect(clientGlobalFilterFn(
      { original: { company_name: '甲公司' } },
      'company_name',
      '甲',
    )).toBe(true)
  })
})
