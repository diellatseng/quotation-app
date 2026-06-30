import { describe, it, expect } from 'vitest'
import {
  parseLandSection,
  formatLandSection,
  isLandPartsComplete,
  isValidParcel,
  landSectionFieldsFromParts,
  getLandSectionFormDefaults,
  formatSectionName,
  formatDistrictName,
  parseSectionNameForForm,
  parseDistrictNameForForm,
  buildingPermitPrefixFromLand,
  parseBuildingPermit,
  formatBuildingPermit,
  getBuildingPermitFormDefaults,
  parseProjectScale,
  formatProjectScale,
  projectScaleFieldsFromParts,
  scalePartsFromData,
  currentRocYear,
  DEFAULT_LAND_CITY_NAME,
} from '../projectFields'

describe('land section', () => {
  it('formats as XX市XX區XX段XXX號', () => {
    expect(formatLandSection({
      cityName: '高雄',
      cityType: '市',
      district: '鹽埕',
      section: '一小',
      parcel: '123',
    })).toBe('高雄市鹽埕區一小段123號')
  })

  it('appends 區 and 段 to names in composed result', () => {
    expect(formatDistrictName('鹽埕')).toBe('鹽埕區')
    expect(parseDistrictNameForForm('鹽埕區')).toBe('鹽埕')
    expect(formatSectionName('一小')).toBe('一小段')
    expect(parseSectionNameForForm('一小段')).toBe('一小')
  })

  it('supports parcel ranges and lists', () => {
    expect(formatLandSection({
      cityName: '高雄',
      cityType: '市',
      district: '鹽埕',
      section: '一小',
      parcel: '100, 105-130',
    })).toBe('高雄市鹽埕區一小段100, 105-130號')
    expect(formatLandSection({
      cityName: '高雄',
      cityType: '市',
      district: '鹽埕',
      section: '一小',
      parcel: '100、105-130',
    })).toBe('高雄市鹽埕區一小段100、105-130號')
    expect(formatLandSection({
      cityName: '高雄',
      cityType: '市',
      district: '鹽埕',
      section: '一小',
      parcel: '100-150、200',
    })).toBe('高雄市鹽埕區一小段100-150、200號')
  })

  it('parses legacy value without city or district', () => {
    expect(parseLandSection('鹽埕段一小段 123')).toEqual({
      cityName: '',
      cityType: '市',
      district: '',
      section: '鹽埕段一小',
      parcel: '123',
    })
  })

  it('parses full structured value', () => {
    expect(parseLandSection('高雄市鹽埕區一小段100-150號')).toEqual({
      cityName: '高雄',
      cityType: '市',
      district: '鹽埕',
      section: '一小',
      parcel: '100-150',
    })
  })

  it('round-trips composed value', () => {
    const parts = {
      cityName: '高雄',
      cityType: '市',
      district: '鹽埕',
      section: '一小',
      parcel: '100-150',
    }
    expect(parseLandSection(formatLandSection(parts))).toEqual(parts)
  })

  it('provides form defaults for empty value', () => {
    expect(getLandSectionFormDefaults('')).toEqual({
      cityName: DEFAULT_LAND_CITY_NAME,
      cityType: '市',
      district: '',
      section: '',
      parcel: '',
    })
  })

  it('validates required variable parts only', () => {
    expect(isLandPartsComplete({
      cityName: '高雄',
      cityType: '市',
      district: '鹽埕',
      section: '一小',
      parcel: '100-150',
    })).toBe(true)
    expect(isLandPartsComplete({
      cityName: '高雄',
      cityType: '市',
      district: '',
      section: '一小',
      parcel: '100-150',
    })).toBe(false)
    expect(isLandPartsComplete({
      cityName: '高雄',
      cityType: '市',
      district: '鹽埕',
      section: '一小',
      parcel: '100-',
    })).toBe(false)
  })

  it('rejects incomplete parcel while typing range', () => {
    expect(isValidParcel('100-')).toBe(false)
    expect(isValidParcel('100、')).toBe(false)
    expect(isValidParcel('100-150')).toBe(true)
    expect(isValidParcel('100, 105-130')).toBe(true)
    expect(isValidParcel('100、105-130')).toBe(true)
    expect(isValidParcel('100-150、200')).toBe(true)
  })

  it('syncs part fields without re-parsing section', () => {
    expect(landSectionFieldsFromParts({
      cityName: '高雄',
      cityType: '市',
      district: '鹽埕',
      section: '一小',
      parcel: '100-',
    })).toEqual({
      land_city_name: '高雄',
      land_city_type: '市',
      land_district_name: '鹽埕',
      land_section_name: '一小',
      land_parcel: '100-',
      land_section: '高雄市鹽埕區一小段100-號',
    })
  })
})

describe('building permit', () => {
  it('derives AB prefix from land city name and type', () => {
    expect(buildingPermitPrefixFromLand({ cityName: '高雄', cityType: '市' })).toBe('高市')
    expect(buildingPermitPrefixFromLand({ cityName: '屏東', cityType: '縣' })).toBe('屏縣')
    expect(buildingPermitPrefixFromLand({ cityName: '', cityType: '市' })).toBe('高市')
  })

  it('formats (YYY)AB建築字第XXXXX號', () => {
    expect(formatBuildingPermit({ year: '112', cityPrefix: '高市', number: '961' }))
      .toBe('(112)高市建築字第961號')
  })

  it('prefills defaults for empty form', () => {
    const defaults = getBuildingPermitFormDefaults('')
    expect(defaults.cityPrefix).toBe('高市')
    expect(defaults.year).toBe(currentRocYear())
  })

  it('parses legacy with 工', () => {
    expect(parseBuildingPermit('(112)高市工建築字第00961號')).toEqual({
      year: '112',
      cityPrefix: '高市',
      number: '00961',
    })
  })
})

describe('project scale', () => {
  it('formats floors from numbers only', () => {
    expect(formatProjectScale({ aboveGround: '5', underground: '1', notes: '' }))
      .toBe('地上5層、地下1層')
  })

  it('formats partial floors for preview', () => {
    expect(formatProjectScale({ aboveGround: '5', underground: '', notes: '' }))
      .toBe('地上5層')
    expect(formatProjectScale({ aboveGround: '', underground: '1', notes: '' }))
      .toBe('地下1層')
  })

  it('parses structured scale', () => {
    expect(parseProjectScale('地上5層、地下1層、RC構造')).toEqual({
      aboveGround: '5',
      underground: '1',
      notes: 'RC構造',
    })
    expect(parseProjectScale('地上5層，地下1層，RC構造')).toEqual({
      aboveGround: '5',
      underground: '1',
      notes: 'RC構造',
    })
  })

  it('parses partial scale without stuffing formatted text into notes', () => {
    expect(parseProjectScale('地上5層')).toEqual({
      aboveGround: '5',
      underground: '',
      notes: '',
    })
  })

  it('reads part fields without re-parsing composed string while typing', () => {
    expect(scalePartsFromData({
      scale_above_ground: '5',
      scale_underground: '',
      scale_notes: '',
      project_scale: '地上5層',
    })).toEqual({
      aboveGround: '5',
      underground: '',
      notes: '',
    })
  })

  it('syncs part fields without round-trip parse', () => {
    expect(projectScaleFieldsFromParts({
      aboveGround: '5',
      underground: '1',
      notes: 'RC構造',
    })).toEqual({
      scale_above_ground: '5',
      scale_underground: '1',
      scale_notes: 'RC構造',
      project_scale: '地上5層、地下1層、RC構造',
    })
  })
})
