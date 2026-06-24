import { describe, expect, it } from 'vitest'
import { companyProfileLabel, companyProfileToInfo, pickDefaultCompanyProfile } from '../companyProfile'

describe('companyProfileToInfo', () => {
  it('maps profile fields', () => {
    expect(companyProfileToInfo({
      name: '甲公司',
      address: '高雄市',
      phone: '07-111',
      fax: '07-222',
      email: 'a@test.com',
    })).toEqual({
      name: '甲公司',
      address: '高雄市',
      phone: '07-111',
      fax: '07-222',
      email: 'a@test.com',
    })
  })

  it('falls back to env defaults when profile missing', () => {
    expect(companyProfileToInfo(null).name).toBeTruthy()
  })
})

describe('pickDefaultCompanyProfile', () => {
  it('prefers is_default', () => {
    const picked = pickDefaultCompanyProfile([
      { id: '1', is_default: false, label: 'A' },
      { id: '2', is_default: true, label: 'B' },
    ])
    expect(picked.id).toBe('2')
  })
})

describe('companyProfileLabel', () => {
  it('uses label then name', () => {
    expect(companyProfileLabel({ label: '主公司', name: 'X' })).toBe('主公司')
    expect(companyProfileLabel({ name: 'X' })).toBe('X')
  })
})
