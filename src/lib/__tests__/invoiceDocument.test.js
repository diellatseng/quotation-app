import { describe, expect, it } from 'vitest'
import {
  buildInvoiceLineItems,
  formatInvoiceBuildingPermit,
  formatInvoiceDateShort,
  invoiceRecipientName,
  invoiceServiceFeeLabel,
  invoiceStageLabel,
  parseReturnedDocuments,
  suggestReturnedDocuments,
  sumInvoiceRequestedAmounts,
} from '../invoiceDocument'

describe('invoiceServiceFeeLabel', () => {
  it('uses full land section for now', () => {
    expect(invoiceServiceFeeLabel('高雄市大寮區翁公園段112-114號'))
      .toBe('高雄市大寮區翁公園段112-114號跑照服務費')
  })

  it('falls back when land section missing', () => {
    expect(invoiceServiceFeeLabel('')).toBe('跑照服務費')
  })
})

describe('invoiceStageLabel', () => {
  it('concatenates stage name and percentage', () => {
    expect(invoiceStageLabel({ stage_name: '開工完成', percentage: 50 })).toBe('開工完成50%')
  })
})

describe('buildInvoiceLineItems', () => {
  it('builds service, stage, and disbursement rows', () => {
    const rows = buildInvoiceLineItems({
      landSection: '大寮區翁公園段',
      contractTotal: 130000,
      stage: { stage_name: '開工完成', percentage: 50, amount: 65000 },
      disbursements: [{ id: '1', name: '空污費', amount: 1343 }],
    })

    expect(rows).toHaveLength(3)
    expect(rows[0].item).toBe('大寮區翁公園段跑照服務費')
    expect(rows[0].totalPrice).toBe(130000)
    expect(rows[0].requestedAmount).toBeNull()
    expect(rows[1].item).toBe('開工完成50%')
    expect(rows[1].requestedAmount).toBe(65000)
    expect(rows[2].item).toBe('空污費')
    expect(rows[2].requestedAmount).toBe(1343)
    expect(sumInvoiceRequestedAmounts(rows)).toBe(66343)
  })
})

describe('suggestReturnedDocuments', () => {
  it('maps disbursements to receipt lines', () => {
    expect(suggestReturnedDocuments([{ name: '空污費' }, { name: '印章-翁鴻榮' }]))
      .toEqual(['空污費收據*1', '印章-翁鴻榮收據*1'])
  })
})

describe('parseReturnedDocuments', () => {
  it('splits multiline text into items', () => {
    expect(parseReturnedDocuments('空污費收據*1\n印章估價單*1\n')).toEqual([
      '空污費收據*1',
      '印章估價單*1',
    ])
  })

  it('returns empty array for blank input', () => {
    expect(parseReturnedDocuments('')).toEqual([])
  })
})

describe('formatInvoiceBuildingPermit', () => {
  it('wraps permit with roc year from invoice date', () => {
    expect(formatInvoiceBuildingPermit('高市工建築字第00961', '2026-03-12'))
      .toBe('( 115 ) 高市工建築字第00961 號')
  })
})

describe('formatInvoiceDateShort', () => {
  it('formats as y/m/d without leading zeros', () => {
    expect(formatInvoiceDateShort('2026-03-12')).toBe('2026/3/12')
  })
})

describe('invoiceRecipientName', () => {
  it('prefers contact person and adds 先生', () => {
    expect(invoiceRecipientName({
      contactPerson: { name: '翁鴻榮' },
      projectOwner: '其他',
      clientName: '公司',
    })).toBe('翁鴻榮 先生')
  })
})
