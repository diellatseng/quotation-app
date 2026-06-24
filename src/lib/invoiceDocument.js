/** 請款單表格用數字格式（不含 NT$） */
export function formatInvoiceAmount(n) {
  if (n == null || n === '') return ''
  return Number(n).toLocaleString('zh-TW', { maximumFractionDigits: 0 })
}

/** 請款單總計列 */
export function formatInvoiceTotal(n) {
  return `NT$${Number(n || 0).toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`
}

/** 請款日期：2026/3/12 */
export function formatInvoiceDateShort(ceDateStr) {
  if (!ceDateStr) return ''
  const [y, m, d] = ceDateStr.split('-')
  return `${y}/${Number(m)}/${Number(d)}`
}

/**
 * 建照號碼列：( 114 ) 高市工建築字第00961 號
 * 若已含括號則原樣顯示。
 */
export function formatInvoiceBuildingPermit(buildingPermit, invoicedAt) {
  const raw = buildingPermit?.trim()
  if (!raw) return ''
  if (raw.startsWith('(')) return raw.endsWith('號') ? raw : `${raw} 號`

  let rocYear = ''
  if (invoicedAt) {
    const ceYear = Number(invoicedAt.split('-')[0])
    if (!Number.isNaN(ceYear)) rocYear = String(ceYear - 1911)
  }

  const body = rocYear ? `( ${rocYear} ) ${raw}` : raw
  return body.endsWith('號') ? body : `${body} 號`
}

/** 受款人稱謂：聯絡人 → 起造人 → 客戶名稱 */
export function invoiceRecipientName({ contactPerson, projectOwner, clientName }) {
  const name = contactPerson?.name?.trim()
    || projectOwner?.trim()
    || clientName?.trim()
    || ''
  if (!name) return '—'
  if (/先生|小姐|女士/.test(name)) return name
  return `${name} 先生`
}

/**
 * 第一列費用項目：目前直接使用完整地號。
 * 日後若拆分「地段」欄位，可改為 extractLandParcel(landSection)。
 */
export function invoiceServiceFeeLabel(landSection) {
  const land = landSection?.trim()
  if (!land) return '跑照服務費'
  return `${land}跑照服務費`
}

/** 第二列：階段名稱 + 百分比（例：開工完成50%） */
export function invoiceStageLabel(stage) {
  if (!stage?.stage_name) return '—'
  const pct = stage.percentage != null ? `${Number(stage.percentage)}%` : ''
  return `${stage.stage_name}${pct}`
}

/** 組裝請款單表格列 */
export function buildInvoiceLineItems({ landSection, contractTotal, stage, disbursements = [] }) {
  const rows = [
    {
      key: 'service',
      item: invoiceServiceFeeLabel(landSection),
      totalPrice: contractTotal != null && contractTotal !== '' ? Number(contractTotal) : null,
      unitPrice: null,
      quantity: null,
      requestedAmount: null,
    },
    {
      key: 'stage',
      item: invoiceStageLabel(stage),
      totalPrice: null,
      unitPrice: null,
      quantity: null,
      requestedAmount: Number(stage?.amount || 0),
    },
    ...disbursements.map(d => ({
      key: d.id,
      item: d.name,
      totalPrice: null,
      unitPrice: null,
      quantity: null,
      requestedAmount: Number(d.amount || 0),
    })),
  ]

  return rows
}

/** 請領金額合計（階段 + 代墊） */
export function sumInvoiceRequestedAmounts(rows) {
  return rows.reduce((sum, row) => sum + (row.requestedAmount || 0), 0)
}

/** 檢還文件：依代墊項目產生建議文案（例：空污費收據*1） */
export function suggestReturnedDocuments(disbursements = []) {
  return disbursements
    .filter(d => d.name?.trim())
    .map(d => `${d.name.trim()}收據*1`)
}

/** @deprecated 使用 suggestReturnedDocuments */
export const buildReturnedDocuments = suggestReturnedDocuments

/** 解析使用者編輯的檢還文件（每行一項） */
export function parseReturnedDocuments(text) {
  if (!text?.trim()) return []
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
}

/** 表格空白列，維持與紙本類似的版面 */
export function padInvoiceTableRows(rows, minRows = 10) {
  const padded = [...rows]
  while (padded.length < minRows) {
    padded.push({
      key: `empty-${padded.length}`,
      item: '',
      totalPrice: null,
      unitPrice: null,
      quantity: null,
      requestedAmount: null,
      empty: true,
    })
  }
  return padded
}
