const STORAGE_PREFIX = 'qapp_dt_cols_'

export function loadColumnVisibility(storageKey, defaults = {}) {
  if (!storageKey || typeof window === 'undefined') return { ...defaults }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`)
    if (!raw) return { ...defaults }
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return { ...defaults }
    return { ...defaults, ...saved }
  } catch {
    return { ...defaults }
  }
}

export function saveColumnVisibility(storageKey, visibility) {
  if (!storageKey || typeof window === 'undefined') return

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(visibility))
  } catch {
    /* quota / private mode */
  }
}
