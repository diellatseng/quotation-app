// src/lib/rocDate.js
// Republic of China (民國) calendar helpers
// ROC year = CE year - 1911

export const ceToRoc = (ceYear) => Number(ceYear) - 1911
export const rocToCe = (rocYear) => Number(rocYear) + 1911

// Validate if a date is valid (handles Feb 29, month ranges, etc)
export const isValidDate = (year, month, day) => {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  
  if (m < 1 || m > 12) return false
  if (d < 1 || d > 31) return false
  
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

// Format a CE date string (YYYY-MM-DD) to display format
export const formatCeDisplay = (ceDateStr) => {
  if (!ceDateStr) return ''
  const [y, m, d] = ceDateStr.split('-')
  return `${y}年${m}月${d}日`
}

// Format a CE date string (YYYY-MM-DD) to 民國 display
export const formatRocDate = (ceDateStr) => {
  if (!ceDateStr) return ''
  const [y, m, d] = ceDateStr.split('-')
  return `${ceToRoc(y)}年${m}月${d}日`
}

// Parse ROC date input "XXX年MM月DD日" → CE "YYYY-MM-DD", or raw "XXXMMDD"
export const rocInputToCe = (rocStr) => {
  if (!rocStr) return ''
  
  // Handle formatted input: "114年12月31日"
  if (rocStr.includes('年')) {
    const match = rocStr.match(/(\d+)年(\d+)月(\d+)日/)
    if (match) {
      const [, y, m, d] = match
      if (isValidDate(rocToCe(y), m, d)) {
        return `${rocToCe(y)}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      }
      return '' // Invalid date
    }
  }
  
  // Handle raw numeric input: "1141231" → parse as ROCMMDD
  if (/^\d+$/.test(rocStr)) {
    if (rocStr.length === 7) {
      const y = rocStr.slice(0, 3)
      const m = rocStr.slice(3, 5)
      const d = rocStr.slice(5, 7)
      if (isValidDate(rocToCe(y), m, d)) {
        return `${rocToCe(y)}-${m}-${d}`
      }
    }
    return ''
  }
  
  return ''
}

// Convert CE "YYYY-MM-DD" → ROC display "XXX年MM月DD日"
export const ceToRocInput = (ceDateStr) => {
  if (!ceDateStr) return ''
  const [y, m, d] = ceDateStr.split('-')
  return `${ceToRoc(y)}年${m}月${d}日`
}

// Parse CE date input "YYYY年MM月DD日" or raw "YYYYMMDD"
export const ceInputToCe = (ceStr) => {
  if (!ceStr) return ''
  
  // Handle formatted input: "2026年12月31日"
  if (ceStr.includes('年')) {
    const match = ceStr.match(/(\d+)年(\d+)月(\d+)日/)
    if (match) {
      const [, y, m, d] = match
      if (isValidDate(y, m, d)) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      }
      return '' // Invalid date
    }
  }
  
  // Handle raw numeric input: "20261231" → parse as YYYYMMDD
  if (/^\d+$/.test(ceStr)) {
    if (ceStr.length === 8) {
      const y = ceStr.slice(0, 4)
      const m = ceStr.slice(4, 6)
      const d = ceStr.slice(6, 8)
      if (isValidDate(y, m, d)) {
        return `${y}-${m}-${d}`
      }
    }
    return ''
  }
  
  return ''
}

// Format raw CE display: "2026年12月31日"
export const formatCeInputDisplay = (ceStr) => {
  if (!ceStr) return ''
  
  // Already formatted
  if (ceStr.includes('年')) return ceStr
  
  // Raw numeric: "20261231" → "2026年12月31日"
  if (/^\d+$/.test(ceStr) && ceStr.length === 8) {
    const y = ceStr.slice(0, 4)
    const m = ceStr.slice(4, 6)
    const d = ceStr.slice(6, 8)
    return `${y}年${m}月${d}日`
  }
  
  return ceStr
}

// Format raw ROC display: "114年12月31日"
export const formatRocInputDisplay = (rocStr) => {
  if (!rocStr) return ''
  
  // Already formatted
  if (rocStr.includes('年')) return rocStr
  
  // Raw numeric: "1141231" → "114年12月31日"
  if (/^\d+$/.test(rocStr) && rocStr.length === 7) {
    const y = rocStr.slice(0, 3)
    const m = rocStr.slice(3, 5)
    const d = rocStr.slice(5, 7)
    return `${y}年${m}月${d}日`
  }
  
  return rocStr
}

export const todayCe = () => new Date().toISOString().split('T')[0]
export const todayRocInput = () => ceToRocInput(todayCe())
