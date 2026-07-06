import { describe, expect, it } from 'vitest'
import {
  buildClientImportPreview,
  clientRecordToPayload,
  normalizeCompanyName,
  validateClientRecord,
} from '../clientImport'

describe('normalizeCompanyName', () => {
  it('trims and lowercases for duplicate checks', () => {
    expect(normalizeCompanyName('  ABC公司 ')).toBe('abc公司')
  })
})

describe('validateClientRecord', () => {
  it('requires company name', () => {
    expect(validateClientRecord({ company_name: '' })).toEqual({ message: '公司名稱為必填' })
  })

  it('validates email when provided', () => {
    expect(validateClientRecord({ company_name: '甲公司', email: 'bad' })).toEqual({
      message: '電子郵件格式不正確',
    })
    expect(validateClientRecord({ company_name: '甲公司', email: 'a@b.com' })).toBeNull()
  })

  it('requires contact name when other contact fields are filled', () => {
    expect(validateClientRecord({
      company_name: '甲公司',
      contact_mobile: '0912',
    })).toEqual({ message: '已填寫聯絡人欄位時，聯絡人姓名為必填' })
  })

  it('validates contact email when provided', () => {
    expect(validateClientRecord({
      company_name: '甲公司',
      contact_name: '李小姐',
      contact_email: 'bad',
    })).toEqual({ message: '聯絡人電子郵件格式不正確' })
  })
})

describe('clientRecordToPayload', () => {
  it('maps client fields and nulls empty optional values', () => {
    expect(clientRecordToPayload({
      company_name: '甲公司',
      address: '',
      phone: '07-111',
      email: '',
    })).toEqual({
      client: {
        company_name: '甲公司',
        address: null,
        phone: '07-111',
        fax: null,
        email: null,
        responsible_person_name: null,
        responsible_person_mobile: null,
        responsible_person_title: null,
      },
      contact: null,
    })
  })

  it('includes primary contact when contact name is provided', () => {
    expect(clientRecordToPayload({
      company_name: '甲公司',
      contact_name: '李小姐',
      contact_mobile: '0912',
      contact_email: 'a@b.com',
    })).toEqual({
      client: expect.objectContaining({ company_name: '甲公司' }),
      contact: {
        name: '李小姐',
        mobile: '0912',
        office_phone: null,
        fax: null,
        email: 'a@b.com',
        is_primary: true,
      },
    })
  })
})

describe('buildClientImportPreview', () => {
  const existing = [{ company_name: '既有公司' }]

  it('marks ready rows for import', () => {
    const { rows, error } = buildClientImportPreview([
      { 公司名稱: '新公司', 電話: '07-123' },
    ], existing)
    expect(error).toBeNull()
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('ready')
    expect(rows[0].payload.client.company_name).toBe('新公司')
  })

  it('notes when a primary contact will be created', () => {
    const { rows } = buildClientImportPreview([
      { 公司名稱: '新公司', 聯絡人姓名: '李小姐' },
    ], [])
    expect(rows[0].message).toMatch(/主要聯絡人/)
    expect(rows[0].payload.contact.name).toBe('李小姐')
  })

  it('skips duplicates against existing clients', () => {
    const { rows } = buildClientImportPreview([
      { 公司名稱: '既有公司' },
    ], existing)
    expect(rows[0].status).toBe('duplicate')
  })

  it('rejects duplicate names within the same file', () => {
    const { rows } = buildClientImportPreview([
      { 公司名稱: '甲公司' },
      { 公司名稱: '甲公司' },
    ], [])
    expect(rows[0].status).toBe('ready')
    expect(rows[1].status).toBe('error')
    expect(rows[1].message).toMatch(/檔案內/)
  })

  it('ignores completely empty rows', () => {
    const { rows } = buildClientImportPreview([
      { 公司名稱: '' },
      { 公司名稱: '乙公司' },
    ], [])
    expect(rows).toHaveLength(1)
    expect(rows[0].company_name).toBe('乙公司')
  })
})
