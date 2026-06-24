/** 有「已報價」且尚無「已確認」時，開工前需確認客戶是否已回傳。 */
export function needsStartWorkConfirmation(quotations = []) {
  const active = quotations.filter(q => q.status !== '已刪除')
  const hasQuoted = active.some(q => q.status === '已報價')
  const hasConfirmed = active.some(q => q.status === '已確認')
  return hasQuoted && !hasConfirmed
}

/** 客戶已回傳：已報價 → 已確認，案件 → 已開工 */
export async function applyStartProjectWork(supabase, projectId) {
  const { error: qErr } = await supabase
    .from('quotations')
    .update({ status: '已確認' })
    .eq('project_id', projectId)
    .eq('status', '已報價')

  if (qErr) throw qErr

  const { error: pErr } = await supabase
    .from('projects')
    .update({ status: '已開工' })
    .eq('id', projectId)

  if (pErr) throw pErr
}
