// src/pages/QuotationDetailPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useExportPDF } from '../hooks/useExportPDF'
import {
  formatQuotationValidationMessage,
  validateQuotationRecordForSend,
} from '../lib/validateQuotation'
import { FEATURE_NEGOTIATION, FEATURE_VERSIONING } from '../lib/featureFlags'
import { QuotationStatusBadges, Badge } from '@/components/ui/badge'
import A4Preview from '../components/A4Preview'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuotationDetailSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import { AppBreadcrumbBar } from '@/components/AppShellHeader'
import { projectPrimaryLabel } from '../lib/projectDisplay'
import { syncProjectStatusFromQuotation } from '../lib/projectStatus'
import { companyProfileToInfo } from '../lib/companyProfile'
import { ceToRocInput } from '../lib/rocDate'
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
import { Pencil, Printer, FileText, FilePlus } from 'lucide-react'

export default function QuotationDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const previewRef = useRef(null)

  const [qt, setQt] = useState(null)
  const [services, setServices] = useState([])
  const [paymentStages, setPaymentStages] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewReady, setPreviewReady] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'quotation')

  // Contract state
  const [contract, setContract] = useState(null)
  const [contractLoading, setContractLoading] = useState(false)
  // Popup: ask to create contract after confirming
  const [showContractPrompt, setShowContractPrompt] = useState(false)

  const { exporting, exportPDF } = useExportPDF()

  const handlePreviewLayoutComplete = useCallback(() => {
    setPreviewReady(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setPreviewReady(false)
      setQt(null)
      setServices([])
      setPaymentStages([])

      try {
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
          .eq('id', id)
          .single()

        if (qErr) throw qErr

        const { data: sData, error: sErr } = await supabase
          .from('quotation_services')
          .select('*')
          .eq('quotation_id', id)
          .order('sort_order', { ascending: true })

        if (sErr) throw sErr

        const { data: stageData, error: stErr } = await supabase
          .from('payment_stages')
          .select('stage_name, percentage')
          .eq('quotation_id', id)
          .order('sort_order')

        if (stErr) throw stErr

        if (cancelled) return

        setQt(qData)
        setServices(sData || [])
        setPaymentStages(stageData || [])
      } catch (err) {
        if (!cancelled) {
          toast.error('載入失敗: ' + err.message, { duration: 6000 })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [id])

  // Load contract record when tab is active or quotation is confirmed
  useEffect(() => {
    if (!qt?.id || qt.status !== '已確認') {
      setContract(null)
      return
    }
    let cancelled = false
    setContractLoading(true)

    supabase
      .from('contracts')
      .select('*')
      .eq('quotation_id', qt.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('[QuotationDetailPage] contract fetch error:', error)
        } else {
          setContract(data || null)
        }
        setContractLoading(false)
      })

    return () => { cancelled = true }
  }, [qt?.id, qt?.status])

  const handleSendQuotation = () => {
    const { valid, missing } = validateQuotationRecordForSend(qt, paymentStages)
    if (!valid) {
      toast.error(formatQuotationValidationMessage(missing), { duration: 8000 })
      return
    }
    updateStatus('已報價')
  }

  const updateStatus = async (newStatus) => {
    try {
      const { error: err } = await supabase
        .from('quotations')
        .update({ status: newStatus })
        .eq('id', id)

      if (err) throw err
      if (qt.project_id) {
        await syncProjectStatusFromQuotation(supabase, qt.project_id, newStatus)
      }
      toast.success(`狀態已更新為【${newStatus}】`)
      setQt(prev => (prev ? { ...prev, status: newStatus } : prev))

      // Show contract creation prompt when confirmed
      if (newStatus === '已確認') {
        setShowContractPrompt(true)
      }
    } catch (err) {
      toast.error('更新失敗: ' + err.message, { duration: 6000 })
    }
  }

  const handleExport = async () => {
    if (!qt) return
    toast.info('正在準備 PDF 匯出資料，請稍候…')
    try {
      await exportPDF(previewRef, {
        filename: `報價單-${qt.quote_number}`,
        onSuccess: () => toast.success('PDF 匯出成功'),
      })
    } catch (err) {
      toast.error('匯出失敗: ' + err.message, { duration: 6000 })
    }
  }

  if (loading) {
    return <QuotationDetailSkeleton />
  }

  if (!qt) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AppBreadcrumbBar backTo="/dashboard" backLabel="案件列表" segments={['找不到報價單']} />
        <main className="mx-auto max-w-7xl px-4 py-12 text-center md:px-8">
          <p className="text-sm font-medium text-muted-foreground">找不到該報價單</p>
        </main>
      </div>
    )
  }

  const projectBackTo = qt.project_id ? `/projects/${qt.project_id}?tab=quotations` : '/dashboard'
  const projectBackLabel = qt.land_section?.trim() || qt.marketing_name?.trim() || projectPrimaryLabel({ land_section: qt.land_section, marketing_name: qt.marketing_name })
  const companyInfo = companyProfileToInfo(qt.projects?.company_profiles)
  const isConfirmed = qt.status === '已確認'
  const isContractTab = activeTab === 'contract'

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground transition-colors duration-200">
      <AppBreadcrumbBar
        backTo={projectBackTo}
        backLabel={qt.project_id ? projectBackLabel : '案件列表'}
        segments={[
          <span key="quote" className="inline-flex flex-wrap items-center gap-2">
            <span>{qt.quote_number}</span>
            {FEATURE_VERSIONING && (
              <Badge variant="secondary" className="font-mono font-medium">
                v{qt.version}
              </Badge>
            )}
            <QuotationStatusBadges
              status={qt.status}
              isNegotiating={FEATURE_NEGOTIATION && qt.is_negotiating}
            />
          </span>,
        ]}
        actions={
          <>
            {/* Export PDF (not shown on contract tab — contract page has its own) */}
            {!isContractTab && (
              <Button
                variant="outline"
                size="sm"
                className="font-semibold"
                onClick={handleExport}
                disabled={exporting || !previewReady}
              >
                <Printer data-icon="inline-start" />
                {exporting ? '匯出中…' : '匯出 PDF'}
              </Button>
            )}

            {qt.status === '草稿' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                  onClick={() => navigate(`/quotation/new?edit=${qt.id}`)}
                >
                  <Pencil data-icon="inline-start" />
                  編輯草稿
                </Button>
                <Button variant="default" size="sm" className="font-semibold" onClick={handleSendQuotation}>
                  發送報價 (置為已報價)
                </Button>
              </>
            )}

            {qt.status === '已報價' && (
              <Button variant="default" size="sm" className="font-semibold" onClick={() => updateStatus('已確認')}>
                客戶確認簽回
              </Button>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <p className="mb-4 text-sm text-muted-foreground">
          客戶：{qt.clients?.company_name || '—'}
        </p>

        <Tabs value={activeTab} onValueChange={(tab) => {
          setPreviewReady(false)
          setActiveTab(tab)
        }} className="mb-6">
          <TabsList variant="line" className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="quotation" className="rounded-none px-4 py-2">
              報價單
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-none px-4 py-2">
              服務明細
            </TabsTrigger>
            <TabsTrigger value="checklist" className="rounded-none px-4 py-2">
              客戶準備清單
            </TabsTrigger>
            {isConfirmed && (
              <TabsTrigger value="contract" className="rounded-none px-4 py-2">
                合約
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        {isContractTab ? (
          // ── Contract tab content ──
          <ContractTabContent
            quotationId={qt.id}
            contract={contract}
            loading={contractLoading}
          />
        ) : (
          // ── A4 Preview tabs (quotation / services / checklist) ──
          <div className="relative flex justify-center overflow-auto rounded-xl border border-border bg-muted/30 p-4 shadow-inner md:p-6">
            {!previewReady && (
              <Skeleton
                className="absolute inset-4 z-10 mx-auto h-[640px] w-full max-w-[794px] rounded-xl md:inset-6"
                aria-busy="true"
                aria-label="載入報價預覽"
              />
            )}
            <div className={`max-w-full origin-top scale-100 transform rounded-sm border border-border bg-card shadow-md ${previewReady ? '' : 'invisible'}`}>
              <A4Preview
                key={`${id}-${activeTab}`}
                ref={previewRef}
                quotation={qt}
                services={services}
                stages={paymentStages}
                client={qt.clients}
                contactPerson={qt.contact_persons}
                companyInfo={companyInfo}
                mode={activeTab}
                onLayoutComplete={handlePreviewLayoutComplete}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── Contract creation prompt (after confirming) ── */}
      <AlertDialog open={showContractPrompt} onOpenChange={setShowContractPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <span className="flex items-center gap-2">
                <FilePlus className="size-5 text-primary" />
                建立合約
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              報價單已確認。要立即根據報價單內容建立一份簡易合約嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowContractPrompt(false)}>
              稍後再說
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowContractPrompt(false)
                navigate(`/quotation/${qt.id}/contract/new`)
              }}
            >
              立即建立合約
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── ContractTabContent ──────────────────────────────────────────────────────
function ContractTabContent({ quotationId, contract, loading }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Skeleton className="h-40 w-full max-w-lg rounded-xl" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <FileText className="size-10 text-muted-foreground" />
        <div>
          <p className="text-base font-semibold text-foreground">尚未建立合約</p>
          <p className="mt-1 text-sm text-muted-foreground">
            根據此報價單生成一份簡易式合約，可匯出為 PDF。
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          className="mt-2 font-semibold"
          onClick={() => navigate(`/quotation/${quotationId}/contract/new`)}
        >
          <FilePlus data-icon="inline-start" />
          建立合約
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <span className="text-base font-semibold text-foreground">
            合約 {contract.contract_number || '（未設定編號）'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-semibold"
            onClick={() => navigate(`/contracts/${contract.id}`)}
          >
            <Printer data-icon="inline-start" />
            查看 / 匯出 PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <ContractInfoRow label="工程項目" value={contract.project_item} />
        <ContractInfoRow label="工地名稱" value={contract.site_name} />
        <ContractInfoRow
          label="簽約日期"
          value={contract.signed_at ? ceToRocInput(contract.signed_at) : '—'}
        />
        <ContractInfoRow label="合約編號" value={contract.contract_number || '—'} />
      </div>
    </div>
  )
}

function ContractInfoRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 flex-shrink-0 font-semibold text-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
