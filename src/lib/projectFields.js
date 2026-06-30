/** @typedef {{ cityName: string, cityType: string, district: string, section: string, parcel: string }} LandSectionParts */
/** @typedef {{ year: string, cityPrefix: string, number: string }} BuildingPermitParts */
/** @typedef {{ aboveGround: string, underground: string, notes: string }} ProjectScaleParts */

export const DEFAULT_BUILDING_PERMIT_CITY = '高市'
/** 預設：高雄 + 市 → 高雄市 */
export const DEFAULT_LAND_CITY_NAME = '高雄'
export const DEFAULT_LAND_CITY_TYPE = '市'

/** 地號：100 | 100-150 | 100、105-130 | 100-150、200 */
const PARCEL_SEP = '[,、]'
const PARCEL_VALUE_RE = new RegExp(
  `[0-9]+(?:-[0-9]+)?(?:${PARCEL_SEP}\\s*[0-9]+(?:-[0-9]+)?)*`,
)

export function currentRocYear() {
  return String(new Date().getFullYear() - 1911)
}

function emptyLandParts() {
  return {
    cityName: '',
    cityType: DEFAULT_LAND_CITY_TYPE,
    district: '',
    section: '',
    parcel: '',
  }
}

export function parseDistrictNameForForm(text) {
  const s = text?.trim() || ''
  if (!s) return ''
  return s.endsWith('區') ? s.slice(0, -1) : s
}

export function formatDistrictName(districtName) {
  const d = districtName?.trim() || ''
  if (!d) return ''
  return d.endsWith('區') ? d : `${d}區`
}

export function parseSectionNameForForm(sectionText) {
  const s = sectionText?.trim() || ''
  if (!s) return ''
  return s.endsWith('段') ? s.slice(0, -1) : s
}

export function formatSectionName(sectionName) {
  const s = sectionName?.trim() || ''
  if (!s) return ''
  return s.endsWith('段') ? s : `${s}段`
}

export function sanitizeParcelInput(value) {
  return value.replace(/[^0-9,\-\s、]/g, '').replace(/\s+/g, ' ')
}

export function isValidParcel(value) {
  const v = value?.trim() || ''
  if (!v) return false
  return new RegExp(
    `^[0-9]+(?:-[0-9]+)?(?:${PARCEL_SEP}\\s*[0-9]+(?:-[0-9]+)?)*$`,
  ).test(v)
}

/** @param {LandSectionParts} parts */
export function isLandPartsComplete(parts) {
  const parcel = parts.parcel?.trim() || ''
  return !!(
    parts.cityName?.trim()
    && parts.district?.trim()
    && parts.section?.trim()
    && (!parcel || isValidParcel(parcel))
  )
}

/** Read structured land fields from wizard data (no round-trip parse while typing). */
export function landPartsFromData(data) {
  if (
    data?.land_city_name != null
    || data?.land_district_name != null
    || data?.land_section_name != null
    || data?.land_parcel != null
  ) {
    return {
      cityName: data.land_city_name ?? DEFAULT_LAND_CITY_NAME,
      cityType: data.land_city_type ?? DEFAULT_LAND_CITY_TYPE,
      district: data.land_district_name ?? '',
      section: data.land_section_name ?? '',
      parcel: data.land_parcel ?? '',
    }
  }
  return getLandSectionFormDefaults(data?.land_section || '')
}

/** Sync composed land_section + part fields for parent wizard state. */
export function landSectionFieldsFromParts(parts) {
  return {
    land_city_name: parts.cityName,
    land_city_type: parts.cityType,
    land_district_name: parts.district,
    land_section_name: parts.section,
    land_parcel: parts.parcel,
    land_section: formatLandSection(parts),
  }
}

function splitLegacySectionAndParcel(body) {
  const trimmed = body.trim()
  if (!trimmed) return { section: '', parcel: '' }

  const spaced = trimmed.match(new RegExp(`^(.+?)\\s+(${PARCEL_VALUE_RE.source})\\s*$`))
  if (spaced) {
    return { section: spaced[1].trim(), parcel: spaced[2].trim() }
  }

  const attached = trimmed.match(new RegExp(`^(.+?)(${PARCEL_VALUE_RE.source})\\s*$`))
  if (attached) {
    return { section: attached[1].trim(), parcel: attached[2].trim() }
  }

  return { section: trimmed, parcel: '' }
}

