export function sumDisbursements(items = []) {
  return items.reduce((total, item) => total + Number(item.amount || 0), 0)
}

export function groupDisbursementsByStage(disbursements = []) {
  const map = new Map()
  for (const item of disbursements) {
    const list = map.get(item.payment_stage_id) || []
    list.push(item)
    map.set(item.payment_stage_id, list)
  }
  return map
}

/** Replace all disbursements for a payment stage. */
export async function saveDisbursementsForStage(supabase, stageId, items) {
  const { error: deleteErr } = await supabase
    .from('disbursements')
    .delete()
    .eq('payment_stage_id', stageId)

  if (deleteErr) throw deleteErr

  const rows = items
    .filter(item => item.name?.trim())
    .map(item => ({
      payment_stage_id: stageId,
      name: item.name.trim(),
      amount: Number(item.amount) || 0,
      is_preset: Boolean(item.is_preset),
    }))

  if (rows.length === 0) return

  const { error: insertErr } = await supabase.from('disbursements').insert(rows)
  if (insertErr) throw insertErr
}
