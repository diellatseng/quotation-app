export function matchesProjectSearch(project, query) {
  const q = String(query ?? '').trim()
  if (!q) return true

  const fields = [
    project?.land_section,
    project?.marketing_name,
    project?.clients?.company_name,
  ]

  return fields.some((value) => {
    if (value == null || value === '') return false
    return String(value).includes(q)
  })
}

/** TanStack Table globalFilterFn */
export function projectGlobalFilterFn(row, _columnId, filterValue) {
  return matchesProjectSearch(row.original, filterValue)
}
