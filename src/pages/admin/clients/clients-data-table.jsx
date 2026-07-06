import { useMemo } from 'react'
import { AppEmptyState } from '@/components/AppEmptyState'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableSearch } from '@/components/data-table/data-table-search'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { useDataTable } from '@/components/data-table/use-data-table'
import { AdminListSkeleton } from '@/components/skeletons'
import { clientGlobalFilterFn } from '@/lib/clientSearch'
import { createClientColumns } from './client-columns'
import { Building2 } from 'lucide-react'

export default function ClientsDataTable({
  clients,
  loading,
  selectedRowId,
  onRowClick,
  onEdit,
  onDelete,
  toolbarActions,
}) {
  const columns = useMemo(
    () => createClientColumns({ onEdit, onDelete }),
    [onEdit, onDelete],
  )

  const table = useDataTable({
    data: clients,
    columns,
    pageSize: 20,
    globalFilterFn: clientGlobalFilterFn,
    columnVisibilityStorageKey: 'clients',
    initialColumnVisibility: { address: false },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const hasSearch = Boolean(table.getState().globalFilter)
  const summary = clients.length === 0
    ? null
    : hasSearch && filteredCount !== clients.length
      ? `顯示 ${filteredCount} / ${clients.length} 筆`
      : `共 ${filteredCount} 筆`

  if (loading) {
    return <AdminListSkeleton rows={8} />
  }

  if (clients.length === 0) {
    return (
      <AppEmptyState
        compact
        embedded
        icon={Building2}
        title="尚無客戶"
        description="點選「新增客戶」或上傳 Excel 建立第一筆資料"
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
            placeholder="搜尋公司名稱、電話、Email、負責人…"
            aria-label="搜尋客戶"
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
        emptyMessage="找不到符合的客戶，請調整搜尋條件"
      />

      <DataTablePagination table={table} />
    </div>
  )
}
