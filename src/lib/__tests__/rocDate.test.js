// src/lib/__tests__/rocDate.test.js
import {
  ceToRoc,
  rocToCe,
  formatRocDate,
  rocInputToCe,
  ceToRocInput,
  todayCe,
  todayRocInput
} from '../rocDate'

describe('rocDate utilities', () => {
  describe('ceToRoc', () => {
    it('converts CE year to ROC year correctly', () => {
      expect(ceToRoc(2025)).toBe(114)
      expect(ceToRoc(2024)).toBe(113)
      expect(ceToRoc(1912)).toBe(1)
    })

    it('handles string input', () => {
      expect(ceToRoc('2025')).toBe(114)
    })
  })

  describe('rocToCe', () => {
    it('converts ROC year to CE year correctly', () => {
      expect(rocToCe(114)).toBe(2025)
      expect(rocToCe(113)).toBe(2024)
    })
  })

  describe('formatRocDate', () => {
    it('formats CE date string to ROC display format', () => {
      expect(formatRocDate('2025-08-18')).toBe('民國114年08月18日')
    })

    it('returns empty string for empty input', () => {
      expect(formatRocDate('')).toBe('')
    })
  })

  describe('round-trip conversion', () => {
    it('maintains data integrity', () => {
      const ceDateStr = '2025-08-18'
      const rocInput = ceToRocInput(ceDateStr)
      const backToCe = rocInputToCe(rocInput)
      expect(backToCe).toBe(ceDateStr)
    })
  })
})
