import { useMemo } from 'react'
import { AppEmptyState } from '@/components/AppEmptyState'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableSearch } from '@/components/data-table/data-table-search'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { useDataTable } from '@/components/data-table/use-data-table'
import { AdminListSkeleton } from '@/components/skeletons'
import { serviceGlobalFilterFn } from '@/lib/serviceSearch'
import { createServiceColumns } from './service-columns'
import { Layers } from 'lucide-react'

export default function ServicesDataTable({
  services,
  loading,
  selectedRowId,
  onRowClick,
  onEdit,
  onDelete,
  toolbarActions,
}) {
  const columns = useMemo(
    () => createServiceColumns({ onEdit, onDelete }),
    [onEdit, onDelete],
  )

  const table = useDataTable({
    data: services,
    columns,
    pageSize: 20,
    globalFilterFn: serviceGlobalFilterFn,
    initialSorting: [{ id: 'category', desc: false }],
    initialColumnVisibility: { description_preview: false },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const hasSearch = Boolean(table.getState().globalFilter)
  const summary = services.length === 0
    ? null
    : hasSearch && filteredCount !== services.length
      ? `顯示 ${filteredCount} / ${services.length} 筆`
      : `共 ${filteredCount} 筆`

  if (loading) {
    return <AdminListSkeleton rows={8} />
  }

  if (services.length === 0) {
    return (
      <AppEmptyState
        compact
        embedded
        icon={Layers}
        title="尚無服務項目"
        description="點選「新增服務」建立第一筆資料"
        className="rounded-lg border border-border bg-card shadow-sm"
      />
    )
  }

  return (
    <div className="space-y-3">
      <DataTableToolbar
        search={(
          <DataTableSearch
            value={table.getState().globalFilter}
            onChange={value => table.setGlobalFilter(value)}
            placeholder="搜尋服務名稱、類別、說明…"
            aria-label="搜尋服務"
          />
        )}
        summary={summary}
        actions={(
          <>
            <DataTableViewOptions table={table} />
            {toolbarActions}
          </>
        )}
      />

      <DataTable
        table={table}
        selectedRowId={selectedRowId}
        onRowClick={onRowClick}
        emptyMessage="找不到符合的服務，請調整搜尋條件"
      />

      <DataTablePagination table={table} />
    </div>
  )
}
