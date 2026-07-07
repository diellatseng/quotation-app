import { describe, expect, it } from 'vitest'
import {
  buildIssuerProfilePayload,
  companyProfileLabel,
  companyProfileToInfo,
  individualDisplayName,
  isValidNationalId,
  pickDefaultCompanyProfile,
  PROFILE_TYPE_INDIVIDUAL,
  validateIssuerProfileForm,
} from '../companyProfile'

describe('companyProfileToInfo', () => {
  it('maps company profile fields', () => {
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

  it('maps individual profile with honorific and contact fields', () => {
    expect(companyProfileToInfo({
      profile_type: PROFILE_TYPE_INDIVIDUAL,
      name: '王小明',
      honorific: '先生',
      address: '高雄市前金區',
      phone: '0912-345-678',
      fax: '',
      email: 'ming@example.com',
    })).toEqual({
      name: '王小明 先生',
      address: '高雄市前金區',
      phone: '0912-345-678',
      fax: '',
      email: 'ming@example.com',
    })
  })

  it('falls back to env defaults when profile missing', () => {
    expect(companyProfileToInfo(null).name).toBeTruthy()
  })
})

describe('pickDefaultCompanyProfile', () => {
  it('prefers is_default', () => {
    const picked = pickDefaultCompanyProfile([
      { id: '1', is_default: false, label: 'A', profile_type: 'company' },
      { id: '2', is_default: true, label: 'B', profile_type: 'company' },
    ])
    expect(picked.id).toBe('2')
  })

  it('prefers default within preferred type', () => {
    const picked = pickDefaultCompanyProfile([
      { id: '1', is_default: true, label: 'Co', profile_type: 'company' },
      { id: '2', is_default: true, label: 'Person', profile_type: 'individual', name: '王', honorific: '先生' },
    ], PROFILE_TYPE_INDIVIDUAL)
    expect(picked.id).toBe('2')
  })
})

describe('companyProfileLabel', () => {
  it('uses company name', () => {
    expect(companyProfileLabel({ label: '主公司', name: '甲營造股份有限公司' })).toBe('甲營造股份有限公司')
    expect(companyProfileLabel({ name: '乙工程行' })).toBe('乙工程行')
  })

  it('formats individual profile', () => {
    expect(companyProfileLabel({
      profile_type: PROFILE_TYPE_INDIVIDUAL,
      name: '王小明',
      honorific: '小姐',
    })).toBe('王小明 小姐')
  })
})

describe('individualDisplayName', () => {
  it('joins name and honorific', () => {
    expect(individualDisplayName({ name: '王小明', honorific: '先生' })).toBe('王小明 先生')
  })
})

describe('validateIssuerProfileForm', () => {
  it('requires individual fields', () => {
    expect(validateIssuerProfileForm({
      name: '王小明',
      honorific: '先生',
      address: '高雄市',
      national_id: 'A123456789',
    }, PROFILE_TYPE_INDIVIDUAL)).toBeNull()

    expect(validateIssuerProfileForm({
      name: '王小明',
      honorific: '先生',
      address: '',
      national_id: 'A123456789',
    }, PROFILE_TYPE_INDIVIDUAL)).toBe('請填寫地址')
  })
})

describe('buildIssuerProfilePayload', () => {
  it('builds individual payload with label', () => {
    expect(buildIssuerProfilePayload({
      name: '王小明',
      honorific: '先生',
      national_id: 'a123456789',
      address: '高雄市',
      phone: '07-111',
      fax: '',
      email: '',
      is_default: true,
    }, PROFILE_TYPE_INDIVIDUAL)).toMatchObject({
      profile_type: PROFILE_TYPE_INDIVIDUAL,
      label: '王小明 先生',
      national_id: 'A123456789',
      phone: '07-111',
    })
  })
})

describe('isValidNationalId', () => {
  it('accepts taiwan id format', () => {
    expect(isValidNationalId('A123456789')).toBe(true)
    expect(isValidNationalId('bad')).toBe(false)
  })
})
