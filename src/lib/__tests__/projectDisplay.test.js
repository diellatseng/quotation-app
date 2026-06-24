import { describe, expect, it } from 'vitest'
import {
  displayProjectName,
  isPlaceholderProjectName,
  marketingNameForEdit,
  projectPrimaryLabel,
  projectSecondaryLabel,
} from '../projectDisplay'

describe('projectPrimaryLabel', () => {
  it('prefers land section as primary label', () => {
    expect(projectPrimaryLabel({
      marketing_name: '住宅新建工程',
      land_section: '鹽埕段一小段 123',
    })).toBe('鹽埕段一小段 123')
  })

  it('falls back to marketing name when land section is missing', () => {
    expect(projectPrimaryLabel({
      marketing_name: '住宅新建工程',
      land_section: '',
    })).toBe('住宅新建工程')
  })

  it('uses 未命名案件 when both are empty', () => {
    expect(projectPrimaryLabel({ marketing_name: '', land_section: '' })).toBe('未命名案件')
  })
})

describe('marketingNameForEdit', () => {
  it('returns marketing name when set', () => {
    expect(marketingNameForEdit({
      marketing_name: '住宅新建工程',
      land_section: '鹽埕段一小段 123',
    })).toBe('住宅新建工程')
  })

  it('returns empty when marketing name is absent', () => {
    expect(marketingNameForEdit({
      marketing_name: null,
      land_section: '鹽埕段一小段 123',
    })).toBe('')
  })
})

describe('placeholder project names', () => {
  it('detects legacy Project-timestamp names', () => {
    expect(isPlaceholderProjectName('Project-1780042484426')).toBe(true)
  })

  it('hides legacy names in display helpers', () => {
    const project = {
      marketing_name: 'Project-1780042484426',
      land_section: '鹽埕段一小段 123',
    }
    expect(projectPrimaryLabel(project)).toBe('鹽埕段一小段 123')
    expect(displayProjectName(project)).toBe('—')
    expect(projectSecondaryLabel(project)).toBeNull()
  })
})
