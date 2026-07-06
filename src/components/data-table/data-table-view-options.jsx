import { Settings2 } from 'lucide-react'
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

export function DataTableViewOptions({ table, label = '欄位顯示' }) {
  const hideable = table
    .getAllColumns()
    .filter(column => typeof column.accessorFn !== 'undefined' && column.getCanHide())

  if (hideable.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={DATA_TABLE_TOOLBAR_BUTTON_SIZE}
          className={dataTableToolbarButtonClassName}
        >
          <Settings2 data-icon="inline-start" />
          {label}
        </Button>
      </DropdownMenuTrigger>
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
