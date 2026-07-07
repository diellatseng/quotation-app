// src/pages/ContractDetailPage.jsx
// Handles both create (/quotation/:quotationId/contract/new) and view/edit (/contracts/:id)
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useExportPDF } from '../hooks/useExportPDF'
import { AppBreadcrumbBar } from '@/components/AppShellHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import ContractPreview from '../components/ContractPreview'
import { companyProfileToInfo } from '../lib/companyProfile'
import {
  generateContractNumber,
  DEFAULT_PROJECT_ITEM,
  defaultSiteName,
} from '../lib/contractLib'
import { ceToRocInput } from '../lib/rocDate'
import { Pencil, Printer, FileText } from 'lucide-react'

export default function ContractDetailPage() {
  const { quotationId: newModeQuotationId, id: contractId } = useParams()
  const isNew = Boolean(newModeQuotationId && !contractId)
  const navigate = useNavigate()
  const previewRef = useRef(null)

  // ── Data state ──
  const [loading, setLoading] = useState(true)
  const [contract, setContract] = useState(null)
  const [quotation, setQuotation] = useState(null)
  const [services, setServices] = useState([])
  const [stages, setStages] = useState([])
  const [previewReady, setPreviewReady] = useState(false)

  // ── Edit form state ──
  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState({
    contract_number: '',
    project_item: DEFAULT_PROJECT_ITEM,
    site_name: '',
    signed_at: '',
  })
  const [saving, setSaving] = useState(false)

  const { exporting, exportPDF } = useExportPDF()

  // Derived: profile + companyInfo from quotation
  const profile = quotation?.projects?.company_profiles || null
  const companyInfo = companyProfileToInfo(profile)
  const client = quotation?.clients || null
  const contactPerson = quotation?.contact_persons || null

  // ── Fetch data ──
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setPreviewReady(false)

      try {
        let quotationRecord = null
        let contractRecord = null

        if (isNew) {
          // New mode: load quotation by ID
          const { data: qData, error: qErr } = await supabase
            .from('quotations')
            .select(`
              *,
              clients(*),
              contact_persons(*),
              projects!project_id(
                land_section,
                company_profiles(*)
              )
            `)
            .eq('id', newModeQuotationId)
            .single()
          if (qErr) throw qErr
          quotationRecord = qData

          // Check if contract already exists
          const { data: existing } = await supabase
            .from('contracts')
            .select('id')
            .eq('quotation_id', newModeQuotationId)
            .maybeSingle()

          if (existing?.id) {
            // Already has a contract — redirect to view
            navigate(`/contracts/${existing.id}`, { replace: true })
            return
          }
        } else {
          // View mode: load contract, then quotation
          const { data: ctData, error: ctErr } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', contractId)
            .single()
          if (ctErr) throw ctErr
          contractRecord = ctData

          const { data: qData, error: qErr } = await supabase
            .from('quotations')
            .select(`
              *,
              clients(*),
              contact_persons(*),
              projects!project_id(
                land_section,
                company_profiles(*)
              )
            `)
            .eq('id', ctData.quotation_id)
            .single()
          if (qErr) throw qErr
          quotationRecord = qData
        }

        // Fetch services + stages from quotation
        const quotId = quotationRecord.id
        const [{ data: sData, error: sErr }, { data: stData, error: stErr }] = await Promise.all([
          supabase.from('quotation_services').select('*').eq('quotation_id', quotId).order('sort_order'),
          supabase.from('payment_stages').select('stage_name, percentage').eq('quotation_id', quotId).order('sort_order'),
        ])
        if (sErr) throw sErr
        if (stErr) throw stErr

        if (cancelled) return

        setQuotation(quotationRecord)
        setServices(sData || [])
        setStages(stData || [])
        setContract(contractRecord)

        // Prefill form data
        const landSection = quotationRecord?.projects?.land_section || ''
        const defaultData = {
          contract_number: contractRecord?.contract_number || generateContractNumber(quotationRecord?.quote_number),
          project_item: contractRecord?.project_item || DEFAULT_PROJECT_ITEM,
          site_name: contractRecord?.site_name || defaultSiteName(landSection),
          signed_at: contractRecord?.signed_at || new Date().toISOString().split('T')[0],
        }
        setFormData(defaultData)

        if (isNew) {
          setEditOpen(true)
        }
      } catch (err) {
        if (!cancelled) toast.error('載入失敗：' + err.message, { duration: 6000 })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [isNew, newModeQuotationId, contractId, navigate])

  // When route switches from /new to /contracts/:id (same component instance),
  // ensure the edit dialog is always closed in view mode.
  useEffect(() => {
    if (!isNew) setEditOpen(false)
  }, [isNew])

  // ContractPreview renders synchronously — mark ready once data is loaded
  useEffect(() => {
    if (!loading && quotation) {
      // Small rAF delay to ensure the DOM has painted before export is allowed
      const raf = requestAnimationFrame(() => setPreviewReady(true))
      return () => cancelAnimationFrame(raf)
    }
  }, [loading, quotation])

  // ── Save contract ──
  const handleSave = async () => {
    if (!formData.project_item?.trim()) {
      toast.error('工程項目為必填')
      return
    }
    if (!formData.site_name?.trim()) {
      toast.error('工地名稱為必填')
      return
    }

    setSaving(true)
    try {
      const payload = {
        quotation_id: quotation.id,
        contract_number: formData.contract_number?.trim() || null,
        project_item: formData.project_item.trim(),
        site_name: formData.site_name.trim(),
        signed_at: formData.signed_at || null,
      }

      if (isNew) {
        const { data: created, error } = await supabase
          .from('contracts')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        toast.success('合約已建立')
        setEditOpen(false)  // reset before navigate — same component instance is reused
        navigate(`/contracts/${created.id}`, { replace: true })
      } else {
        const { error } = await supabase
          .from('contracts')
          .update(payload)
          .eq('id', contract.id)
        if (error) throw error
        setContract({ ...contract, ...payload })
        toast.success('合約已更新')
        setEditOpen(false)
      }
    } catch (err) {
      toast.error('儲存失敗：' + err.message, { duration: 6000 })
    } finally {
      setSaving(false)
    }
  }

  // ── Export PDF ──
  const handleExport = async () => {
    if (!quotation) return
    toast.info('正在準備 PDF 匯出，請稍候…')
    const num = contract?.contract_number || formData.contract_number || '合約'
    try {
      await exportPDF(previewRef, {
        filename: `合約-${num}`,
        styleMatchers: ['ct-'],
        onSuccess: () => toast.success('PDF 匯出成功'),
      })
    } catch (err) {
      toast.error('匯出失敗：' + err.message, { duration: 6000 })
    }
  }

  // ── Live preview data (merges saved + current form fields) ──
  const liveContractData = {
    contract_number: formData.contract_number,
    project_item: formData.project_item,
    site_name: formData.site_name,
    signed_at: formData.signed_at,
  }

  // ── Breadcrumb ──
  const quotationBackTo = quotation
    ? `/quotation/${quotation.id}?tab=contract`
    : '/dashboard'
  const quotationBackLabel = quotation?.quote_number || '報價單'
  const pageTitle = isNew ? '新建合約' : `合約 ${contract?.contract_number || ''}`

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AppBreadcrumbBar backTo="/dashboard" backLabel="載入中" segments={['合約']} />
        <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="h-[1123px] w-[794px]" />
        </main>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AppBreadcrumbBar backTo="/dashboard" backLabel="案件列表" segments={['找不到合約']} />
        <main className="mx-auto max-w-4xl px-4 py-12 text-center md:px-8">
          <p className="text-sm font-medium text-foreground">找不到對應的報價單資料</p>
        </main>
      </div>
    )
  }

  const rocSignedAt = formData.signed_at ? ceToRocInput(formData.signed_at) : ''

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground">
      <AppBreadcrumbBar
        backTo={quotationBackTo}
        backLabel={quotationBackLabel}
        segments={[pageTitle]}
        actions={
          <>
            {!isNew && (
              <Button
                variant="outline"
                size="sm"
                className="font-semibold"
                onClick={() => setEditOpen(true)}
              >
                <Pencil data-icon="inline-start" />
                編輯合約
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="font-semibold"
              onClick={handleExport}
              disabled={exporting || (!isNew && !previewReady)}
            >
              <Printer data-icon="inline-start" />
              {exporting ? '匯出中…' : '匯出 PDF'}
            </Button>
          </>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* New mode: info card above preview */}
        {isNew && (
          <Card className="mb-6 border-highlight bg-highlight/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 size-5 text-highlight-text" />
                <div>
                  <p className="text-sm font-semibold text-foreground">填寫合約基本資料</p>
                  <p className="mt-0.5 text-sm text-foreground">
                    承攬內容已自動套用報價單服務項目與付款階段。填寫下方欄位後按「建立合約」儲存。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary row for view mode */}
        {!isNew && contract && (
          <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-foreground">
            <span><span className="font-semibold">合約編號：</span>{contract.contract_number || '—'}</span>
            <span><span className="font-semibold">工地名稱：</span>{contract.site_name}</span>
            <span><span className="font-semibold">簽約日期：</span>{contract.signed_at ? ceToRocInput(contract.signed_at) : '—'}</span>
          </div>
        )}

        {/* Contract preview */}
        <div className="relative flex justify-center overflow-auto rounded-xl border border-border bg-muted/30 p-4 shadow-inner md:p-6">
          {!previewReady && (
            <Skeleton
              className="absolute inset-4 z-10 mx-auto h-[1123px] w-full max-w-[794px] rounded-xl md:inset-6"
              aria-busy="true"
            />
          )}
          <div
            className={`max-w-full origin-top rounded-sm border border-border bg-card shadow-md ${!previewReady ? 'invisible' : ''}`}
          >
            <ContractPreview
              ref={previewRef}
              contractData={liveContractData}
              quotation={quotation}
              services={services}
              stages={stages}
              client={client}
              contactPerson={contactPerson}
              profile={profile}
              companyInfo={companyInfo}
            />
          </div>
        </div>

      </main>

      {/* ── Edit / Create Dialog ── */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open && isNew) {
            // Cancel new contract → go back to quotation
            navigate(quotationBackTo, { replace: true })
          } else {
            setEditOpen(open)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <div className="flex flex-col gap-5 p-6">
            <DialogHeader>
              <DialogTitle>{isNew ? '建立合約' : '編輯合約'}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ct-num" className="text-base font-semibold text-foreground">
                  合約編號
                </Label>
                <Input
                  id="ct-num"
                  value={formData.contract_number}
                  onChange={(e) => setFormData((p) => ({ ...p, contract_number: e.target.value }))}
                  placeholder="例：CT-114-001"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ct-item" className="text-base font-semibold text-foreground">
                  工程項目 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ct-item"
                  value={formData.project_item}
                  onChange={(e) => setFormData((p) => ({ ...p, project_item: e.target.value }))}
                  placeholder="建管程序業務及使用執照代辦"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ct-site" className="text-base font-semibold text-foreground">
                  工地名稱 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ct-site"
                  value={formData.site_name}
                  onChange={(e) => setFormData((p) => ({ ...p, site_name: e.target.value }))}
                  placeholder="例：前金段新建工程"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ct-date" className="text-base font-semibold text-foreground">
                  簽約日期
                </Label>
                <Input
                  id="ct-date"
                  type="date"
                  value={formData.signed_at}
                  onChange={(e) => setFormData((p) => ({ ...p, signed_at: e.target.value }))}
                />
                {rocSignedAt && (
                  <p className="text-sm text-foreground">民國：{rocSignedAt}</p>
                )}
              </div>

          </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (isNew) navigate(quotationBackTo, { replace: true })
                  else setEditOpen(false)
                }}
                disabled={saving}
              >
                取消
              </Button>
              <Button variant="default" onClick={handleSave} disabled={saving}>
                {saving ? '儲存中…' : isNew ? '建立合約' : '儲存'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
