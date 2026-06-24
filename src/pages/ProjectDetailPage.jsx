// src/pages/ProjectDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { formatRocDate, todayCe } from '../lib/rocDate'
import ROCDateInput from '../components/ROCDateInput'
import { FEATURE_NEGOTIATION, FEATURE_VERSIONING } from '../lib/featureFlags'
import { ProjectStatusBadges, QuotationStatusBadges, InvoiceStatusBadges, Badge } from '@/components/ui/badge'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import DisbursementDialog from '@/components/DisbursementDialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, Eye, FileText, MoreHorizontal, Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { deleteProjectById } from '@/lib/deleteProject'
import { groupDisbursementsByStage, sumDisbursements } from '@/lib/disbursements'
import { suggestReturnedDocuments } from '@/lib/invoiceDocument'
import { applyStartProjectWork, needsStartWorkConfirmation } from '@/lib/startProjectWork'
import {
  displayLandSection,
  displayProjectName,
  projectPrimaryLabel,
  projectSecondaryLabel,
} from '@/lib/projectDisplay'

const fmt = (n) => (n != null && n !== '' ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—')

const emptyInvoiceForm = () => ({
  invoice_number: '',
  invoiced_at: todayCe(),
  notes: '',
  returned_documents: '',
})

function buildInvoiceRows(stages, invoiceList, disbursementMap) {
  const byStage = new Map(invoiceList.map(inv => [inv.payment_stage_id, inv]))
  return stages.map(stage => {
    const disbursements = disbursementMap.get(stage.id) ?? []
    return {
      stage,
      invoice: byStage.get(stage.id) ?? null,
      disbursements,
      disbursementTotal: sumDisbursements(disbursements),
    }
  })
}

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
  const [paymentStages, setPaymentStages] = useState([])
  const [invoices, setInvoices] = useState([])
  const [disbursements, setDisbursements] = useState([])
  const [disbursementStage, setDisbursementStage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [invoiceDialog, setInvoiceDialog] = useState(null)
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm())
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [invoiceToReceive, setInvoiceToReceive] = useState(null)
  const [invoiceToDelete, setInvoiceToDelete] = useState(null)
  const [quotationToDelete, setQuotationToDelete] = useState(null)
  const { user } = useAuth()
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

      const { data: stages, error: stErr } = await supabase
        .from('payment_stages')
        .select('id, stage_name, percentage, amount, sort_order')
        .eq('project_id', id)
        .order('sort_order', { ascending: true })

      if (stErr) throw stErr
      setPaymentStages(stages || [])

      const { data: invs, error: invErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true })

      if (invErr) throw invErr
      setInvoices(invs || [])

      const stageIds = (stages || []).map(s => s.id)
      if (stageIds.length > 0) {
        const { data: disbs, error: disbErr } = await supabase
          .from('disbursements')
          .select('id, payment_stage_id, name, amount, is_preset')
          .in('payment_stage_id', stageIds)
          .order('created_at', { ascending: true })

        if (disbErr) throw disbErr
        setDisbursements(disbs || [])
      } else {
        setDisbursements([])
      }
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

  const requestStartWork = () => {
    if (needsStartWorkConfirmation(project.status)) {
      setShowStartDialog(true)
      return
    }
    updateProjectStatus('進行中')
  }

  const handleStartCancel = () => {
    setShowStartDialog(false)
  }

  const handleStartConfirm = async () => {
    setShowStartDialog(false)
    try {
      await applyStartProjectWork(supabase, id)
      toast.success('專案狀態已更新為【進行中】')
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

  const handleQuotationDeleteConfirm = async () => {
    if (!quotationToDelete) return
    const quotationId = quotationToDelete
    setQuotationToDelete(null)
    try {
      const { error } = await supabase
        .from('quotations')
        .update({ status: '已刪除' })
        .eq('id', quotationId)
      if (error) throw error
      toast.success('已刪除')
      fetchData()
    } catch (err) {
      toast.error('刪除失敗：' + err.message, { duration: 6000 })
    }
  }

  const openCreateInvoice = (stage) => {
    const stageDisbs = groupDisbursementsByStage(disbursements).get(stage.id) ?? []
    setInvoiceForm({
      ...emptyInvoiceForm(),
      returned_documents: suggestReturnedDocuments(stageDisbs).join('\n'),
    })
    setInvoiceDialog({ mode: 'create', stage })
  }

  const openEditInvoice = (stage, invoice) => {
    setInvoiceForm({
      invoice_number: invoice.invoice_number || '',
      invoiced_at: invoice.invoiced_at || todayCe(),
      notes: invoice.notes || '',
      returned_documents: invoice.returned_documents || '',
    })
    setInvoiceDialog({ mode: 'edit', stage, invoice })
  }

  const closeInvoiceDialog = () => {
    setInvoiceDialog(null)
    setInvoiceForm(emptyInvoiceForm())
  }

  const saveInvoice = async () => {
    if (!invoiceDialog) return
    setInvoiceSaving(true)
    try {
      const payload = {
        invoice_number: invoiceForm.invoice_number.trim() || null,
        invoiced_at: invoiceForm.invoiced_at || todayCe(),
        notes: invoiceForm.notes.trim() || null,
        returned_documents: invoiceForm.returned_documents.trim() || null,
      }

      if (invoiceDialog.mode === 'create') {
        const { error } = await supabase.from('invoices').insert([{
          project_id: id,
          payment_stage_id: invoiceDialog.stage.id,
          status: '已請款',
          created_by: user?.id || null,
          ...payload,
        }])
        if (error) throw error
        toast.success('已建立請款紀錄')
      } else {
        const { error } = await supabase
          .from('invoices')
          .update(payload)
          .eq('id', invoiceDialog.invoice.id)
        if (error) throw error
        toast.success('發票資料已更新')
      }

      closeInvoiceDialog()
      fetchData()
    } catch (err) {
      toast.error('儲存失敗：' + err.message, { duration: 6000 })
    } finally {
      setInvoiceSaving(false)
    }
  }

  const confirmReceiveInvoice = async () => {
    if (!invoiceToReceive) return
    const invoiceId = invoiceToReceive.id
    setInvoiceToReceive(null)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: '已收款', received_at: todayCe() })
        .eq('id', invoiceId)
      if (error) throw error
      toast.success('已標記為已收款')
      fetchData()
    } catch (err) {
      toast.error('更新失敗：' + err.message, { duration: 6000 })
    }
  }

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return
    const invoiceId = invoiceToDelete.id
    setInvoiceToDelete(null)
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
      if (error) throw error
      toast.success('已刪除請款紀錄')
      fetchData()
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
  const disbursementMap = groupDisbursementsByStage(disbursements)
  const invoiceRows = buildInvoiceRows(paymentStages, invoices, disbursementMap)
  const receivedCount = invoices.filter(inv => inv.status === '已收款').length
  const disbursementGrandTotal = sumDisbursements(disbursements)

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

      <AlertDialog
        open={showStartDialog}
        onOpenChange={open => {
          if (!open) handleStartCancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>開始進行專案</AlertDialogTitle>
            <AlertDialogDescription>
              「{projectPrimaryLabel(project)}」— 客戶是否已回傳報價確認？
              已回傳可直接開工（略過「已確認報價」）；若尚未回傳，請先完成報價確認後再開工。
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

      <AlertDialog
        open={!!quotationToDelete}
        onOpenChange={open => {
          if (!open) setQuotationToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除報價單</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此報價單嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleQuotationDeleteConfirm}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!invoiceToReceive}
        onOpenChange={open => {
          if (!open) setInvoiceToReceive(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>標記已收款</AlertDialogTitle>
            <AlertDialogDescription>
              確定「{invoiceToReceive?.invoice_number || '此筆請款'}」已收到款項？
              收款日期將記錄為今天。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReceiveInvoice}>
              確認已收款
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!invoiceToDelete}
        onOpenChange={open => {
          if (!open) setInvoiceToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除請款紀錄</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此筆請款紀錄嗎？刪除後可重新為該付款階段建立請款。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeleteInvoice}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!invoiceDialog}
        onOpenChange={open => {
          if (!open) closeInvoiceDialog()
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle>
              {invoiceDialog?.mode === 'create' ? '建立請款' : '編輯請款'}
            </DialogTitle>
            <DialogDescription>
              {invoiceDialog?.stage?.stage_name} · {fmt(invoiceDialog?.stage?.amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="invoice_number">發票／請款編號</FieldLabel>
                <Input
                  id="invoice_number"
                  value={invoiceForm.invoice_number}
                  onChange={e => setInvoiceForm(f => ({ ...f, invoice_number: e.target.value }))}
                  placeholder="選填"
                />
              </Field>
              <ROCDateInput
                id="invoiced_at"
                label="請款日期"
                value={invoiceForm.invoiced_at}
                onChange={value => setInvoiceForm(f => ({ ...f, invoiced_at: value }))}
                useRoc
              />
              <Field>
                <FieldLabel htmlFor="invoice_returned_documents">檢還文件</FieldLabel>
                <Textarea
                  id="invoice_returned_documents"
                  value={invoiceForm.returned_documents}
                  onChange={e => setInvoiceForm(f => ({ ...f, returned_documents: e.target.value }))}
                  placeholder="每行一項，例：空污費收據*1"
                  rows={4}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invoice_notes">備註</FieldLabel>
                <Textarea
                  id="invoice_notes"
                  value={invoiceForm.notes}
                  onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="選填"
                  rows={3}
                />
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter className="border-t border-border px-5 py-3">
            <Button variant="outline" size="sm" className="font-semibold" onClick={closeInvoiceDialog}>
              取消
            </Button>
            <Button
              variant="default"
              size="sm"
              className="font-semibold"
              onClick={saveInvoice}
              disabled={invoiceSaving}
            >
              {invoiceSaving ? '儲存中…' : '儲存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DisbursementDialog
        open={!!disbursementStage}
        stage={disbursementStage}
        onOpenChange={open => {
          if (!open) setDisbursementStage(null)
        }}
        onSaved={fetchData}
      />

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
                onClick={requestStartWork}
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
              {invoices.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 font-mono text-[10px]">
                  {receivedCount}/{invoices.length}
                </Badge>
              )}
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
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="font-mono font-medium">
                            {q.quote_number}
                            {FEATURE_VERSIONING && q.version > 1 ? ` v${q.version}` : ''}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <QuotationStatusBadges
                              status={q.status}
                              isNegotiating={FEATURE_NEGOTIATION && q.is_negotiating}
                            />
                            <span onClick={e => e.stopPropagation()}>
                              <QuotationActionsMenu
                                quotation={q}
                                onDelete={setQuotationToDelete}
                              />
                            </span>
                          </div>
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
                          <TableCell className="p-4 text-right" onClick={e => e.stopPropagation()}>
                            <QuotationActionsMenu
                              quotation={q}
                              onDelete={setQuotationToDelete}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6 space-y-4">
            {paymentStages.length === 0 ? (
              <AppEmptyState
                icon={Receipt}
                title="尚無付款階段"
                description="請先完成報價並設定付款階段，才能建立請款紀錄"
                action={
                  quotations.length > 0 ? (
                    <Button
                      variant="default"
                      size="md"
                      className="font-semibold"
                      onClick={() => setActiveTab('quotations')}
                    >
                      查看報價
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="md"
                      className="font-semibold"
                      onClick={() => navigate(`/quotation/new?project=${id}`)}
                    >
                      建立報價
                    </Button>
                  )
                }
                className="shadow-sm"
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  共 {paymentStages.length} 個付款階段 · 已請款 {invoices.length} 筆 · 已收款 {receivedCount} 筆
                  {disbursementGrandTotal > 0 && ` · 代墊合計 ${fmt(disbursementGrandTotal)}`}
                </p>

                <div className="block space-y-3 md:hidden">
                  {invoiceRows.map(({ stage, invoice, disbursements: stageDisbs, disbursementTotal }) => (
                    <Card key={stage.id} size="sm" className="gap-0 py-0 shadow-sm">
                      <CardContent className="space-y-3 py-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{stage.stage_name}</p>
                            <p className="text-sm text-muted-foreground">{stage.percentage}% · {fmt(stage.amount)}</p>
                          </div>
                          {invoice ? (
                            <InvoiceStatusBadges status={invoice.status} />
                          ) : (
                            <Badge variant="outline" className="rounded-full">未請款</Badge>
                          )}
                        </div>
                        {invoice && (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>編號：{invoice.invoice_number || '—'}</p>
                            <p>請款：{formatRocDate(invoice.invoiced_at) || '—'}</p>
                            {invoice.received_at && (
                              <p>收款：{formatRocDate(invoice.received_at)}</p>
                            )}
                          </div>
                        )}
                        {disbursementTotal > 0 && (
                          <p className="text-xs text-muted-foreground">
                            代墊 {stageDisbs.length} 項 · {fmt(disbursementTotal)}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="font-semibold"
                            onClick={() => setDisbursementStage(stage)}
                          >
                            代墊明細
                          </Button>
                          {!invoice ? (
                            <Button
                              variant="default"
                              size="sm"
                              className="font-semibold"
                              onClick={() => openCreateInvoice(stage)}
                            >
                              <Plus data-icon="inline-start" />
                              建立請款
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="font-semibold"
                                onClick={() => navigate(`/projects/${id}/invoices/${invoice.id}`)}
                              >
                                <Eye data-icon="inline-start" />
                                檢視
                              </Button>
                              {invoice.status === '已請款' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="font-semibold"
                                    onClick={() => openEditInvoice(stage, invoice)}
                                  >
                                    <Pencil data-icon="inline-start" />
                                    編輯
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="font-semibold"
                                    onClick={() => setInvoiceToReceive(invoice)}
                                  >
                                    <Check data-icon="inline-start" />
                                    已收款
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="font-semibold text-destructive hover:text-destructive"
                                    onClick={() => setInvoiceToDelete(invoice)}
                                  >
                                    <Trash2 data-icon="inline-start" />
                                    刪除
                                  </Button>
                                </>
                              )}
                              {invoice.status === '已收款' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="font-semibold"
                                  onClick={() => openEditInvoice(stage, invoice)}
                                >
                                  <Pencil data-icon="inline-start" />
                                  編輯備註
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="hidden gap-0 py-0 shadow-sm md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">付款階段</TableHead>
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">金額</TableHead>
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">代墊</TableHead>
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">請款編號</TableHead>
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">請款日</TableHead>
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">狀態</TableHead>
                        <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">收款日</TableHead>
                        <TableHead className="h-auto p-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceRows.map(({ stage, invoice, disbursementTotal }) => (
                        <TableRow key={stage.id} className="border-border">
                          <TableCell className="p-4 font-medium text-foreground">
                            {stage.stage_name}
                            <span className="ml-2 text-xs text-muted-foreground">{stage.percentage}%</span>
                          </TableCell>
                          <TableCell className="p-4 font-semibold text-foreground">{fmt(stage.amount)}</TableCell>
                          <TableCell className="p-4 text-muted-foreground">
                            {disbursementTotal > 0 ? fmt(disbursementTotal) : '—'}
                          </TableCell>
                          <TableCell className="p-4 font-mono text-sm text-muted-foreground">
                            {invoice?.invoice_number || '—'}
                          </TableCell>
                          <TableCell className="p-4 text-muted-foreground">
                            {invoice?.invoiced_at ? formatRocDate(invoice.invoiced_at) : '—'}
                          </TableCell>
                          <TableCell className="p-4">
                            {invoice ? (
                              <InvoiceStatusBadges status={invoice.status} />
                            ) : (
                              <Badge variant="outline" className="rounded-full">未請款</Badge>
                            )}
                          </TableCell>
                          <TableCell className="p-4 text-muted-foreground">
                            {invoice?.received_at ? formatRocDate(invoice.received_at) : '—'}
                          </TableCell>
                          <TableCell className="p-4 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="font-semibold"
                                onClick={() => setDisbursementStage(stage)}
                              >
                                代墊
                              </Button>
                              {!invoice ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="font-semibold"
                                  onClick={() => openCreateInvoice(stage)}
                                >
                                  <Plus data-icon="inline-start" />
                                  建立請款
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="font-semibold"
                                    onClick={() => navigate(`/projects/${id}/invoices/${invoice.id}`)}
                                  >
                                    <Eye data-icon="inline-start" />
                                    檢視
                                  </Button>
                                  {invoice.status === '已請款' ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="font-semibold"
                                        onClick={() => openEditInvoice(stage, invoice)}
                                      >
                                        <Pencil data-icon="inline-start" />
                                        編輯
                                      </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="font-semibold"
                                        onClick={() => setInvoiceToReceive(invoice)}
                                      >
                                        <Check data-icon="inline-start" />
                                        已收款
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="font-semibold text-destructive hover:text-destructive"
                                        onClick={() => setInvoiceToDelete(invoice)}
                                      >
                                        <Trash2 data-icon="inline-start" />
                                        刪除
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="font-semibold"
                                      onClick={() => openEditInvoice(stage, invoice)}
                                    >
                                      <Pencil data-icon="inline-start" />
                                      編輯備註
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function QuotationActionsMenu({ quotation, onDelete }) {
  const navigate = useNavigate()

  return (
    <DropdownMenu>
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
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={e => {
              e.stopPropagation()
              navigate(`/quotation/${quotation.id}`)
            }}
          >
            <Eye />
            檢視
          </DropdownMenuItem>
          {quotation.status === '草稿' && (
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                navigate(`/quotation/new?edit=${quotation.id}`)
              }}
            >
              <Pencil />
              編輯
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={e => {
              e.stopPropagation()
              onDelete(quotation.id)
            }}
          >
            <Trash2 />
            刪除
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
