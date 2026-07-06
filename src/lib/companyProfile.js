/** Map DB row → PDF / A4Preview companyInfo shape. Falls back to .env when missing. */
export function companyProfileToInfo(profile) {
  if (profile?.name) {
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
  return profile.name?.trim() || profile.label?.trim() || '—'
}

/** Pick default profile, else first row. */
export function pickDefaultCompanyProfile(profiles = []) {
  if (!profiles.length) return null
  return profiles.find(p => p.is_default) || profiles[0]
}
