import { describe, expect, it } from 'vitest'
import { bankAccountLabel, formatBankAccountLines, pickDefaultBankAccount } from '../bankAccount'

describe('bankAccountLabel', () => {
  it('prefers label', () => {
    expect(bankAccountLabel({ label: '工程帳', bank_name: '元大', account_number: '123' }))
      .toBe('工程帳')
  })
})

describe('pickDefaultBankAccount', () => {
  it('prefers is_default', () => {
    const picked = pickDefaultBankAccount([
      { id: '1', is_default: false },
      { id: '2', is_default: true },
    ])
    expect(picked.id).toBe('2')
  })
})

describe('formatBankAccountLines', () => {
  it('formats bank lines', () => {
    expect(formatBankAccountLines({
      bank_name: '元大銀行',
      branch_name: '苓雅分行',
      account_name: '王小明',
      account_number: '1234567890',
      notes: '請註明案名',
    })).toEqual([
      '銀行：元大銀行（苓雅分行）',
      '戶名：王小明',
      '帳號：1234567890',
      '請註明案名',
    ])
  })
})
