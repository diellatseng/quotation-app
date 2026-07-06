import { Field, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { PROJECT_STATUS_FILTERS } from '@/lib/projectFilters'
import { cn } from '@/lib/utils'

const CHIP_BASE = cn(
  'inline-flex h-7 items-center justify-center rounded-full border px-4 text-[0.8rem] font-medium',
  'transition-[color,background-color,border-color]',
  'focus-visible:z-10 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
)

const CHIP_INACTIVE = cn(
  'border-chip-default-border bg-card text-foreground',
  'hover:border-chip-hover-border hover:bg-chip-hover-bg',
)

const CHIP_ACTIVE = cn(
  'border-chip-active-bg bg-chip-active-bg font-semibold text-chip-active-text',
  'hover:border-chip-active-bg hover:bg-chip-active-bg hover:text-chip-active-text',
)

export default function ProjectStatusFilterPills({
  statusFilter,
  onStatusFilterChange,
  showCompleted,
  onShowCompletedChange,
}) {
  return (
    <>
      <div
        className="flex flex-wrap gap-2"
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
              className={cn(CHIP_BASE, isActive ? CHIP_ACTIVE : CHIP_INACTIVE)}
            >
              {filter}
            </button>
          )
        })}
      </div>
      <Field orientation="horizontal" className="w-auto items-center gap-3">
        <FieldLabel htmlFor="completedToggle" className="cursor-pointer">
          顯示已完工
        </FieldLabel>
        <Switch
          id="completedToggle"
          checked={showCompleted}
          onCheckedChange={onShowCompletedChange}
        />
      </Field>
    </>
  )
}
