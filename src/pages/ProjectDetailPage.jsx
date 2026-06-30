// src/pages/ProjectDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { formatRocDate, todayCe } from '../lib/rocDate'
import ROCDateInput from '../components/ROCDateInput'
import { FEATURE_NEGOTIATION, FEATURE_VERSIONING } from '../lib/featureFlags'
import { ProjectStatusBadges, QuotationStatusBadges, QuotationSummaryBadges, BillingSummaryBadges, InvoiceStatusBadges, Badge, countBadgeClassName } from '@/components/ui/badge'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
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
import DisbursementEditor, { disbursementsToRows } from '@/components/DisbursementEditor'
import InvoiceSetupDialog from '@/components/InvoiceSetupDialog'
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
import { groupDisbursementsByStage, saveDisbursementsForStage, sumDisbursements } from '@/lib/disbursements'
import { suggestReturnedDocuments } from '@/lib/invoiceDocument'
import { bankAccountLabel, pickDefaultBankAccount } from '@/lib/bankAccount'
import { companyProfileLabel } from '@/lib/companyProfile'
import {
  displayLandSection,
  displayProjectName,
  projectPrimaryLabel,
  projectSecondaryLabel,
} from '@/lib/projectDisplay'
import { applyStartProjectWork, needsStartWorkConfirmation } from '@/lib/startProjectWork'
import { getBillingSummary, getQuotationSummary } from '@/lib/projectSummaries'

