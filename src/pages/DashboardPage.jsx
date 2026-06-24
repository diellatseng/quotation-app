// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useAppearance } from '../context/AppearanceContext'
import { APP_THEMES, getThemeLabel } from '@/lib/themes'
import { toast } from 'sonner'
import { formatRocDate } from '../lib/rocDate'
import { deleteProjectById } from '../lib/deleteProject'
import { applyStartProjectWork, needsStartWorkConfirmation } from '../lib/startProjectWork'
import { projectPrimaryLabel } from '../lib/projectDisplay'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { BillingSummaryBadges, ProjectStatusBadges, QuotationSummaryBadges, ProjectSummaryBadges } from '@/components/ui/badge'
import {
  enrichProjectWithSummaries,
  groupInvoicesByProject,
  groupQuotationsByProject,
  groupStagesByProject,
} from '@/lib/projectSummaries'
import { AppEmptyState } from '@/components/AppEmptyState'
import { DashboardQuotationsSkeleton } from '@/components/skeletons'
import IconTooltip from '@/components/IconTooltip'
import { AppBrandTitle, AppShellHeader } from '@/components/AppShellHeader'
import { FolderKanban, MoreHorizontal, Palette, Pause, Play, Plus, Search, Trash2 } from 'lucide-react'

import { displayLandSection, displayProjectName } from '@/lib/projectDisplay'

