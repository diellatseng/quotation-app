import { grandTotalFromFee, stageAmountFromPercentage } from './paymentStagePresets'
import { collectPaymentStageMissing } from './validateQuotation'

function isBlank(value) {
  return value == null || String(value).trim() === ''
}

/** Align manual invoice setup validation with quotation Step 4 rules. */
export function validateManualPaymentSetup({ contractTotal, taxIncluded, stages = [] }) {
  const missing = []

  if (isBlank(contractTotal) || Number(contractTotal) <= 0) {
    missing.push('合約金額 (未稅)')
  }

  missing.push(...collectPaymentStageMissing(stages))

  if (Number(contractTotal) > 0) {
    stages.forEach((stage, idx) => {
      if (!(Number(stage.amount) > 0)) {
        missing.push(`付款階段 ${idx + 1} 金額`)
      }
    })
  }

  return { valid: missing.length === 0, missing }
}

export function formatManualPaymentValidationMessage(missing) {
  return `請補齊：${missing.join('、')}`
}

/** @deprecated Use validateManualPaymentSetup */
export function validateManualPaymentStages(stages, contractTotal) {
  const { valid, missing } = validateManualPaymentSetup({
    contractTotal,
    taxIncluded: false,
    stages,
  })
  return valid ? null : missing[0]
}

export async function assertCanReplacePaymentStages(supabase, projectId) {
  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if (error) throw error
  if (count > 0) {
    throw new Error('已有請款紀錄，無法變更付款階段')
  }
}

export async function replaceProjectPaymentStages(supabase, projectId, rows) {
  await assertCanReplacePaymentStages(supabase, projectId)

  const { error: delErr } = await supabase
    .from('payment_stages')
    .delete()
    .eq('project_id', projectId)

  if (delErr) throw delErr
  if (!rows.length) return

  const { error: insErr } = await supabase.from('payment_stages').insert(rows)
  if (insErr) throw insErr
}

export async function importPaymentStagesFromQuotation(supabase, projectId, quotationId) {
  const { data: quotation, error: qErr } = await supabase
    .from('quotations')
    .select('id, fee_amount, tax_included')
    .eq('id', quotationId)
    .eq('project_id', projectId)
    .single()

  if (qErr) throw qErr

  const { data: srcStages, error: stErr } = await supabase
    .from('payment_stages')
    .select('stage_name, percentage, amount, sort_order')
    .eq('quotation_id', quotationId)
    .order('sort_order', { ascending: true })

  if (stErr) throw stErr
  if (!srcStages?.length) {
    throw new Error('此報價單尚無付款階段，請先完成報價設定')
  }

  const grand = grandTotalFromFee(quotation.fee_amount, quotation.tax_included)
  const rows = srcStages.map((st, i) => ({
    project_id: projectId,
    quotation_id: null,
    stage_name: st.stage_name,
    percentage: Number(st.percentage) || 0,
    amount: st.amount != null
      ? Number(st.amount)
      : stageAmountFromPercentage(grand, st.percentage),
    sort_order: i,
  }))

  await replaceProjectPaymentStages(supabase, projectId, rows)

  const { error: projErr } = await supabase
    .from('projects')
    .update({
      total_amount: grand,
      tax_included: !!quotation.tax_included,
      source_quotation_id: quotationId,
    })
    .eq('id', projectId)

  if (projErr) throw projErr
}

export async function saveManualPaymentStages(supabase, projectId, stages, { contractTotal, taxIncluded }) {
  const { valid, missing } = validateManualPaymentSetup({ contractTotal, taxIncluded, stages })
  if (!valid) throw new Error(formatManualPaymentValidationMessage(missing))

  const grand = grandTotalFromFee(contractTotal, taxIncluded)
  const rows = stages.map((st, i) => ({
    project_id: projectId,
    quotation_id: null,
    stage_name: st.stage_name.trim(),
    percentage: grand > 0
      ? Math.round((Number(st.amount) / grand) * 10000) / 100
      : Number(st.percentage) || 0,
    amount: Number(st.amount),
    sort_order: i,
  }))

  await replaceProjectPaymentStages(supabase, projectId, rows)

  const { error: projErr } = await supabase
    .from('projects')
    .update({
      total_amount: grand,
      tax_included: !!taxIncluded,
      source_quotation_id: null,
    })
    .eq('id', projectId)

  if (projErr) throw projErr
}

export function paymentSetupSourceLabel(project, quotations = []) {
  const quotationId = project?.source_quotation_id
  if (!quotationId) {
    return { mode: 'manual', text: '手動建立' }
  }

  const quotation = quotations.find(q => q.id === quotationId)
  const versionSuffix = quotation?.version > 1 ? ` v${quotation.version}` : ''
  const quoteNumber = quotation?.quote_number
    ? `${quotation.quote_number}${versionSuffix}`
    : '—'

  return { mode: 'quotation', text: '報價單', quoteNumber }
}
