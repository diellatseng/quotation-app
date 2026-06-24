/** 已報價案件從 Dashboard／詳情頁直接開工前，需確認客戶是否已回傳報價。 */
export function needsStartWorkConfirmation(projectStatus) {
  return projectStatus === '已報價'
}

/** 客戶已回傳確認：報價 → 已確認，案件 → 進行中（略過已確認報價）。 */
export async function applyStartProjectWork(supabase, projectId) {
  const { error: qErr } = await supabase
    .from('quotations')
    .update({ status: '已確認' })
    .eq('project_id', projectId)
    .eq('status', '已報價')

  if (qErr) throw qErr

  const { error: pErr } = await supabase
    .from('projects')
    .update({ status: '進行中' })
    .eq('id', projectId)

  if (pErr) throw pErr
}
