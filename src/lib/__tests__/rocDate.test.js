// src/lib/__tests__/rocDate.test.js
//
// Tests for the ROC (Republic of China / 民國) calendar utility functions.
// ROC year = CE (Common Era / 西元) year - 1911
// e.g. 2025 CE = 民國 114 年
//
// Functions under test:
//   ceToRoc        – CE year number  → ROC year number
//   rocToCe        – ROC year number → CE year number
//   formatRocDate  – CE date string  → Chinese display string  (e.g. "民國114年08月18日")
//   rocInputToCe   – ROC input string "XXX-MM-DD" → CE string "YYYY-MM-DD"
//   ceToRocInput   – CE string "YYYY-MM-DD" → ROC input string "XXX-MM-DD"
//   todayCe        – returns today as "YYYY-MM-DD"
//   todayRocInput  – returns today as ROC input "XXX-MM-DD"

import {
  ceToRoc,
  rocToCe,
  formatRocDate,
  rocInputToCe,
  ceToRocInput,
  todayCe,
  todayRocInput
} from '../rocDate'

// ─────────────────────────────────────────────────────────────────
// ceToRoc
// Converts a CE year to a ROC year by subtracting 1911.
// ─────────────────────────────────────────────────────────────────
describe('ceToRoc', () => {
  it('converts a recent CE year: 2025 → 114', () => {
    expect(ceToRoc(2025)).toBe(114)
  })

  it('converts another CE year: 2024 → 113', () => {
    expect(ceToRoc(2024)).toBe(113)
  })

  it('converts the founding year of the ROC: 1912 → 1', () => {
    // 1912 is the first full year of the Republic; expected result is 民國 1 年
    expect(ceToRoc(1912)).toBe(1)
  })

  it('accepts a string year and still returns a number: "2025" → 114', () => {
    // Input fields typically return strings; the function should coerce them
    expect(ceToRoc('2025')).toBe(114)
  })

  it('converts a 3-digit ROC-era CE year: 2000 → 89', () => {
    expect(ceToRoc(2000)).toBe(89)
  })
})

// ─────────────────────────────────────────────────────────────────
// rocToCe
// Converts a ROC year back to CE year by adding 1911.
// ─────────────────────────────────────────────────────────────────
describe('rocToCe', () => {
  it('converts ROC 114 → CE 2025', () => {
    expect(rocToCe(114)).toBe(2025)
  })

  it('converts ROC 113 → CE 2024', () => {
    expect(rocToCe(113)).toBe(2024)
  })

  it('converts ROC 1 (founding year) → CE 1912', () => {
    expect(rocToCe(1)).toBe(1912)
  })

  it('accepts a string ROC year: "114" → 2025', () => {
    expect(rocToCe('114')).toBe(2025)
  })
})

// ─────────────────────────────────────────────────────────────────
// formatRocDate
// Formats a CE date string "YYYY-MM-DD" into the full Chinese
// display format "民國XXX年MM月DD日".
// ─────────────────────────────────────────────────────────────────
describe('formatRocDate', () => {
  it('formats a standard date: "2025-08-18" → "民國114年08月18日"', () => {
    expect(formatRocDate('2025-08-18')).toBe('民國114年08月18日')
  })

  it('preserves leading zeros in month and day: "2025-01-05" → "民國114年01月05日"', () => {
    // Month "01" and day "05" must stay zero-padded as stored in the CE string
    expect(formatRocDate('2025-01-05')).toBe('民國114年01月05日')
  })

  it('returns an empty string for an empty input (no date selected yet)', () => {
    expect(formatRocDate('')).toBe('')
  })

  it('returns an empty string for null/undefined input', () => {
    // Guards against accidental null values from DB or uninitialized state
    expect(formatRocDate(null)).toBe('')
    expect(formatRocDate(undefined)).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────
// ceToRocInput
// Converts a CE date string "YYYY-MM-DD" to the ROC input format
// "XXX-MM-DD" used in <ROCDateInput> fields.
// ─────────────────────────────────────────────────────────────────
describe('ceToRocInput', () => {
  it('converts "2025-08-18" → "114-08-18"', () => {
    expect(ceToRocInput('2025-08-18')).toBe('114-08-18')
  })

  it('converts "2024-01-01" → "113-01-01"', () => {
    expect(ceToRocInput('2024-01-01')).toBe('113-01-01')
  })

  it('returns an empty string for empty input', () => {
    expect(ceToRocInput('')).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────
// rocInputToCe
// Parses the ROC input format "XXX-MM-DD" back into a CE date
// string "YYYY-MM-DD" suitable for storing in the database.
// ─────────────────────────────────────────────────────────────────
describe('rocInputToCe', () => {
  it('converts "114-08-18" → "2025-08-18"', () => {
    expect(rocInputToCe('114-08-18')).toBe('2025-08-18')
  })

  it('converts "113-01-01" → "2024-01-01"', () => {
    expect(rocInputToCe('113-01-01')).toBe('2024-01-01')
  })

  it('returns an empty string for empty input', () => {
    expect(rocInputToCe('')).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────
// Round-trip conversion
// Verifies that converting CE → ROC input → CE produces the
// original value with no data loss or mutation.
// ─────────────────────────────────────────────────────────────────
describe('round-trip: ceToRocInput → rocInputToCe', () => {
  it('restores the original CE date string exactly', () => {
    const original  = '2025-08-18'
    const rocInput  = ceToRocInput(original)  // "114-08-18"
    const restored  = rocInputToCe(rocInput)  // back to "2025-08-18"
    expect(restored).toBe(original)
  })

  it('round-trips correctly for an early-year date (month and day with leading zeros)', () => {
    const original  = '2024-01-05'
    const rocInput  = ceToRocInput(original)  // "113-01-05"
    const restored  = rocInputToCe(rocInput)
    expect(restored).toBe(original)
  })
})

// ─────────────────────────────────────────────────────────────────
// todayCe
// Returns today's date as a CE string "YYYY-MM-DD".
// We can't know the exact value, so we just validate the format.
// ─────────────────────────────────────────────────────────────────
describe('todayCe', () => {
  it('returns a string matching the CE date format YYYY-MM-DD', () => {
    expect(todayCe()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a date consistent with the current year', () => {
    const year = parseInt(todayCe().split('-')[0], 10)
    expect(year).toBe(new Date().getFullYear())
  })
})

// ─────────────────────────────────────────────────────────────────
// todayRocInput
// Returns today's date in ROC input format "XXX-MM-DD".
// The ROC year should equal the CE year minus 1911.
// ─────────────────────────────────────────────────────────────────
describe('todayRocInput', () => {
  it('returns a string matching the ROC input format XXX-MM-DD', () => {
    // ROC year is 2-3 digits; month and day are always 2 digits
    expect(todayRocInput()).toMatch(/^\d{2,3}-\d{2}-\d{2}$/)
  })

  it('ROC year in output equals CE year minus 1911', () => {
    const rocYear = parseInt(todayRocInput().split('-')[0], 10)
    const ceYear  = new Date().getFullYear()
    expect(rocYear).toBe(ceYear - 1911)
  })
})
