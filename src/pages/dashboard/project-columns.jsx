import { MoreHorizontal, Pause, Play, Trash2 } from 'lucide-react'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import {
  BillingSummaryBadges,
  ProjectStatusBadges,
  QuotationSummaryBadges,
} from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRocDate } from '@/lib/rocDate'
import { displayLandSection, displayProjectName } from '@/lib/projectDisplay'

const fmt = (n) => (n != null && n !== '' ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—')

function hasProjectStatusActions(status) {
  return status === '未開工' || status === '已開工' || status === '暫停'
}

export function createProjectColumns({
  actionMenuId,
  setActionMenuId,
  onStartWork,
  onUpdateStatus,
  onDelete,
}) {
  return [
    {
      accessorKey: 'land_section',
      meta: { label: '地號' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="地號" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{displayLandSection(row.original)}</span>
      ),
      sortingFn: (rowA, rowB) => {
        return displayLandSection(rowA.original).localeCompare(displayLandSection(rowB.original), 'zh-Hant')
      },
    },
    {
      accessorKey: 'marketing_name',
      meta: { label: '案件名稱' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="案件名稱" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">{displayProjectName(row.original)}</span>
      ),
      sortingFn: (rowA, rowB) => {
        return displayProjectName(rowA.original).localeCompare(displayProjectName(rowB.original), 'zh-Hant')
      },
    },
    {
      id: 'company_name',
      accessorFn: row => row.clients?.company_name ?? '',
      meta: { label: '客戶名稱' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="客戶名稱" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">{row.original.clients?.company_name || '—'}</span>
      ),
    },
    {
      accessorKey: 'total_amount',
      meta: { label: '金額' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="金額" />
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{fmt(row.getValue('total_amount'))}</span>
      ),
    },
    {
      accessorKey: 'status',
      meta: { label: '案件狀態' },
      header: '案件狀態',
      cell: ({ row }) => (
        <div onClick={e => e.stopPropagation()}>
          <ProjectStatusBadges status={row.getValue('status')} />
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'quotation_summary',
      accessorFn: row => row.quotationSummary,
      meta: { label: '報價狀態' },
      header: '報價狀態',
      cell: ({ row }) => (
        <div onClick={e => e.stopPropagation()}>
          <QuotationSummaryBadges status={row.original.quotationSummary} />
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'billing_summary',
      accessorFn: row => row.billingSummary,
      meta: { label: '請款狀態' },
      header: '請款狀態',
      cell: ({ row }) => (
        <div onClick={e => e.stopPropagation()}>
          <BillingSummaryBadges status={row.original.billingSummary} />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'updated_at',
      meta: { label: '更新日期' },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="更新日期" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">
          {formatRocDate(row.getValue('updated_at')?.slice?.(0, 10) ?? row.getValue('updated_at'))}
        </span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      header: () => <div className="text-right text-xs font-semibold uppercase tracking-wider text-inherit">操作</div>,
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="text-right" onClick={e => e.stopPropagation()}>
            <DropdownMenu
              open={actionMenuId === project.id}
              onOpenChange={open => {
                if (open) setActionMenuId(project.id)
                else setActionMenuId(null)
              }}
            >
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                    aria-label={`${displayLandSection(project)} 操作選單`}
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {hasProjectStatusActions(project.status) && (
                  <DropdownMenuGroup>
                    {project.status === '未開工' && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation()
                          onStartWork(project)
                        }}
                      >
                        <Play />
                        開工
                      </DropdownMenuItem>
                    )}
                    {project.status === '已開工' && (
                      <>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            onUpdateStatus(project.id, '暫停')
                          }}
                        >
                          <Pause />
                          暫停
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            onUpdateStatus(project.id, '完工')
                          }}
                        >
                          標記完工
                        </DropdownMenuItem>
                      </>
                    )}
                    {project.status === '暫停' && (
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation()
                          onUpdateStatus(project.id, '已開工')
                        }}
                      >
                        <Play />
                        恢復進行
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                )}
                {hasProjectStatusActions(project.status) && <DropdownMenuSeparator />}
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={e => {
                      e.stopPropagation()
                      onDelete(project)
                    }}
                  >
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
