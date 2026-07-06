import { cn } from '@/lib/utils'

export function DataTableToolbar({
  search,
  summary,
  filters,
  actions,
  className,
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {search}
          {summary ? (
            <p className="shrink-0 text-sm text-muted-foreground">{summary}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {filters ? (
        <div className="w-full">
          {filters}
        </div>
      ) : null}
    </div>
  )
}
