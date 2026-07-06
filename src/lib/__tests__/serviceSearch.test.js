import { describe, expect, it } from 'vitest'
import { matchesServiceSearch, serviceGlobalFilterFn, stripHtml } from '../serviceSearch'

const sample = {
  id: '1',
  name: '建築執照申請',
  category: '申報作業',
  description: '<p>協助<strong>申請</strong>建築執照</p>',
}

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>協助<strong>申請</strong>建築執照</p>')).toBe('協助 申請 建築執照')
  })
})

describe('matchesServiceSearch', () => {
  it('matches empty query', () => {
    expect(matchesServiceSearch(sample, '')).toBe(true)
  })

  it('matches name, category, and plain description', () => {
    expect(matchesServiceSearch(sample, '建築執照')).toBe(true)
    expect(matchesServiceSearch(sample, '申報')).toBe(true)
    expect(matchesServiceSearch(sample, '申請')).toBe(true)
    expect(matchesServiceSearch(sample, '勘驗')).toBe(false)
  })
})

describe('serviceGlobalFilterFn', () => {
  it('delegates to matchesServiceSearch', () => {
    expect(serviceGlobalFilterFn({ original: sample }, 'id', '申請')).toBe(true)
    expect(serviceGlobalFilterFn({ original: sample }, 'id', '不存在')).toBe(false)
  })
})
