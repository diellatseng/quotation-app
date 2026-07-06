import { useEffect, useState } from 'react'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  loadColumnVisibility,
  saveColumnVisibility,
} from '@/lib/dataTableColumnVisibility'

export function useDataTable({
  data,
  columns,
  pageSize = 20,
  globalFilterFn,
  initialColumnVisibility = {},
  columnVisibilityStorageKey,
  initialSorting = [],
  ...options
}) {
  const [sorting, setSorting] = useState(initialSorting)
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState(() =>
    loadColumnVisibility(columnVisibilityStorageKey, initialColumnVisibility),
  )

  useEffect(() => {
    saveColumnVisibility(columnVisibilityStorageKey, columnVisibility)
  }, [columnVisibilityStorageKey, columnVisibility])

  return useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
    ...options,
  })
}
