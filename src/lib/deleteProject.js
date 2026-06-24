/**
 * Soft-delete a project and its linked quotations (same pattern as quotation delete).
 */
export async function deleteProjectById(supabase, projectId) {
  const { error: qErr } = await supabase
    .from('quotations')
    .update({ status: '已刪除' })
    .eq('project_id', projectId)
    .neq('status', '已刪除')

  if (qErr) throw qErr

  const { error: pErr } = await supabase
    .from('projects')
    .update({ status: '已刪除' })
    .eq('id', projectId)

  if (pErr) throw pErr
}
