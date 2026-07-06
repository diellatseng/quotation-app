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

export function createClientColumns({ onEdit, onDelete }) {
  return [
    {
      accessorKey: 'company_name',
      meta: { label: '公司名稱' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="公司名稱" />
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{row.getValue('company_name')}</span>
      ),
    },
    {
      accessorKey: 'phone',
      meta: { label: '電話' },
      header: '電話',
      cell: ({ row }) => (
        <span className="text-foreground">{displayValue(row.getValue('phone'))}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'email',
      meta: { label: '電子郵件' },
      header: '電子郵件',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{displayValue(row.getValue('email'))}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'responsible_person_name',
      meta: { label: '負責人' },
      header: '負責人',
      cell: ({ row }) => (
        <span className="text-foreground">{displayValue(row.getValue('responsible_person_name'))}</span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'address',
      meta: { label: '地址' },
      header: '地址',
      cell: ({ row }) => (
        <span className="max-w-[12rem] truncate text-muted-foreground" title={row.getValue('address') || ''}>
          {displayValue(row.getValue('address'))}
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
        const client = row.original
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
                    aria-label={`${client.company_name} 操作選單`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onEdit(client)}>
                    <Pencil />
                    編輯
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(client)}>
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
