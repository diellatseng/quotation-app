import { Field, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { DATA_TABLE_TOOLBAR_FIELD_HEIGHT } from '@/components/data-table/toolbar-styles'
import { PROJECT_STATUS_FILTERS } from '@/lib/projectFilters'
import { cn } from '@/lib/utils'

const FILTER_BASE = cn(
  'inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors',
  'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
)

const FILTER_INACTIVE = 'text-foreground hover:bg-surface-hover'

const FILTER_ACTIVE = 'bg-chip-active-bg font-semibold text-chip-active-text'

export default function ProjectStatusFilterPills({
  statusFilter,
  onStatusFilterChange,
  showCompleted,
  onShowCompletedChange,
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-2 py-1.5 sm:px-3 sm:py-2',
        DATA_TABLE_TOOLBAR_FIELD_HEIGHT,
      )}
    >
      <div
        className="flex flex-wrap items-center gap-0.5"
        role="group"
        aria-label="案件狀態篩選"
      >
        {PROJECT_STATUS_FILTERS.map(filter => {
          const isActive = statusFilter === filter
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={isActive}
              onClick={() => onStatusFilterChange(filter)}
              className={cn(FILTER_BASE, isActive ? FILTER_ACTIVE : FILTER_INACTIVE)}
            >
              {filter}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <Field orientation="horizontal" className="w-auto items-center gap-3">
          <FieldLabel htmlFor="completedToggle" className="cursor-pointer text-sm font-medium text-foreground">
            顯示已完工
          </FieldLabel>
          <Switch
            id="completedToggle"
            checked={showCompleted}
            onCheckedChange={onShowCompletedChange}
          />
        </Field>
      </div>
    </div>
  )
}
