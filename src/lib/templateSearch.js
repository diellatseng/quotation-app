const TEMPLATE_SEARCH_FIELDS = ['name', 'category', 'description']

export function matchesTemplateSearch(template, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true

  return TEMPLATE_SEARCH_FIELDS.some((field) => {
    const value = template?.[field]
    if (value == null || value === '') return false
    return String(value).toLowerCase().includes(q)
  })
}

/** TanStack Table globalFilterFn */
export function templateGlobalFilterFn(row, _columnId, filterValue) {
  return matchesTemplateSearch(row.original, filterValue)
}
