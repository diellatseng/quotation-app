/** Map quotation workflow status → project status (when project should follow). */
export function projectStatusFromQuotation(quotationStatus) {
  if (quotationStatus === '草稿') return null
  if (quotationStatus === '已報價') return '已報價'
  if (quotationStatus === '已確認') return '已確認報價'
  return null
}

const ADVANCED_PROJECT_STATUSES = ['進行中', '完工', '暫停']

/**
 * Sync linked project status from a quotation status change.
 * Does not downgrade projects already in 進行中 / 完工 / 暫停.
 */
export async function syncProjectStatusFromQuotation(supabase, projectId, quotationStatus) {
  const nextStatus = projectStatusFromQuotation(quotationStatus)
  if (!projectId || !nextStatus) return

  const { data: project } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single()

  if (project && ADVANCED_PROJECT_STATUSES.includes(project.status)) return

  await supabase.from('projects').update({ status: nextStatus }).eq('id', projectId)
}
