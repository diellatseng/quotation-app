/** @deprecated 報價狀態改由 getQuotationSummary 計算，不再寫入 projects.status */
export function projectStatusFromQuotation() {
  return null
}

/** @deprecated 不再從報價同步案件工程狀態 */
export async function syncProjectStatusFromQuotation() {
  // no-op
}
