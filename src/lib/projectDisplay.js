/** Auto-generated legacy fallback names from early wizard saves. */
const PLACEHOLDER_PROJECT_NAME = '未命名案件'
const AUTO_PROJECT_NAME_PATTERN = /^Project-\d+$/

export function isPlaceholderProjectName(name) {
  const trimmed = name?.trim()
  if (!trimmed) return true
  if (trimmed === PLACEHOLDER_PROJECT_NAME) return true
  return AUTO_PROJECT_NAME_PATTERN.test(trimmed)
}

/** Primary list / breadcrumb label — 地號 first, then 工程名稱. */
export function projectPrimaryLabel(project) {
  if (project?.land_section?.trim()) return project.land_section.trim()
  const marketing = project?.marketing_name?.trim()
  if (marketing && !isPlaceholderProjectName(marketing)) return marketing
  return PLACEHOLDER_PROJECT_NAME
}

/** Secondary label when both 地號 and 工程名稱 exist. */
export function projectSecondaryLabel(project) {
  const land = project?.land_section?.trim()
  const marketing = project?.marketing_name?.trim()
  if (!land || !marketing || isPlaceholderProjectName(marketing)) return null
  return marketing
}

export function displayLandSection(project) {
  return project?.land_section?.trim() || '—'
}

export function displayProjectName(project) {
  const marketing = project?.marketing_name?.trim()
  if (!marketing || isPlaceholderProjectName(marketing)) return '—'
  return marketing
}

/** Value for 工程名稱 field when editing an existing project. */
export function marketingNameForEdit(project) {
  return project?.marketing_name?.trim() || ''
}
