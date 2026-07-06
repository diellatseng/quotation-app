import { describe, expect, it } from 'vitest'
import { filterProjectsByStatus, PROJECT_STATUS_FILTERS } from '../projectFilters'
import { matchesProjectSearch, projectGlobalFilterFn } from '../projectSearch'

const projects = [
  { id: '1', status: '未開工', land_section: '鹽埕段', marketing_name: 'A案', clients: { company_name: '甲公司' } },
  { id: '2', status: '完工', land_section: '鼓山段', marketing_name: 'B案', clients: { company_name: '乙公司' } },
  { id: '3', status: '已開工', land_section: '前金段', marketing_name: 'C案', clients: { company_name: '丙公司' } },
]

describe('filterProjectsByStatus', () => {
  it('exposes status filter options', () => {
    expect(PROJECT_STATUS_FILTERS).toContain('全部')
    expect(PROJECT_STATUS_FILTERS).toContain('完工')
  })

  it('hides completed projects unless showCompleted', () => {
    expect(filterProjectsByStatus(projects, { statusFilter: '全部', showCompleted: false })).toHaveLength(2)
    expect(filterProjectsByStatus(projects, { statusFilter: '全部', showCompleted: true })).toHaveLength(3)
  })

  it('filters by specific status', () => {
    expect(filterProjectsByStatus(projects, { statusFilter: '已開工', showCompleted: false })).toEqual([projects[2]])
  })
})

describe('matchesProjectSearch', () => {
  it('matches land section, marketing name, and client', () => {
    expect(matchesProjectSearch(projects[0], '鹽埕')).toBe(true)
    expect(matchesProjectSearch(projects[0], 'A案')).toBe(true)
    expect(matchesProjectSearch(projects[0], '甲公司')).toBe(true)
    expect(matchesProjectSearch(projects[0], '不存在')).toBe(false)
  })
})

describe('projectGlobalFilterFn', () => {
  it('delegates to matchesProjectSearch', () => {
    expect(projectGlobalFilterFn({ original: projects[0] }, 'id', '甲公司')).toBe(true)
  })
})
