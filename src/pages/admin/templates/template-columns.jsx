import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function displayValue(value) {
  const text = value?.trim?.() ?? value
  if (text == null || text === '') return '—'
  return text
}

function serviceCount(template) {
  return (template.template_services || []).length
}

export function createTemplateColumns({ onEdit, onDelete }) {
  return [
    {
      accessorKey: 'name',
      meta: { label: '範本名稱' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="範本名稱" />
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{row.getValue('name')}</span>
      ),
    },
    {
      accessorKey: 'category',
      meta: { label: '類別' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="類別" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">{displayValue(row.getValue('category'))}</span>
      ),
    },
    {
      id: 'service_count',
      accessorFn: row => serviceCount(row),
      meta: { label: '服務項目數' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="服務項目數" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">{serviceCount(row.original)} 項</span>
      ),
    },
    {
      accessorKey: 'description',
      meta: { label: '說明' },
      header: '說明',
      cell: ({ row }) => (
        <span className="max-w-[12rem] truncate text-muted-foreground" title={row.getValue('description') || ''}>
          {displayValue(row.getValue('description'))}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      header: () => <div className="text-right text-xs font-semibold uppercase tracking-wider text-inherit">操作</div>,
      cell: ({ row }) => {
        const template = row.original
        return (
          <div className="text-right" onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    aria-label={`${template.name} 操作選單`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onEdit(template)}>
                    <Pencil />
                    編輯
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(template)}>
                    <Trash2 />
                    刪除
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
