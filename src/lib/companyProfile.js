export const PROFILE_TYPE_COMPANY = 'company'
export const PROFILE_TYPE_INDIVIDUAL = 'individual'

export const HONORIFIC_OPTIONS = ['先生', '小姐']

const NATIONAL_ID_PATTERN = /^[A-Z][12]\d{8}$/

/** 個人抬頭顯示名：姓名 + 稱謂 */
export function individualDisplayName(profile) {
  if (!profile?.name?.trim()) return ''
  const honorific = profile.honorific?.trim()
  return honorific ? `${profile.name.trim()} ${honorific}` : profile.name.trim()
}

export function isIndividualProfile(profile) {
  return profile?.profile_type === PROFILE_TYPE_INDIVIDUAL
}

/** Map DB row → PDF / A4Preview companyInfo shape. Falls back to .env when missing. */
export function companyProfileToInfo(profile) {
  if (profile?.name) {
    if (isIndividualProfile(profile)) {
      return {
        name: individualDisplayName(profile),
        address: profile.address || '',
        phone: profile.phone || '',
        fax: profile.fax || '',
        email: profile.email || '',
      }
    }
    return {
      name: profile.name,
      address: profile.address || '',
      phone: profile.phone || '',
      fax: profile.fax || '',
      email: profile.email || '',
    }
  }
  return envCompanyInfoFallback()
}

export function envCompanyInfoFallback() {
  return {
    name: import.meta.env.VITE_COMPANY_NAME || '公司名稱',
    address: import.meta.env.VITE_COMPANY_ADDRESS || '公司地址',
    phone: import.meta.env.VITE_COMPANY_PHONE || '公司電話',
    fax: import.meta.env.VITE_COMPANY_FAX || '',
    email: import.meta.env.VITE_COMPANY_EMAIL || '',
  }
}

export function companyProfileLabel(profile) {
  if (!profile) return '—'
  if (isIndividualProfile(profile)) {
    return individualDisplayName(profile) || '—'
  }
  return profile.name?.trim() || profile.label?.trim() || '—'
}

export function companyProfileTypeLabel(profileType) {
  return profileType === PROFILE_TYPE_INDIVIDUAL ? '個人' : '公司'
}

export function normalizeNationalId(value) {
  return String(value ?? '').trim().toUpperCase()
}

export function isValidNationalId(value) {
  const id = normalizeNationalId(value)
  return NATIONAL_ID_PATTERN.test(id)
}

/** @returns {string | null} error message */
export function validateIssuerProfileForm(form, profileType = PROFILE_TYPE_COMPANY) {
  const name = (form.name ?? '').trim()
  if (!name) {
    return profileType === PROFILE_TYPE_INDIVIDUAL ? '請填寫姓名' : '請填寫公司名稱'
  }

  if (profileType === PROFILE_TYPE_INDIVIDUAL) {
    if (!form.honorific || !HONORIFIC_OPTIONS.includes(form.honorific)) {
      return '請選擇先生或小姐'
    }
    if (!(form.address ?? '').trim()) {
      return '請填寫地址'
    }
    const nationalId = normalizeNationalId(form.national_id)
    if (!nationalId) {
      return '請填寫身分證字號'
    }
    if (!isValidNationalId(nationalId)) {
      return '身分證字號格式不正確（例：A123456789）'
    }
  }

  return null
}

export function buildIssuerProfilePayload(form, profileType = PROFILE_TYPE_COMPANY) {
  const name = form.name.trim()
  const base = {
    profile_type: profileType,
    name,
    address: (form.address ?? '').trim() || null,
    phone: (form.phone ?? '').trim() || null,
    fax: (form.fax ?? '').trim() || null,
    email: (form.email ?? '').trim() || null,
    is_default: !!form.is_default,
  }

  if (profileType === PROFILE_TYPE_INDIVIDUAL) {
    return {
      ...base,
      label: individualDisplayName({ name, honorific: form.honorific }),
      honorific: form.honorific,
      national_id: normalizeNationalId(form.national_id),
    }
  }

  return {
    ...base,
    label: name,
    honorific: null,
    national_id: null,
  }
}

/** Pick default profile; optional preferredType for company vs individual. */
export function pickDefaultCompanyProfile(profiles = [], preferredType) {
  if (!profiles.length) return null

  const normalized = profiles.map(p => ({
    ...p,
    profile_type: p.profile_type || PROFILE_TYPE_COMPANY,
  }))

  if (preferredType) {
    const typed = normalized.filter(p => p.profile_type === preferredType)
    if (typed.length) {
      return typed.find(p => p.is_default) || typed[0]
    }
  }

  return normalized.find(p => p.is_default) || normalized[0]
}