/** Defaults shown in empty forms — prefill to reduce typing. */
export function getLandSectionFormDefaults(value) {
  const parsed = parseLandSection(value)
  if (value?.trim()) return parsed
  return {
    cityName: DEFAULT_LAND_CITY_NAME,
    cityType: DEFAULT_LAND_CITY_TYPE,
    district: '',
    section: '',
    parcel: '',
  }
}

/** @returns {LandSectionParts} */
export function parseLandSection(value) {
  const raw = value?.trim() || ''
  if (!raw) return emptyLandParts()

  let body = raw.replace(/號\s*$/, '').replace(/地號\s*$/, '').trim()

  let cityName = ''
  let cityType = DEFAULT_LAND_CITY_TYPE

  const cityMatch = body.match(/^(.+?)([市縣])(.*)$/)
  if (cityMatch) {
    cityName = cityMatch[1].trim()
    cityType = cityMatch[2]
    body = cityMatch[3].trim()
  }

  if (!body) return { cityName, cityType, district: '', section: '', parcel: '' }

  let district = ''
  const districtMatch = body.match(/^(.+?)區(.*)$/)
  if (districtMatch) {
    district = districtMatch[1].trim()
    body = districtMatch[2].trim()
  }

  if (districtMatch) {
    const sectionMatch = body.match(/^(.+?)段(.*)$/)
    if (sectionMatch) {
      return {
        cityName,
        cityType,
        district,
        section: sectionMatch[1].trim(),
        parcel: sanitizeParcelInput(sectionMatch[2]),
      }
    }
  }

  const legacy = splitLegacySectionAndParcel(body)
  return {
    cityName,
    cityType,
    district,
    section: parseSectionNameForForm(legacy.section),
    parcel: legacy.parcel,
  }
}

/** Format: XX市XX區XX段XXX號 */
export function formatLandSection({ cityName, cityType, district, section, parcel }) {
  const name = cityName?.trim() || ''
  const type = cityType?.trim() || DEFAULT_LAND_CITY_TYPE
  const districtFormatted = formatDistrictName(district)
  const sectionFormatted = formatSectionName(section)
  const p = sanitizeParcelInput(parcel || '')

  if (!name && !districtFormatted && !sectionFormatted && !p) return ''

  const chunks = []
  if (name) chunks.push(`${name}${type}`)
  if (districtFormatted) chunks.push(districtFormatted)
  if (sectionFormatted) chunks.push(sectionFormatted)
  if (p) chunks.push(`${p}號`)
  return chunks.join('')
}

/** @param {string} value */
export function isLandSectionComplete(value) {
  if (!value?.trim()) return false
  return isLandPartsComplete(parseLandSection(value))
}

/** A = 地號（縣市名）首字，B = 市/縣 → 例：高雄市 → 高市 */
export function buildingPermitPrefixFromLand({ cityName, cityType }) {
  const name = (cityName?.trim() || DEFAULT_LAND_CITY_NAME).trim()
  const type = cityType?.trim() || DEFAULT_LAND_CITY_TYPE
  const firstChar = [...name][0] || DEFAULT_BUILDING_PERMIT_CITY.charAt(0)
  return `${firstChar}${type}`
}

export function getBuildingPermitFormDefaults(value) {
  const parsed = parseBuildingPermit(value)
  if (value?.trim()) return parsed
  return {
    year: currentRocYear(),
    cityPrefix: buildingPermitPrefixFromLand({
      cityName: DEFAULT_LAND_CITY_NAME,
      cityType: DEFAULT_LAND_CITY_TYPE,
    }),
    number: '',
  }
}