const fmt = (n) => (n != null && n !== '' ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—')

const emptyInvoiceForm = () => ({
  invoiced_at: todayCe(),
  notes: '',
  returned_documents: '',
  bank_account_id: '',
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

const OVERVIEW_ENGINEERING_FIELDS = [
  { key: 'marketing_name', label: '工程名稱', display: (p) => displayProjectName(p) },
  { key: 'project_owner', label: '起造人 / 業主' },
  { key: 'building_permit', label: '建造執照字號' },
  { key: 'land_section', label: '地號資訊', display: (p) => displayLandSection(p) },
  { key: 'project_scale', label: '工程規模 / 備註說明' },
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
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [invoiceDialog, setInvoiceDialog] = useState(null)
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm())
  const [invoiceDisbursementRows, setInvoiceDisbursementRows] = useState([])
  const [invoiceSaving, setInvoiceSaving] = useState(false)
  const [invoiceToReceive, setInvoiceToReceive] = useState(null)
  const [invoiceToDelete, setInvoiceToDelete] = useState(null)
  const [bankAccounts, setBankAccounts] = useState([])
  const [quotationToDelete, setQuotationToDelete] = useState(null)
  const [invoiceSetupOpen, setInvoiceSetupOpen] = useState(false)
  const [invoiceMetaEditing, setInvoiceMetaEditing] = useState(false)
  const { user } = useAuth()
  const activeTab = searchParams.get('tab') || 'overview'
  const editInvoiceParam = searchParams.get('editInvoice')

  const setActiveTab = (tab) => {
    setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true })
  }

  const clearEditInvoiceParam = () => {
    if (!searchParams.get('editInvoice')) return
    const next = new URLSearchParams(searchParams)
    next.delete('editInvoice')
    setSearchParams(next, { replace: true })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select(`
          *,
          clients(company_name, address, phone, email),
          contact_persons(name, mobile, email),
          company_profiles(id, label, name)
        `)
        .eq('id', id)
        .single()

      if (projErr) throw projErr
      setProject(proj)

      const { data: quotes, error: qErr } = await supabase
        .from('quotations')
        .select(`
          id, quote_number, version, status, is_negotiating,
          quote_date, fee_amount, tax_included, created_at
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

  useEffect(() => {
    supabase
      .from('bank_accounts')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true })
      .then(({ data }) => setBankAccounts(data || []))
  }, [])

  useEffect(() => {
    if (!editInvoiceParam || loading) return
    const invoice = invoices.find(inv => inv.id === editInvoiceParam)
    if (!invoice) {
      clearEditInvoiceParam()
      return
    }
    const stage = paymentStages.find(s => s.id === invoice.payment_stage_id)
    if (!stage) {
      clearEditInvoiceParam()
      return
    }
    openEditInvoice(stage, invoice)
    clearEditInvoiceParam()
  }, [editInvoiceParam, loading, invoices, paymentStages]) // eslint-disable-line

  const updateProjectStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      toast.success(`案件狀態已更新為【${newStatus}】`)
      fetchData()
    } catch (err) {
      toast.error('更新失敗：' + err.message, { duration: 6000 })
    }
  }

  const requestStartWork = () => {
    if (needsStartWorkConfirmation(quotations)) {
      setShowStartDialog(true)
      return
    }
    updateProjectStatus('已開工')
  }

  const handleStartCancel = () => {
    setShowStartDialog(false)
  }

  const handleStartConfirm = async () => {
    setShowStartDialog(false)
    try {
      await applyStartProjectWork(supabase, id)
      toast.success('案件狀態已更新為【已開工】')
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
    const defaultBank = pickDefaultBankAccount(bankAccounts)
    setInvoiceDisbursementRows(disbursementsToRows(stageDisbs))
    setInvoiceForm({
      ...emptyInvoiceForm(),
      returned_documents: suggestReturnedDocuments(stageDisbs).join('\n'),
      bank_account_id: defaultBank?.id || '',
    })
    setInvoiceMetaEditing(false)
    setInvoiceDialog({ mode: 'create', stage })
  }

  const openEditInvoice = (stage, invoice) => {
    const stageDisbs = groupDisbursementsByStage(disbursements).get(stage.id) ?? []
    setInvoiceDisbursementRows(disbursementsToRows(stageDisbs))
    setInvoiceForm({
      invoiced_at: invoice.invoiced_at || todayCe(),
      notes: invoice.notes || '',
      returned_documents: invoice.returned_documents || '',
      bank_account_id: invoice.bank_account_id || '',
    })
    setInvoiceMetaEditing(false)
    setInvoiceDialog({ mode: 'edit', stage, invoice })
  }

  const closeInvoiceDialog = () => {
    setInvoiceDialog(null)
    setInvoiceForm(emptyInvoiceForm())
    setInvoiceDisbursementRows([])
    setInvoiceMetaEditing(false)
  }

  const saveInvoice = async () => {
    if (!invoiceDialog) return
    if (!invoiceForm.bank_account_id) {
      toast.warning('請選擇匯款帳戶')
      return
    }
    setInvoiceSaving(true)
    try {
      await saveDisbursementsForStage(supabase, invoiceDialog.stage.id, invoiceDisbursementRows)

      const payload = {
        invoiced_at: invoiceForm.invoiced_at || todayCe(),
        notes: invoiceForm.notes.trim() || null,
        returned_documents: invoiceForm.returned_documents.trim() || null,
        bank_account_id: invoiceForm.bank_account_id || null,
      }

      if (invoiceDialog.mode === 'create') {
        const { data: created, error } = await supabase.from('invoices').insert([{
          project_id: id,
          payment_stage_id: invoiceDialog.stage.id,
          status: '草稿',
          created_by: user?.id || null,
          ...payload,
        }]).select().single()
        if (error) throw error
        toast.success('請款草稿已儲存')
        closeInvoiceDialog()
        navigate(`/projects/${id}/invoices/${created.id}`)
        return
      } else {
        const { error } = await supabase
          .from('invoices')
          .update(payload)
          .eq('id', invoiceDialog.invoice.id)
        if (error) throw error
        toast.success('請款資料已更新')
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

  const markInvoiceAsInvoiced = async (invoice) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: '已請款' })
        .eq('id', invoice.id)
      if (error) throw error
      toast.success('狀態已更新為【已請款】')
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
        <AppBreadcrumbBar backTo="/dashboard" segments={['找不到案件']} />
        <main className="mx-auto max-w-7xl px-4 py-12 text-center md:px-8">
          <p className="text-sm font-medium text-muted-foreground">找不到該案件</p>
        </main>
      </div>
    )
  }

  const taxNote = project.tax_included ? '（含稅）' : '（未稅）'
  const secondaryName = projectSecondaryLabel(project)
  const disbursementMap = groupDisbursementsByStage(disbursements)
  const invoiceRows = buildInvoiceRows(paymentStages, invoices, disbursementMap)
  const draftCount = invoices.filter(inv => inv.status === '草稿').length
  const invoicedCount = invoices.filter(inv => inv.status === '已請款').length
  const receivedCount = invoices.filter(inv => inv.status === '已收款').length
  const disbursementGrandTotal = sumDisbursements(disbursements)
  const selectedBankAccount = bankAccounts.find(a => a.id === invoiceForm.bank_account_id)
  const quotationSummary = getQuotationSummary(quotations)
  const billingSummary = getBillingSummary(paymentStages, invoices)

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground transition-colors duration-200">
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除案件</AlertDialogTitle>
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
            <AlertDialogTitle>開始進行案件</AlertDialogTitle>
            <AlertDialogDescription>
              「{projectPrimaryLabel(project)}」— 客戶是否已回傳報價確認？
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
        <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
            <DialogTitle>
              {invoiceDialog?.mode === 'create' ? '建立請款草稿' : '編輯請款'}
            </DialogTitle>
            <DialogDescription>
              {invoiceDialog?.stage?.stage_name} · {fmt(invoiceDialog?.stage?.amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <FieldGroup className="gap-4">
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                {!invoiceMetaEditing ? (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">請款日期</p>
                        <p className="font-medium text-foreground">
                          {formatRocDate(invoiceForm.invoiced_at) || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">匯款帳戶</p>
                        <p className="font-medium text-foreground">
                          {selectedBankAccount
                            ? bankAccountLabel(selectedBankAccount)
                            : (bankAccounts.length === 0 ? '尚無帳戶，請至管理後台新增' : '未選擇')}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">顯示於請款單 PDF</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto shrink-0 p-0 font-semibold"
                      onClick={() => setInvoiceMetaEditing(true)}
                    >
                      <Pencil data-icon="inline-start" />
                      編輯
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ROCDateInput
                      id="invoiced_at"
                      label="請款日期"
                      value={invoiceForm.invoiced_at}
                      onChange={value => setInvoiceForm(f => ({ ...f, invoiced_at: value }))}
                      useRoc
                    />
                    <Field>
                      <FieldLabel htmlFor="invoice_bank_account_id">匯款帳戶</FieldLabel>
                      <Select
                        value={invoiceForm.bank_account_id || ''}
                        onValueChange={val => setInvoiceForm(f => ({ ...f, bank_account_id: val }))}
                        disabled={bankAccounts.length === 0}
                      >
                        <SelectTrigger id="invoice_bank_account_id" className="w-full">
                          {selectedBankAccount
                            ? bankAccountLabel(selectedBankAccount)
                            : (bankAccounts.length === 0 ? '尚無帳戶，請至管理後台新增' : '選擇匯款帳戶')}
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {bankAccountLabel(account)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1.5 text-xs text-muted-foreground">顯示於請款單 PDF</p>
                    </Field>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold text-muted-foreground"
                        onClick={() => setInvoiceMetaEditing(false)}
                      >
                        完成
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-3 text-sm font-semibold text-foreground">代墊明細</p>
                <p className="mb-3 text-xs text-muted-foreground">顯示於請款單 PDF，可與請款資料一併儲存。</p>
                <DisbursementEditor
                  rows={invoiceDisbursementRows}
                  onRowsChange={setInvoiceDisbursementRows}
                />
              </div>

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
          <DialogFooter className="shrink-0 border-t border-border px-5 py-3">
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
              {invoiceSaving ? '儲存中…' : (invoiceDialog?.mode === 'create' ? '儲存草稿' : '儲存')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceSetupDialog
        open={invoiceSetupOpen}
        onOpenChange={setInvoiceSetupOpen}
        projectId={id}
        project={project}
        quotations={quotations}
        onSuccess={fetchData}
      />

      <AppBreadcrumbBar
        backTo="/dashboard"
        segments={[
          <span key="project" className="inline-flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate">{projectPrimaryLabel(project)}</span>
            {secondaryName && (
              <span className="truncate text-sm font-normal text-muted-foreground">{secondaryName}</span>
            )}
          </span>,
        ]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="font-semibold"
              onClick={() => navigate(`/projects/${id}/edit`)}
            >
              <Pencil data-icon="inline-start" />
              編輯案件
            </Button>
            {quotationSummary === '草稿' && (
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
            {project.status === '未開工' && (
              <Button
                variant="outline"
                size="sm"
                className="font-semibold"
                onClick={requestStartWork}
              >
                開工
              </Button>
            )}
            {project.status === '已開工' && (
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
                onClick={() => updateProjectStatus('已開工')}
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
              <ProjectStatusBadges status={project.status} />
            </TabsTrigger>
            <TabsTrigger value="quotations" className="rounded-none px-4 py-2">
              報價
              <QuotationSummaryBadges status={quotationSummary} />
              {quotations.length > 0 && (
                <Badge variant="secondary" className={countBadgeClassName}>
                  {quotations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invoices" className="rounded-none px-4 py-2">
              請款單
              <BillingSummaryBadges status={billingSummary} />
              {invoices.length > 0 && (
                <Badge variant="secondary" className={countBadgeClassName}>
                  {receivedCount}/{invoices.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-semibold">客戶資訊</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 font-semibold"
                    onClick={() => navigate(`/projects/${id}/edit?step=1`)}
                  >
                    <Pencil data-icon="inline-start" />
                    編輯
                  </Button>
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
                  <div>
                    <span className="text-muted-foreground">電話</span>
                    <p className="font-medium text-foreground">{project.clients?.phone || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">電子郵件</span>
                    <p className="font-medium text-foreground">{project.clients?.email || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">地址</span>
                    <p className="font-medium text-foreground">{project.clients?.address || '—'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">案件摘要</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">地號</span>
                    <p className="font-medium text-foreground">{displayLandSection(project)}</p>
                  </div>
                  {project.marketing_name?.trim() && (
                    <div>
                      <span className="text-muted-foreground">工程名稱</span>
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

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold">工程資料</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 font-semibold"
                  onClick={() => navigate(`/projects/${id}/edit?step=2`)}
                >
                  <Pencil data-icon="inline-start" />
                  編輯
                </Button>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">公司抬頭</dt>
                    <dd className="mt-0.5 font-medium text-foreground">
                      {project.company_profiles
                        ? companyProfileLabel(project.company_profiles)
                        : '—'}
                    </dd>
                    {project.company_profiles?.name && (
                      <dd className="mt-0.5 text-sm text-muted-foreground">
                        {project.company_profiles.name}
                      </dd>
                    )}
                  </div>
                  {OVERVIEW_ENGINEERING_FIELDS.map(({ key, label, display }) => (
                    <div key={key} className={key === 'project_scale' ? 'sm:col-span-2' : undefined}>
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {display ? display(project) : (project[key]?.trim() || '—')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotations" className="mt-6">
            {quotations.length === 0 ? (
              <AppEmptyState
                icon={FileText}
                title="尚無報價單"
                description="建立第一份報價以記錄此案件的報價內容"
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
                title="尚未設定付款階段"
                description="可從現有報價單匯入付款階段，或手動建立以支援進行中案件"
                action={
                  <Button
                    variant="default"
                    size="md"
                    className="font-semibold"
                    onClick={() => setInvoiceSetupOpen(true)}
                  >
                    設定請款
                  </Button>
                }
                className="shadow-sm"
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    共 {paymentStages.length} 個付款階段 · 草稿 {draftCount} · 已請款 {invoicedCount} · 已收款 {receivedCount}
                    {disbursementGrandTotal > 0 && ` · 代墊合計 ${fmt(disbursementGrandTotal)}`}
                  </p>
                  {invoices.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-semibold"
                      onClick={() => setInvoiceSetupOpen(true)}
                    >
                      變更付款階段
                    </Button>
                  )}
                </div>

                <div className="block space-y-3 md:hidden">
                  {invoiceRows.map(({ stage, invoice, disbursements: stageDisbs, disbursementTotal }) => (
                    <Card
                      key={stage.id}
                      size="sm"
                      className={`gap-0 py-0 shadow-sm ${invoice ? 'cursor-pointer hover:bg-muted/20' : ''}`}
                      onClick={() => {
                        if (invoice) navigate(`/projects/${id}/invoices/${invoice.id}`)
                      }}
                    >
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
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <InvoiceActionsMenu
                            projectId={id}
                            stage={stage}
                            invoice={invoice}
                            onCreate={openCreateInvoice}
                            onEdit={openEditInvoice}
                            onMarkInvoiced={markInvoiceAsInvoiced}
                            onReceive={setInvoiceToReceive}
                            onDelete={setInvoiceToDelete}
                          />
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
                        <TableHead className="h-auto w-[72px] p-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceRows.map(({ stage, invoice, disbursementTotal }) => (
                        <TableRow
                          key={stage.id}
                          className={`border-border ${invoice ? 'cursor-pointer hover:bg-muted/30' : ''}`}
                          onClick={() => {
                            if (invoice) navigate(`/projects/${id}/invoices/${invoice.id}`)
                          }}
                        >
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
                          <TableCell className="p-4 text-right" onClick={e => e.stopPropagation()}>
                            <InvoiceActionsMenu
                              projectId={id}
                              stage={stage}
                              invoice={invoice}
                              onCreate={openCreateInvoice}
                              onEdit={openEditInvoice}
                              onMarkInvoiced={markInvoiceAsInvoiced}
                              onReceive={setInvoiceToReceive}
                              onDelete={setInvoiceToDelete}
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
        </Tabs>
      </main>
    </div>
  )
}

function InvoiceActionsMenu({ projectId, stage, invoice, onCreate, onEdit, onMarkInvoiced, onReceive, onDelete }) {
  const navigate = useNavigate()

  if (!invoice) {
    return (
      <Button
        variant="default"
        size="sm"
        className="font-semibold"
        onClick={() => onCreate(stage)}
      >
        <Plus data-icon="inline-start" />
        建立請款
      </Button>
    )
  }

  const canEdit = invoice.status === '草稿' || invoice.status === '已請款'
  const canDelete = invoice.status === '草稿' || invoice.status === '已請款'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="請款操作"
            title="請款操作"
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
              navigate(`/projects/${projectId}/invoices/${invoice.id}`)
            }}
          >
            <Eye />
            檢視請款單
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onEdit(stage, invoice)
              }}
            >
              <Pencil />
              {invoice.status === '草稿' ? '編輯草稿' : '編輯'}
            </DropdownMenuItem>
          )}
          {invoice.status === '草稿' && (
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onMarkInvoiced(invoice)
              }}
            >
              <Check />
              標記已請款
            </DropdownMenuItem>
          )}
          {invoice.status === '已請款' && (
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onReceive(invoice)
              }}
            >
              <Check />
              標記已收款
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onClick={e => {
                  e.stopPropagation()
                  onDelete(invoice)
                }}
              >
                <Trash2 />
                刪除
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
