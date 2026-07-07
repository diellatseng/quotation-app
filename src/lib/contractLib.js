// src/lib/contractLib.js
// Utility functions for contract generation

// ─── Chinese Financial Numerals ──────────────────────────────────────────────

const FINANCE_DIGITS = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖']
const UNITS_4 = ['', '拾', '佰', '仟']

/** Convert a 4-digit number segment (1–9999) to financial Chinese. */
function convertSegment4(n) {
  if (n === 0) return ''
  const d = [
    Math.floor(n / 1000),
    Math.floor((n % 1000) / 100),
    Math.floor((n % 100) / 10),
    n % 10,
  ]
  let result = ''
  let hadNonZero = false
  let hasZeroGap = false
  for (let i = 0; i < 4; i++) {
    if (d[i] === 0) {
      if (hadNonZero) hasZeroGap = true
    } else {
      if (hasZeroGap) result += '零'
      result += FINANCE_DIGITS[d[i]] + UNITS_4[3 - i]
      hadNonZero = true
      hasZeroGap = false
    }
  }
  return result
}

/**
 * Convert a number to traditional Chinese financial uppercase.
 * E.g. 330000 → "參拾參萬元整"
 *      315000 → "參拾壹萬伍仟元整"
 */
export function amountToChineseLarge(amount) {
  const n = Math.round(Math.abs(Number(amount) || 0))
  if (n === 0) return '零元整'

  const yi = Math.floor(n / 100_000_000)
  const wan = Math.floor((n % 100_000_000) / 10_000)
  const ones = n % 10_000

  let result = ''

  if (yi > 0) {
    result += convertSegment4(yi) + '億'
  }

  if (wan > 0) {
    // Leading 零 when 億 is present and 萬 < 1000
    if (yi > 0 && wan < 1000) result += '零'
    result += convertSegment4(wan) + '萬'
  } else if (yi > 0 && ones > 0) {
    result += '零'
  }

  if (ones > 0) {
    // Leading 零 when upper units exist and ones < 1000
    if ((yi > 0 || wan > 0) && ones < 1000) result += '零'
    result += convertSegment4(ones)
  }

  return result + '元整'
}

// ─── ROC Date → Chinese Character Footer ─────────────────────────────────────

// Digit-by-digit characters (○ for 0, 一~九 for 1-9)
const CHAR_DIGITS = ['○', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/** Convert a month/day number to positional Chinese (e.g. 11 → "十一", 20 → "二十"). */
function numToPositional(n) {
  const num = Number(n)
  if (num <= 0) return ''
  if (num < 10) return CHAR_DIGITS[num]
  if (num === 10) return '十'
  const tens = Math.floor(num / 10)
  const ones = num % 10
  return (tens === 1 ? '' : CHAR_DIGITS[tens]) + '十' + (ones > 0 ? CHAR_DIGITS[ones] : '')
}

/**
 * Convert a CE date string "YYYY-MM-DD" to a Chinese footer string.
 * E.g. "2025-11-03" (ROC 114) → "中　華　民　國　一一四　年　十一　月　三　日"
 * Returns empty string when input is falsy.
 */
export function rocDateToChineseFull(ceDateStr) {
  if (!ceDateStr) return ''
  const parts = ceDateStr.split('-')
  if (parts.length < 3) return ''
  const [y, m, d] = parts
  const rocYear = Number(y) - 1911
  const yearChars = String(rocYear)
    .split('')
    .map((c) => CHAR_DIGITS[Number(c)])
    .join('　')

  const monthCh = numToPositional(Number(m))
  const dayCh = numToPositional(Number(d))

  return `中　華　民　國　${yearChars}　年　${monthCh}　月　${dayCh}　日`
}

// ─── Contract Number ──────────────────────────────────────────────────────────

/**
 * Generate a default contract number from the quotation number.
 * E.g. "QT-2025-001" → "CT-114-001"
 */
export function generateContractNumber(quoteNumber) {
  const rocYear = new Date().getFullYear() - 1911
  const seq = (quoteNumber || '').replace(/[^0-9]/g, '').slice(-3).padStart(3, '0') || '001'
  return `CT-${rocYear}-${seq}`
}

/** Default project item text */
export const DEFAULT_PROJECT_ITEM = '建管程序業務及使用執照代辦'

/** Default site name from land section */
export function defaultSiteName(landSection) {
  return landSection ? `${landSection}新建工程` : ''
}
