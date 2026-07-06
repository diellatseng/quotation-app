// src/pages/DashboardPage.jsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useAppearance } from '../context/AppearanceContext'
import { APP_THEMES } from '@/lib/themes'
import { toast } from 'sonner'
import { deleteProjectById } from '../lib/deleteProject'
import { applyStartProjectWork, needsStartWorkConfirmation } from '../lib/startProjectWork'
import { projectPrimaryLabel } from '../lib/projectDisplay'
import { filterProjectsByStatus } from '@/lib/projectFilters'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import ProjectsDataTable from './dashboard/projects-data-table'
import ProjectStatusFilterPills from './dashboard/project-status-filter-pills'
import {
  DATA_TABLE_TOOLBAR_BUTTON_SIZE,
  dataTableToolbarButtonClassName,
} from '@/components/data-table/toolbar-styles'
import { FolderKanban, Palette, Plus, Settings } from 'lucide-react'

export default function DashboardPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
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
        id, marketing_name, land_section, status, total_amount, tax_included, updated_at,
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

  const poolProjects = useMemo(
    () => filterProjectsByStatus(projects, { statusFilter, showCompleted }),
    [projects, statusFilter, showCompleted],
  )

  const updateStatus = useCallback(async (id, newStatus) => {
    setActionMenuId(null)
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', id)
    if (error) {
      toast.error('更新失敗：' + error.message, { duration: 6000 })
      return
    }
    toast.success(`狀態已更新為【${newStatus}】`)
    fetchProjects()
  }, [])

  const requestStartWork = useCallback((project) => {
    setActionMenuId(null)
    setProjectToStart(project)
    setShowStartDialog(true)
  }, [])

  const handleStartCancel = () => {
    setShowStartDialog(false)
    setProjectToStart(null)
  }

  const handleStartConfirm = async () => {
    if (!projectToStart) return
    const projectId = projectToStart.id
    const quotations = projectToStart.quotations ?? []
    setShowStartDialog(false)
    setProjectToStart(null)

    try {
      if (needsStartWorkConfirmation(quotations)) {
        await applyStartProjectWork(supabase, projectId)
      } else {
        const { error } = await supabase
          .from('projects')
          .update({ status: '已開工' })
          .eq('id', projectId)
        if (error) throw error
      }
      toast.success('狀態已更新為【已開工】')
      fetchProjects()
    } catch (err) {
      toast.error('更新失敗：' + err.message, { duration: 6000 })
    }
  }

  const handleDelete = useCallback((project) => {
    setActionMenuId(null)
    setProjectToDelete(project)
    setShowDeleteDialog(true)
  }, [])

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

  const handleRowClick = useCallback((project) => {
    navigate(`/projects/${project.id}`)
  }, [navigate])

  const statusFilters = (
    <ProjectStatusFilterPills
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      showCompleted={showCompleted}
      onShowCompletedChange={setShowCompleted}
    />
  )

  const toolbarActions = (
    <Button
      variant="default"
      size={DATA_TABLE_TOOLBAR_BUTTON_SIZE}
      className={`hidden shrink-0 sm:inline-flex ${dataTableToolbarButtonClassName}`}
      onClick={() => navigate('/projects/new')}
      aria-label="新增案件"
    >
      <Plus data-icon="inline-start" />
      新增案件
    </Button>
  )

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
            <AlertDialogTitle>案件開工</AlertDialogTitle>
            <AlertDialogDescription>
              確定要將「{projectToStart ? projectPrimaryLabel(projectToStart) : ''}」的案件狀態改為【已開工】嗎？
              {projectToStart && needsStartWorkConfirmation(projectToStart.quotations ?? []) && (
                <> 此案件有已報價但尚未確認的報價單；若客戶已回傳確認，開工時將一併將報價標記為【已確認】。</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartConfirm}>
              確認開工
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
                variant="shell"
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
                variant="shell"
                size="sm"
                className="font-semibold"
                onClick={() => setFontSize(baseFontSize + 1)}
                aria-label="放大字體"
              >
                A+
              </Button>
            </IconTooltip>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="shell"
                  size="sm"
                  className="font-semibold"
                  aria-label="設定"
                >
                  <Settings data-icon="inline-start" />
                  設定
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate('/admin/clients')}>
                  管理資料庫
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette />
                    佈景主題
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                      {APP_THEMES.map(({ value, label }) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                          {label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <IconTooltip label="登出">
            <Button
              variant="shell"
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
        </div>

        {loading ? (
          <DashboardQuotationsSkeleton />
        ) : projects.length === 0 ? (
          <AppEmptyState
            icon={FolderKanban}
            title="尚無案件"
            description="建立第一個案件，開始管理報價與後續發票"
            action={(
              <Button
                variant="default"
                size="md"
                className="font-semibold"
                onClick={() => navigate('/projects/new')}
              >
                建立第一個案件
              </Button>
            )}
            className="shadow-sm"
          />
        ) : (
          <ProjectsDataTable
            projects={poolProjects}
            onRowClick={handleRowClick}
            filters={statusFilters}
            toolbarActions={toolbarActions}
            actionMenuId={actionMenuId}
            setActionMenuId={setActionMenuId}
            onStartWork={requestStartWork}
            onUpdateStatus={updateStatus}
            onDelete={handleDelete}
            emptyMessage={
              poolProjects.length === 0
                ? '目前篩選條件下沒有案件，試試調整狀態篩選或開啟「顯示已完工」'
                : '找不到符合的案件，請調整搜尋條件'
            }
          />
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
