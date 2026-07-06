const CLIENT_SEARCH_FIELDS = [
  'company_name',
  'phone',
  'fax',
  'email',
  'address',
  'responsible_person_name',
  'responsible_person_mobile',
  'responsible_person_title',
]

export function matchesClientSearch(client, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true

  return CLIENT_SEARCH_FIELDS.some((field) => {
    const value = client?.[field]
    if (value == null || value === '') return false
    return String(value).toLowerCase().includes(q)
  })
}

/** TanStack Table globalFilterFn */
export function clientGlobalFilterFn(row, _columnId, filterValue) {
  return matchesClientSearch(row.original, filterValue)
}
