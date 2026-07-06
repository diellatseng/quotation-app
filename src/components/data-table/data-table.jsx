import { flexRender } from '@tanstack/react-table'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const STICKY_HEAD_CLASS =
  'sticky top-0 z-10 border-b border-border bg-table-header text-table-header-foreground shadow-[inset_0_-1px_0_0_var(--border)]'

export function DataTable({
  table,
  onRowClick,
  selectedRowId,
  emptyMessage = '找不到符合的資料',
  headClassName = 'h-auto p-4 text-xs font-semibold uppercase tracking-wider text-table-header-foreground',
  cellClassName = 'p-4',
  scrollClassName = 'max-h-[min(62dvh,680px)]',
}) {
  const columns = table.getAllColumns()

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className={cn('overflow-auto', scrollClassName)}>
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="border-border hover:bg-transparent">
                {headerGroup.headers.map((header, index) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      headClassName,
                      STICKY_HEAD_CLASS,
                      index === 0 && 'rounded-tl-lg',
                      index === headerGroup.headers.length - 1 && 'rounded-tr-lg',
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => {
                const isSelected = selectedRowId != null && row.original.id === selectedRowId
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className={cn(
                      'border-border bg-card',
                      onRowClick && 'cursor-pointer hover:bg-surface-hover',
                      isSelected && 'border-l-4 border-l-primary bg-primary/10 hover:bg-primary/10',
                      !isSelected && onRowClick && 'border-l-4 border-l-transparent',
                    )}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className={cellClassName}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow className="bg-card hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 p-4 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>
    </div>
  )
}
