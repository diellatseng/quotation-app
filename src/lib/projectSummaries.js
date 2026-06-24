/** ② 案件報價摘要（由 quotations 計算，不存 DB） */
export function getQuotationSummary(quotations = []) {
  const active = quotations.filter(q => q.status !== '已刪除')
  if (!active.length) return '無報價'
  if (active.some(q => q.status === '已確認')) return '已確認'
  if (active.some(q => q.status === '已報價')) return '已報價'
  if (active.some(q => q.status === '草稿')) return '草稿'
  return '無報價'
}

/** ③ 案件請款摘要（由 payment_stages + invoices 計算，不存 DB） */
export function getBillingSummary(paymentStages = [], invoices = []) {
  const total = paymentStages.length
  if (total === 0) return '未設定'

  const byStage = new Map(invoices.map(inv => [inv.payment_stage_id, inv]))
  const hasAnyInvoice = paymentStages.some(stage => byStage.has(stage.id))
  if (!hasAnyInvoice) return '未請款'

  const receivedCount = paymentStages.filter(
    stage => byStage.get(stage.id)?.status === '已收款',
  ).length

  if (receivedCount === total) return '已結清'
  if (receivedCount > 0) return '部分收款'
  return '請款中'
}

export function groupQuotationsByProject(quotations = []) {
  const map = new Map()
  for (const q of quotations) {
    if (!q.project_id) continue
    const list = map.get(q.project_id) ?? []
    list.push(q)
    map.set(q.project_id, list)
  }
  return map
}

export function groupStagesByProject(stages = []) {
  const map = new Map()
  for (const stage of stages) {
    if (!stage.project_id) continue
    const list = map.get(stage.project_id) ?? []
    list.push(stage)
    map.set(stage.project_id, list)
  }
  return map
}

export function groupInvoicesByProject(invoices = []) {
  const map = new Map()
  for (const inv of invoices) {
    if (!inv.project_id) continue
    const list = map.get(inv.project_id) ?? []
    list.push(inv)
    map.set(inv.project_id, list)
  }
  return map
}

export function enrichProjectWithSummaries(project, quotations, paymentStages, invoices) {
  return {
    ...project,
    quotations,
    quotationSummary: getQuotationSummary(quotations),
    billingSummary: getBillingSummary(paymentStages, invoices),
  }
}