const STATUS_FILTERS = ['全部', '未開工', '已開工', '暫停', '完工']
const fmt = (n) => (n != null && n !== '' ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—')

function hasProjectStatusActions(status) {
  return status === '未開工' || status === '已開工' || status === '暫停'
}

export default function DashboardPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [showCompleted, setShowCompleted] = useState(false)
  const [actionMenuId, setActionMenuId] = useState(null)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [projectToStart, setProjectToStart] = useState(null)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const { user, signOut } = useAuth()
  const { baseFontSize, setFontSize, theme, setTheme } = useAppearance()
  const navigate = useNavigate()

  const fetchProjects = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('projects')
      .select(`
        id, name, land_section, status, total_amount, tax_included, updated_at,
        clients(company_name)
      `)
      .neq('status', '已刪除')
      .order('updated_at', { ascending: false })

    if (err) {
      toast.error('載入失敗：' + err.message, { duration: 6000 })
      setLoading(false)
      return
    }

    const projectList = data || []
    const projectIds = projectList.map(p => p.id)

    if (projectIds.length === 0) {
      setProjects([])
      setLoading(false)
      return
    }

    const [{ data: quotes }, { data: stages }, { data: invs }] = await Promise.all([
      supabase.from('quotations').select('project_id, status').in('project_id', projectIds).neq('status', '已刪除'),
      supabase.from('payment_stages').select('id, project_id').in('project_id', projectIds),
      supabase.from('invoices').select('project_id, payment_stage_id, status').in('project_id', projectIds),
    ])

    const quotesByProject = groupQuotationsByProject(quotes || [])
    const stagesByProject = groupStagesByProject(stages || [])
    const invsByProject = groupInvoicesByProject(invs || [])

    setProjects(projectList.map(p => enrichProjectWithSummaries(
      p,
      quotesByProject.get(p.id) ?? [],
      stagesByProject.get(p.id) ?? [],
      invsByProject.get(p.id) ?? [],
    )))
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, []) // eslint-disable-line

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id)
    if (error) {
      toast.error('更新失敗：' + error.message, { duration: 6000 })
      return
    }
    toast.success(`狀態已更新為【${newStatus}】`)
    fetchProjects()
  }

  const requestStartWork = (project) => {
    setActionMenuId(null)
    if (needsStartWorkConfirmation(project.quotations ?? [])) {
      setProjectToStart(project)
      setShowStartDialog(true)
      return
    }
    updateStatus(project.id, '已開工')
  }

  const handleStartCancel = () => {
    setShowStartDialog(false)
    setProjectToStart(null)
  }

  const handleStartConfirm = async () => {
    if (!projectToStart) return
    const projectId = projectToStart.id
    setShowStartDialog(false)
    setProjectToStart(null)

    try {
      await applyStartProjectWork(supabase, projectId)
      toast.success('狀態已更新為【已開工】')
      fetchProjects()
    } catch (err) {
      toast.error('更新失敗：' + err.message, { duration: 6000 })
    }
  }

  const handleDelete = (project) => {
    setActionMenuId(null)
    setProjectToDelete(project)
    setShowDeleteDialog(true)
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setProjectToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return
    setShowDeleteDialog(false)
    try {
      await deleteProjectById(supabase, projectToDelete.id)
      toast.success('已刪除')
      setProjectToDelete(null)
      fetchProjects()
    } catch (err) {
      toast.error('刪除失敗：' + err.message, { duration: 6000 })
    }
  }

  const matchesSearch = (p) =>
    (p.land_section || '').includes(search) ||
    (p.name || '').includes(search) ||
    (p.clients?.company_name || '').includes(search)

  const poolProjects = projects.filter(p => {
    const matchStatus =
      statusFilter === '全部'
        ? showCompleted || p.status !== '完工'
        : p.status === statusFilter
    return matchStatus
  })

  const filtered = poolProjects.filter(matchesSearch)

  const listSummary = (() => {
    if (loading) return null
    const hasFilters = search.trim() !== '' || statusFilter !== '全部'
    if (filtered.length === 0) {
      return projects.length === 0
        ? '尚無案件，建立第一個案件開始吧'
        : '找不到符合條件的案件'
    }
    const totalSuffix = hasFilters && filtered.length !== poolProjects.length ? ` / ${poolProjects.length}` : ''
    return `共 ${filtered.length}${totalSuffix} 筆`
  })()

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={open => {
          if (!open) handleDeleteCancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除案件</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{projectToDelete ? projectPrimaryLabel(projectToDelete) : ''}」嗎？相關報價單也會一併刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showStartDialog}
        onOpenChange={open => {
          if (!open) handleStartCancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>開始進行案件</AlertDialogTitle>
            <AlertDialogDescription>
              「{projectToStart ? projectPrimaryLabel(projectToStart) : ''}」— 客戶是否已回傳報價確認？
              已回傳可直接開工；若尚未回傳，請先完成報價確認後再開工。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>尚未回傳</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartConfirm}>
              已回傳，案件開工
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppShellHeader>
        <AppBrandTitle subtitle={user?.email} showVersion />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
            <IconTooltip label="縮小字體">
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold"
                onClick={() => setFontSize(baseFontSize - 1)}
                aria-label="縮小字體"
              >
                A-
              </Button>
            </IconTooltip>
            <span className="min-w-[36px] px-1.5 text-center font-mono text-foreground">
              {baseFontSize}px
            </span>
            <IconTooltip label="放大字體">
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold"
                onClick={() => setFontSize(baseFontSize + 1)}
                aria-label="放大字體"
              >
                A+
              </Button>
            </IconTooltip>
          </div>
          <div className="flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5">
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger
                size="sm"
                className="h-7 min-w-[11rem] max-w-[12rem] gap-1 border-0 bg-transparent px-1.5 font-semibold shadow-none focus-visible:ring-2"
                aria-label="切換主題色彩"
              >
                <Palette className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{getThemeLabel(theme)}</span>
              </SelectTrigger>
              <SelectContent align="end" side="bottom" alignItemWithTrigger={false}>
                {APP_THEMES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <IconTooltip label="管理介面">
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold"
              onClick={() => navigate('/admin/clients')}
              aria-label="管理介面"
            >
              管理
            </Button>
          </IconTooltip>
          <IconTooltip label="登出">
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold"
              onClick={signOut}
              aria-label="登出"
            >
              登出
            </Button>
          </IconTooltip>
        </div>
      </AppShellHeader>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24 sm:pb-6 md:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">案件列表</h1>
          {listSummary && (
            <p className="mt-1 text-sm text-muted-foreground">{listSummary}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="h-11 flex-1 bg-card sm:max-w-md">
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋地號、案件名稱、客戶名稱…"
              aria-label="搜尋案件"
            />
          </InputGroup>
          <Button
            variant="default"
            size="md"
            className="hidden h-11 shrink-0 px-5 font-semibold sm:inline-flex"
            onClick={() => navigate('/projects/new')}
            aria-label="新增案件"
          >
            <Plus data-icon="inline-start" />
            新增案件
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(values) => {
              setStatusFilter(values[0] ?? '全部')
            }}
            variant="outline"
            size="sm"
            className="flex-wrap"
          >
            {STATUS_FILTERS.map(f => (
              <ToggleGroupItem key={f} value={f} className="rounded-full px-4">
                {f}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Field orientation="horizontal" className="w-auto items-center gap-3">
            <FieldLabel htmlFor="completedToggle" className="cursor-pointer">
              顯示已完工
            </FieldLabel>
            <Switch
              id="completedToggle"
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
          </Field>
        </div>

        {loading ? (
          <DashboardQuotationsSkeleton />
        ) : filtered.length === 0 ? (
          <AppEmptyState
            icon={FolderKanban}
            title={projects.length === 0 ? '尚無案件' : '找不到符合條件的案件'}
            description={
              projects.length === 0
                ? '建立第一個案件，開始管理報價與後續發票'
                : '試試調整搜尋或篩選條件'
            }
            action={
              projects.length === 0 ? (
                <Button
                  variant="default"
                  size="md"
                  className="font-semibold"
                  onClick={() => navigate('/projects/new')}
                >
                  建立第一個案件
                </Button>
              ) : null
            }
            className="shadow-sm"
          />
        ) : (
          <div className="space-y-4">
            <div className="block space-y-3 md:hidden">
              {filtered.map(p => (
                <Card
                  key={p.id}
                  size="sm"
                  className="cursor-pointer gap-0 py-0 shadow-sm transition-all hover:ring-muted-foreground/30"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <CardContent className="space-y-3 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {displayLandSection(p)}
                        </p>
                        {p.name?.trim() && (
                          <p className="truncate text-xs text-muted-foreground">{displayProjectName(p)}</p>
                        )}
                      </div>
                    </div>
                    <ProjectSummaryBadges
                      workStatus={p.status}
                      quotationSummary={p.quotationSummary}
                      billingSummary={p.billingSummary}
                    />
                    <div className="text-sm text-muted-foreground">{p.clients?.company_name || '—'}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatRocDate(p.updated_at?.slice(0, 10))}</span>
                      <span className="font-semibold text-foreground">{fmt(p.total_amount)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="hidden gap-0 py-0 shadow-sm md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">地號</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">案件名稱</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">客戶名稱</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">金額</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">案件狀態</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">報價狀態</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">請款狀態</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">更新日期</TableHead>
                    <TableHead className="h-auto p-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer border-border hover:bg-muted/30"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <TableCell className="p-4 font-medium text-foreground">{displayLandSection(p)}</TableCell>
                      <TableCell className="p-4 text-muted-foreground">{displayProjectName(p)}</TableCell>
                      <TableCell className="p-4 text-muted-foreground">{p.clients?.company_name || '—'}</TableCell>
                      <TableCell className="p-4 font-semibold text-foreground">{fmt(p.total_amount)}</TableCell>
                      <TableCell className="p-4" onClick={e => e.stopPropagation()}>
                        <ProjectStatusBadges status={p.status} />
                      </TableCell>
                      <TableCell className="p-4" onClick={e => e.stopPropagation()}>
                        <QuotationSummaryBadges status={p.quotationSummary} />
                      </TableCell>
                      <TableCell className="p-4" onClick={e => e.stopPropagation()}>
                        <BillingSummaryBadges status={p.billingSummary} />
                      </TableCell>
                      <TableCell className="p-4 text-muted-foreground">{formatRocDate(p.updated_at?.slice(0, 10))}</TableCell>
                      <TableCell className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu
                          open={actionMenuId === p.id}
                          onOpenChange={open => {
                            if (open) setActionMenuId(p.id)
                            else setActionMenuId(null)
                          }}
                        >
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="操作"
                                title="操作"
                                onClick={e => e.stopPropagation()}
                              >
                                <MoreHorizontal className="size-4 shrink-0" aria-hidden="true" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="min-w-[140px]">
                            {hasProjectStatusActions(p.status) && (
                              <DropdownMenuGroup>
                                {p.status === '未開工' && (
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation()
                                      requestStartWork(p)
                                    }}
                                  >
                                    <Play />
                                    開工
                                  </DropdownMenuItem>
                                )}
                                {p.status === '已開工' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={e => {
                                        e.stopPropagation()
                                        updateStatus(p.id, '暫停')
                                      }}
                                    >
                                      <Pause />
                                      暫停
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={e => {
                                        e.stopPropagation()
                                        updateStatus(p.id, '完工')
                                      }}
                                    >
                                      標記完工
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {p.status === '暫停' && (
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation()
                                      updateStatus(p.id, '已開工')
                                    }}
                                  >
                                    <Play />
                                    恢復進行
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuGroup>
                            )}
                            {hasProjectStatusActions(p.status) && <DropdownMenuSeparator />}
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={e => {
                                  e.stopPropagation()
                                  handleDelete(p)
                                }}
                              >
                                <Trash2 />
                                刪除
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </main>

      {!loading && (
        <div className="fixed bottom-6 right-6 z-40 sm:hidden">
          <IconTooltip label="新增案件" side="left">
            <Button
              variant="default"
              size="icon-lg"
              className="size-14 rounded-full shadow-lg"
              onClick={() => navigate('/projects/new')}
              aria-label="新增案件"
            >
              <Plus className="size-6" aria-hidden="true" />
            </Button>
          </IconTooltip>
        </div>
      )}
    </div>
  )
}