/** @returns {BuildingPermitParts} */
export function parseBuildingPermit(value) {
  const raw = value?.trim() || ''
  if (!raw) {
    return { year: '', cityPrefix: DEFAULT_BUILDING_PERMIT_CITY, number: '' }
  }

  const withYear = raw.match(/^\((\d+)\)\s*(.+?)(?:工)?建築字第\s*(\d+)\s*號?\s*$/)
  if (withYear) {
    return {
      year: withYear[1],
      cityPrefix: withYear[2].trim() || DEFAULT_BUILDING_PERMIT_CITY,
      number: withYear[3],
    }
  }

  const noYear = raw.match(/^(.+?)(?:工)?建築字第\s*(\d+)\s*號?\s*$/)
  if (noYear) {
    return {
      year: '',
      cityPrefix: noYear[1].trim() || DEFAULT_BUILDING_PERMIT_CITY,
      number: noYear[2],
    }
  }

  return { year: '', cityPrefix: DEFAULT_BUILDING_PERMIT_CITY, number: '' }
}

/** @param {BuildingPermitParts} parts */
export function formatBuildingPermit({ year, cityPrefix, number }) {
  const y = year?.trim() || ''
  const city = cityPrefix?.trim() || DEFAULT_BUILDING_PERMIT_CITY
  const n = number?.trim() || ''

  if (!y && !n) return ''

  let result = ''
  if (y) result += `(${y})`
  result += city
  result += '建築字第'
  if (n) result += n
  if (n || y) result += '號'
  return result
}

/** Read structured scale fields from wizard data (no round-trip parse while typing). */
export function scalePartsFromData(data) {
  if (
    data?.scale_above_ground != null
    || data?.scale_underground != null
    || data?.scale_notes != null
  ) {
    return {
      aboveGround: data.scale_above_ground ?? '',
      underground: data.scale_underground ?? '',
      notes: data.scale_notes ?? '',
    }
  }
  return parseProjectScale(data?.project_scale || '')
}

/** Sync composed project_scale + part fields for parent wizard state. */
export function projectScaleFieldsFromParts(parts) {
  return {
    scale_above_ground: parts.aboveGround,
    scale_underground: parts.underground,
    scale_notes: parts.notes,
    project_scale: formatProjectScale(parts),
  }
}

const PROJECT_SCALE_SEP = '、'

/** @returns {ProjectScaleParts} */
export function parseProjectScale(value) {
  const raw = value?.trim() || ''
  if (!raw) return { aboveGround: '', underground: '', notes: '' }

  const sep = '[，,、]'

  const full = raw.match(
    new RegExp(`^地上\\s*(\\d+)\\s*層\\s*${sep}\\s*地下\\s*(\\d+)\\s*層\\s*(?:${sep}\\s*(.+))?\\s*$`),
  )
  if (full) {
    return {
      aboveGround: full[1],
      underground: full[2],
      notes: (full[3] || '').trim(),
    }
  }

  const aboveOnly = raw.match(new RegExp(`^地上\\s*(\\d+)\\s*層\\s*(?:${sep}\\s*(.+))?\\s*$`))
  if (aboveOnly && !raw.includes('地下')) {
    return {
      aboveGround: aboveOnly[1],
      underground: '',
      notes: (aboveOnly[2] || '').trim(),
    }
  }

  const underOnly = raw.match(new RegExp(`^地下\\s*(\\d+)\\s*層\\s*(?:${sep}\\s*(.+))?\\s*$`))
  if (underOnly && !raw.includes('地上')) {
    return {
      aboveGround: '',
      underground: underOnly[1],
      notes: (underOnly[2] || '').trim(),
    }
  }

  return { aboveGround: '', underground: '', notes: raw }
}

/** @param {ProjectScaleParts} parts */
export function formatProjectScale({ aboveGround, underground, notes }) {
  const a = aboveGround?.trim() || ''
  const u = underground?.trim() || ''
  const n = notes?.trim() || ''

  if (!a && !u && !n) return ''

  const floorParts = []
  if (a) floorParts.push(`地上${a}層`)
  if (u) floorParts.push(`地下${u}層`)

  if (floorParts.length) {
    const base = floorParts.join(PROJECT_SCALE_SEP)
    return n ? `${base}${PROJECT_SCALE_SEP}${n}` : base
  }

  return n
}

export const structuredFieldTypographyClassName =
  'text-base md:text-base font-medium leading-normal text-foreground'

export const structuredInputClassName =
  `min-h-10 h-10 ${structuredFieldTypographyClassName}`

export const structuredFixedTextClassName =
  `${structuredFieldTypographyClassName} whitespace-nowrap`
