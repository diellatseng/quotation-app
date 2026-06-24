import { grandTotalFromFee, stageAmountFromPercentage } from './paymentStagePresets'

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
    })
    .eq('id', projectId)

  if (projErr) throw projErr
}

export function validateManualPaymentStages(stages, contractTotal) {
  if (!stages?.length) return '請至少新增一個付款階段'

  for (const [i, stage] of stages.entries()) {
    if (!stage.stage_name?.trim()) return `第 ${i + 1} 階段請填寫名稱`
    if (!(Number(stage.amount) > 0)) return `第 ${i + 1} 階段請填寫金額`
  }

  if (!(Number(contractTotal) > 0)) return '請填寫合約總金額'

  return null
}

export async function saveManualPaymentStages(supabase, projectId, stages, { contractTotal, taxIncluded }) {
  const errMsg = validateManualPaymentStages(stages, contractTotal)
  if (errMsg) throw new Error(errMsg)

  const grand = Number(contractTotal)
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
    })
    .eq('id', projectId)

  if (projErr) throw projErr
}
