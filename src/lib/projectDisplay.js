/** Auto-generated legacy fallback names from early wizard saves. */
const PLACEHOLDER_PROJECT_NAME = '未命名專案'
const AUTO_PROJECT_NAME_PATTERN = /^Project-\d+$/

export function isPlaceholderProjectName(name) {
  const trimmed = name?.trim()
  if (!trimmed) return true
  if (trimmed === PLACEHOLDER_PROJECT_NAME) return true
  return AUTO_PROJECT_NAME_PATTERN.test(trimmed)
}

/**
 * Value stored in projects.name (NOT NULL).
 * Prefer 工程名稱; otherwise 地號; otherwise 未命名專案.
 */
export function resolveProjectName({ project_name, land_section }) {
  const projectName = project_name?.trim()
  const land = land_section?.trim()
  if (projectName) return projectName
  if (land) return land
  return PLACEHOLDER_PROJECT_NAME
}

/** Primary list / breadcrumb label — 地號 first, then name. */
export function projectPrimaryLabel(project) {
  if (project?.land_section?.trim()) return project.land_section.trim()
  const name = project?.name?.trim()
  if (name && !isPlaceholderProjectName(name)) return name
  return PLACEHOLDER_PROJECT_NAME
}

/** Secondary label when both 地號 and name exist. */
export function projectSecondaryLabel(project) {
  const land = project?.land_section?.trim()
  const name = project?.name?.trim()
  if (!land || !name || isPlaceholderProjectName(name) || name === land) return null
  return name
}

export function displayLandSection(project) {
  return project?.land_section?.trim() || '—'
}

export function displayProjectName(project) {
  const name = project?.name?.trim()
  if (!name || isPlaceholderProjectName(name) || name === project?.land_section?.trim()) return '—'
  return name
}
