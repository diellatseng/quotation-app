import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const HEADER_SORT_BUTTON_CLASS = cn(
  'inline-flex h-7 -ml-3 items-center gap-1 rounded-lg px-1 py-0 text-[0.8rem] font-semibold text-inherit',
  'transition-colors hover:bg-table-header-foreground/15',
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
)

export function DataTableColumnHeader({ column, title, className }) {
  if (!column.getCanSort()) {
    return <div className={cn('font-semibold text-inherit', className)}>{title}</div>
  }

  const sorted = column.getIsSorted()

  return (
    <button
      type="button"
      className={cn(HEADER_SORT_BUTTON_CLASS, className)}
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {title}
      {sorted === 'desc' ? (
        <ArrowDown className="size-4" />
      ) : sorted === 'asc' ? (
        <ArrowUp className="size-4" />
      ) : (
        <ChevronsUpDown className="size-4 opacity-80" />
      )}
    </button>
  )
}
