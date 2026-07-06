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
import { stripHtml } from '@/lib/serviceSearch'

function displayValue(value) {
  const text = value?.trim?.() ?? value
  if (text == null || text === '') return '—'
  return text
}

function displayCategory(value) {
  const text = value?.trim?.() ?? value
  if (text == null || text === '') return '未分類'
  return text
}

export function createServiceColumns({ onEdit, onDelete }) {
  return [
    {
      accessorKey: 'name',
      meta: { label: '服務名稱' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="服務名稱" />
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
        <span className="text-foreground">{displayCategory(row.getValue('category'))}</span>
      ),
      sortingFn: (rowA, rowB) => {
        const a = displayCategory(rowA.getValue('category'))
        const b = displayCategory(rowB.getValue('category'))
        return a.localeCompare(b, 'zh-Hant')
      },
    },
    {
      id: 'description_preview',
      accessorFn: row => stripHtml(row.description),
      meta: { label: '說明' },
      header: '說明',
      cell: ({ row }) => {
        const text = stripHtml(row.original.description)
        return (
          <span className="max-w-[14rem] truncate text-muted-foreground" title={text}>
            {displayValue(text)}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      header: () => <div className="text-right text-xs font-semibold uppercase tracking-wider text-inherit">操作</div>,
      cell: ({ row }) => {
        const service = row.original
        return (
          <div className="text-right" onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  aria-label={`${service.name} 操作選單`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onEdit(service)}>
                    <Pencil />
                    編輯
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(service)}>
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
