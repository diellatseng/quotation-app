import { useMemo } from 'react'
import { AppEmptyState } from '@/components/AppEmptyState'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableSearch } from '@/components/data-table/data-table-search'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { useDataTable } from '@/components/data-table/use-data-table'
import { AdminListSkeleton } from '@/components/skeletons'
import { templateGlobalFilterFn } from '@/lib/templateSearch'
import { createTemplateColumns } from './template-columns'
import { LayoutTemplate } from 'lucide-react'

export default function TemplatesDataTable({
  templates,
  loading,
  selectedRowId,
  onRowClick,
  onEdit,
  onDelete,
  toolbarActions,
}) {
  const columns = useMemo(
    () => createTemplateColumns({ onEdit, onDelete }),
    [onEdit, onDelete],
  )

  const table = useDataTable({
    data: templates,
    columns,
    pageSize: 20,
    globalFilterFn: templateGlobalFilterFn,
    columnVisibilityStorageKey: 'templates',
    initialColumnVisibility: { description: false },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const hasSearch = Boolean(table.getState().globalFilter)
  const summary = templates.length === 0
    ? null
    : hasSearch && filteredCount !== templates.length
      ? `顯示 ${filteredCount} / ${templates.length} 筆`
      : `共 ${filteredCount} 筆`

  if (loading) {
    return <AdminListSkeleton rows={8} />
  }

  if (templates.length === 0) {
    return (
      <AppEmptyState
        compact
        embedded
        icon={LayoutTemplate}
        title="尚無工程範本"
        description="點選「新增範本」建立第一筆資料"
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
            placeholder="搜尋範本名稱、類別、說明…"
            aria-label="搜尋範本"
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
        emptyMessage="找不到符合的範本，請調整搜尋條件"
      />

      <DataTablePagination table={table} />
    </div>
  )
}
