// src/lib/rocDate.js
// Republic of China (民國) calendar helpers
// ROC year = CE year - 1911

export const ceToRoc = (ceYear) => Number(ceYear) - 1911
export const rocToCe = (rocYear) => Number(rocYear) + 1911

// Format a CE date string (YYYY-MM-DD) to 民國 display: 民國XXX年MM月DD日
export const formatRocDate = (ceDateStr) => {
  if (!ceDateStr) return ''
  const [y, m, d] = ceDateStr.split('-')
  return `民國${ceToRoc(y)}年${m}月${d}日`
}

// Parse ROC date input "XXX-MM-DD" → CE "YYYY-MM-DD"
export const rocInputToCe = (rocStr) => {
  if (!rocStr) return ''
  const [y, m, d] = rocStr.split('-')
  return `${rocToCe(y)}-${m}-${d}`
}

// Convert CE "YYYY-MM-DD" → ROC input value "XXX-MM-DD"
export const ceToRocInput = (ceDateStr) => {
  if (!ceDateStr) return ''
  const [y, m, d] = ceDateStr.split('-')
  return `${ceToRoc(y)}-${m}-${d}`
}

export const todayCe = () => new Date().toISOString().split('T')[0]
export const todayRocInput = () => ceToRocInput(todayCe())
