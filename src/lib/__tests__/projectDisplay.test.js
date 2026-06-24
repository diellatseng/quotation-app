import { describe, expect, it } from 'vitest'
import {
  displayProjectName,
  isPlaceholderProjectName,
  projectPrimaryLabel,
  projectSecondaryLabel,
  resolveProjectName,
} from '../projectDisplay'

describe('resolveProjectName', () => {
  it('prefers engineering name when provided', () => {
    expect(resolveProjectName({
      project_name: '住宅新建工程',
      land_section: '鹽埕段一小段 123',
    })).toBe('住宅新建工程')
  })

  it('falls back to land section when name is empty', () => {
    expect(resolveProjectName({
      project_name: '',
      land_section: '鹽埕段一小段 123',
    })).toBe('鹽埕段一小段 123')
  })

  it('uses 未命名專案 when both are empty', () => {
    expect(resolveProjectName({ project_name: '', land_section: '' })).toBe('未命名專案')
  })
})

describe('placeholder project names', () => {
  it('detects legacy Project-timestamp names', () => {
    expect(isPlaceholderProjectName('Project-1780042484426')).toBe(true)
  })

  it('hides legacy names in display helpers', () => {
    const project = {
      name: 'Project-1780042484426',
      land_section: '鹽埕段一小段 123',
    }
    expect(projectPrimaryLabel(project)).toBe('鹽埕段一小段 123')
    expect(displayProjectName(project)).toBe('—')
    expect(projectSecondaryLabel(project)).toBeNull()
  })
})
