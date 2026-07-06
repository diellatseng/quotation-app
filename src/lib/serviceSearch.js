const SERVICE_SEARCH_FIELDS = ['name', 'category']

export function stripHtml(html) {
  if (!html) return ''
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function matchesServiceSearch(service, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true

  if (SERVICE_SEARCH_FIELDS.some((field) => {
    const value = service?.[field]
    if (value == null || value === '') return false
    return String(value).toLowerCase().includes(q)
  })) {
    return true
  }

  const plainDescription = stripHtml(service?.description)
  return plainDescription !== '' && plainDescription.toLowerCase().includes(q)
}

/** TanStack Table globalFilterFn */
export function serviceGlobalFilterFn(row, _columnId, filterValue) {
  return matchesServiceSearch(row.original, filterValue)
}
