import { useMemo } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableSearch } from '@/components/data-table/data-table-search'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { useDataTable } from '@/components/data-table/use-data-table'
import { projectGlobalFilterFn } from '@/lib/projectSearch'
import { createProjectColumns } from './project-columns'
import ProjectsMobileList from './projects-mobile-list'

export default function ProjectsDataTable({
  projects,
  onRowClick,
  filters,
  toolbarActions,
  actionMenuId,
  setActionMenuId,
  onStartWork,
  onUpdateStatus,
  onDelete,
  emptyMessage = '找不到符合的案件，請調整搜尋條件',
}) {
  const columns = useMemo(
    () => createProjectColumns({
      actionMenuId,
      setActionMenuId,
      onStartWork,
      onUpdateStatus,
      onDelete,
    }),
    [actionMenuId, setActionMenuId, onStartWork, onUpdateStatus, onDelete],
  )

  const table = useDataTable({
    data: projects,
    columns,
    pageSize: 20,
    globalFilterFn: projectGlobalFilterFn,
    columnVisibilityStorageKey: 'dashboard-projects',
    initialSorting: [{ id: 'updated_at', desc: true }],
    initialColumnVisibility: {
      marketing_name: true,
      quotation_summary: true,
      billing_summary: true,
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const hasSearch = Boolean(table.getState().globalFilter)
  const summary = hasSearch && filteredCount !== projects.length
    ? `顯示 ${filteredCount} / ${projects.length} 筆`
    : `共 ${filteredCount} 筆`

  const pageRows = table.getRowModel().rows

  return (
    <div className="space-y-4">
      <DataTableToolbar
        search={(
          <DataTableSearch
            value={table.getState().globalFilter}
            onChange={value => table.setGlobalFilter(value)}
            placeholder="搜尋地號、案件名稱、客戶名稱…"
            aria-label="搜尋案件"
          />
        )}
        summary={summary}
        filters={filters}
        actions={(
          <>
            <div className="hidden md:contents">
              <DataTableViewOptions table={table} />
            </div>
            {toolbarActions}
          </>
        )}
      />

      {pageRows.length > 0 ? (
        <>
          <ProjectsMobileList rows={pageRows} onRowClick={onRowClick} />
          <div className="hidden md:block">
            <DataTable
              table={table}
              onRowClick={onRowClick}
              emptyMessage={emptyMessage}
            />
          </div>
        </>
      ) : (
        <>
          <p className="py-8 text-center text-sm text-muted-foreground md:hidden">
            {emptyMessage}
          </p>
          <div className="hidden md:block">
            <DataTable
              table={table}
              onRowClick={onRowClick}
              emptyMessage={emptyMessage}
            />
          </div>
        </>
      )}

      <DataTablePagination table={table} />
    </div>
  )
}
