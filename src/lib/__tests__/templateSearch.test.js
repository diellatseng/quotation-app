import { describe, expect, it } from 'vitest'
import { matchesTemplateSearch, templateGlobalFilterFn } from '../templateSearch'

const sample = {
  id: '1',
  name: '住宅大樓跑照',
  category: '住宅',
  description: '一般住宅專案範本',
  template_services: [{ service_id: 'a' }, { service_id: 'b' }],
}

describe('matchesTemplateSearch', () => {
  it('matches empty query', () => {
    expect(matchesTemplateSearch(sample, '')).toBe(true)
    expect(matchesTemplateSearch(sample, '   ')).toBe(true)
  })

  it('matches name, category, description', () => {
    expect(matchesTemplateSearch(sample, '住宅大樓')).toBe(true)
    expect(matchesTemplateSearch(sample, '住宅')).toBe(true)
    expect(matchesTemplateSearch(sample, '一般住宅')).toBe(true)
    expect(matchesTemplateSearch(sample, '商業')).toBe(false)
  })

  it('is case insensitive', () => {
    expect(matchesTemplateSearch(sample, '跑照')).toBe(true)
  })
})

describe('templateGlobalFilterFn', () => {
  it('delegates to matchesTemplateSearch', () => {
    expect(templateGlobalFilterFn({ original: sample }, 'id', '跑照')).toBe(true)
    expect(templateGlobalFilterFn({ original: sample }, 'id', '不存在')).toBe(false)
  })
})
