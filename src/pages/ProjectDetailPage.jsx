// src/pages/ProjectDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { formatRocDate } from '../lib/rocDate'
import { FEATURE_NEGOTIATION, FEATURE_VERSIONING } from '../lib/featureFlags'
import { ProjectStatusBadges, QuotationStatusBadges, Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AppEmptyState } from '@/components/AppEmptyState'
import { AppBreadcrumbBar } from '@/components/AppShellHeader'
import { QuotationDetailSkeleton } from '@/components/skeletons'
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
import { Eye, FileText, Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { deleteProjectById } from '@/lib/deleteProject'
import {
  displayLandSection,
  displayProjectName,
  projectPrimaryLabel,
  projectSecondaryLabel,
} from '@/lib/projectDisplay'

const fmt = (n) => (n != null && n !== '' ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—')

const OVERVIEW_FIELDS = [
  { key: 'building_permit', label: '建照號碼' },
  { key: 'project_owner', label: '起造人' },
  { key: 'project_scale', label: '工程規模' },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [project, setProject] = useState(null)
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const activeTab = searchParams.get('tab') || 'overview'

  const setActiveTab = (tab) => {
    setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select(`
          *,
          clients(company_name, address, phone),
          contact_persons(name, mobile, email)
        `)
        .eq('id', id)
        .single()

      if (projErr) throw projErr
      setProject(proj)

      const { data: quotes, error: qErr } = await supabase
        .from('quotations')
        .select(`
          id, quote_number, version, status, is_negotiating,
          quote_date, fee_amount, created_at
        `)
        .eq('project_id', id)
        .neq('status', '已刪除')
        .order('created_at', { ascending: false })

      if (qErr) throw qErr
      setQuotations(quotes || [])
    } catch (err) {
      toast.error('載入失敗：' + err.message, { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id]) // eslint-disable-line

  const updateProjectStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      toast.success(`專案狀態已更新為【${newStatus}】`)
      fetchData()
    } catch (err) {
      toast.error('更新失敗：' + err.message, { duration: 6000 })
    }
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false)
    try {
      await deleteProjectById(supabase, id)
      toast.success('已刪除')
      navigate('/dashboard')
    } catch (err) {
      toast.error('刪除失敗：' + err.message, { duration: 6000 })
    }
  }

  if (loading) {
    return <QuotationDetailSkeleton />
  }

  if (!project || project.status === '已刪除') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AppBreadcrumbBar backTo="/dashboard" segments={['找不到專案']} />
        <main className="mx-auto max-w-7xl px-4 py-12 text-center md:px-8">
          <p className="text-sm font-medium text-muted-foreground">找不到該專案</p>
        </main>
      </div>
    )
  }

  const taxNote = project.tax_included ? '（含稅）' : '（未稅）'
  const secondaryName = projectSecondaryLabel(project)

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground transition-colors duration-200">
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除專案</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{projectPrimaryLabel(project)}」嗎？相關報價單也會一併刪除。
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

      <AppBreadcrumbBar
        backTo="/dashboard"
        segments={[
          <span key="project" className="inline-flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate">{projectPrimaryLabel(project)}</span>
            {secondaryName && (
              <span className="truncate text-sm font-normal text-muted-foreground">{secondaryName}</span>
            )}
            <ProjectStatusBadges status={project.status} />
          </span>,
        ]}
        actions={
          <>
            {project.status === '草稿' && quotations.some(q => q.status === '草稿') && (
              <Button
                variant="outline"
                size="sm"
                className="font-semibold"
                onClick={() => {
                  const draft = quotations.find(q => q.status === '草稿')
                  if (draft) navigate(`/quotation/new?edit=${draft.id}`)
                }}
              >
                <Pencil data-icon="inline-start" />
                編輯草稿
              </Button>
            )}
            {(project.status === '已報價' || project.status === '已確認報價') && (
              <Button
                variant="outline"
                size="sm"
                className="font-semibold"
                onClick={() => updateProjectStatus('進行中')}
              >
                開工
              </Button>
            )}
            {project.status === '進行中' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                  onClick={() => updateProjectStatus('暫停')}
                >
                  暫停
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="font-semibold"
                  onClick={() => updateProjectStatus('完工')}
                >
                  標記完工
                </Button>
              </>
            )}
            {project.status === '暫停' && (
              <Button
                variant="default"
                size="sm"
                className="font-semibold"
                onClick={() => updateProjectStatus('進行中')}
              >
                恢復進行
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              className="font-semibold"
              onClick={() => navigate(`/quotation/new?project=${id}`)}
            >
              <Plus data-icon="inline-start" />
              新增報價
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-semibold text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 data-icon="inline-start" />
              刪除
            </Button>
          </>
        }
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="line" className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-none px-4 py-2">
              概覽
            </TabsTrigger>
            <TabsTrigger value="quotations" className="rounded-none px-4 py-2">
              報價
              {quotations.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 font-mono text-[10px]">
                  {quotations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invoices" className="rounded-none px-4 py-2">
              發票
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">客戶資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">公司名稱</span>
                    <p className="font-medium text-foreground">{project.clients?.company_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">聯絡人</span>
                    <p className="font-medium text-foreground">
                      {project.contact_persons?.name || '—'}
                      {project.contact_persons?.mobile ? ` · ${project.contact_persons.mobile}` : ''}
                    </p>
                  </div>
                  {project.clients?.address && (
                    <div>
                      <span className="text-muted-foreground">地址</span>
                      <p className="font-medium text-foreground">{project.clients.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">專案摘要</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">地號</span>
                    <p className="font-medium text-foreground">{displayLandSection(project)}</p>
                  </div>
                  {project.name?.trim() && (
                    <div>
                      <span className="text-muted-foreground">專案名稱</span>
                      <p className="font-medium text-foreground">{displayProjectName(project)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">合約金額</span>
                    <p className="text-lg font-semibold text-foreground">
                      {fmt(project.total_amount)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">{taxNote}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">建立日期</span>
                    <p className="font-medium text-foreground">{formatRocDate(project.created_at?.slice(0, 10))}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">最後更新</span>
                    <p className="font-medium text-foreground">{formatRocDate(project.updated_at?.slice(0, 10))}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {OVERVIEW_FIELDS.some(({ key }) => project[key]) && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">工程資料</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {OVERVIEW_FIELDS.filter(({ key }) => project[key]).map(({ key, label }) => (
                      <div key={key}>
                        <dt className="text-sm text-muted-foreground">{label}</dt>
                        <dd className="mt-0.5 font-medium text-foreground">{project[key]}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quotations" className="mt-6">
            {quotations.length === 0 ? (
              <AppEmptyState
                icon={FileText}
                title="尚無報價單"
                description="建立第一份報價以記錄此專案的報價內容"
                action={
                  <Button
                    variant="default"
                    size="md"
                    className="font-semibold"
                    onClick={() => navigate(`/quotation/new?project=${id}`)}
                  >
                    建立報價
                  </Button>
                }
                className="shadow-sm"
              />
            ) : (
              <>
                <div className="mb-4 block md:hidden space-y-3">
                  {quotations.map(q => (
                    <Card
                      key={q.id}
                      size="sm"
                      className="cursor-pointer gap-0 py-0 shadow-sm transition-all hover:ring-muted-foreground/30"
                      onClick={() =>
                        q.status === '草稿'
                          ? navigate(`/quotation/new?edit=${q.id}`)
                          : navigate(`/quotation/${q.id}`)
                      }
                    >
                      <CardContent className="space-y-3 py-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="font-mono font-medium">
                            {q.quote_number}
                            {FEATURE_VERSIONING && q.version > 1 ? ` v${q.version}` : ''}
                          </Badge>
                          <QuotationStatusBadges
                            status={q.status}
                            isNegotiating={FEATURE_NEGOTIATION && q.is_negotiating}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatRocDate(q.quote_date)}</span>
                          <span className="font-semibold text-foreground">{fmt(q.fee_amount)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="hidden gap-0 py-0 shadow-sm md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">報價編號</TableHead>
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">報價日期</TableHead>
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">金額</TableHead>
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">狀態</TableHead>
                        <TableHead className="h-auto p-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map(q => (
                        <TableRow
                          key={q.id}
                          className="cursor-pointer border-border hover:bg-muted/30"
                          onClick={() =>
                            q.status === '草稿'
                              ? navigate(`/quotation/new?edit=${q.id}`)
                              : navigate(`/quotation/${q.id}`)
                          }
                        >
                          <TableCell className="p-4">
                            <Badge variant="secondary" className="font-mono font-medium">
                              {q.quote_number}
                              {FEATURE_VERSIONING && q.version > 1 ? ` v${q.version}` : ''}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-4 text-muted-foreground">{formatRocDate(q.quote_date)}</TableCell>
                          <TableCell className="p-4 font-semibold text-foreground">{fmt(q.fee_amount)}</TableCell>
                          <TableCell className="p-4">
                            <QuotationStatusBadges
                              status={q.status}
                              isNegotiating={FEATURE_NEGOTIATION && q.is_negotiating}
                            />
                          </TableCell>
                          <TableCell className="p-4 text-right">
                            {q.status === '草稿' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="font-semibold"
                                onClick={e => {
                                  e.stopPropagation()
                                  navigate(`/quotation/new?edit=${q.id}`)
                                }}
                              >
                                <Pencil data-icon="inline-start" />
                                編輯
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="font-semibold"
                                onClick={e => {
                                  e.stopPropagation()
                                  navigate(`/quotation/${q.id}`)
                                }}
                              >
                                <Eye data-icon="inline-start" />
                                檢視
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <AppEmptyState
              icon={Receipt}
              title="發票模組即將推出"
              description="將依付款階段管理請款與收款紀錄"
              className="shadow-sm"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
