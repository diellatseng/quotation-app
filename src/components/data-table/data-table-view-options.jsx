import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DATA_TABLE_TOOLBAR_BUTTON_SIZE,
  dataTableToolbarButtonClassName,
} from './toolbar-styles'

export function DataTableViewOptions({ table, label = '欄位顯示', iconOnly = true }) {
  const hideable = table
    .getAllColumns()
    .filter(column => typeof column.accessorFn !== 'undefined' && column.getCanHide())

  if (hideable.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size={iconOnly ? 'icon-sm' : DATA_TABLE_TOOLBAR_BUTTON_SIZE}
            className={iconOnly ? undefined : dataTableToolbarButtonClassName}
            aria-label={label}
          >
            <SlidersHorizontal data-icon={iconOnly ? undefined : 'inline-start'} />
            {iconOnly ? <span className="sr-only">{label}</span> : label}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {hideable.map(column => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={value => column.toggleVisibility(!!value)}
            >
              {column.columnDef.meta?.label ?? column.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
