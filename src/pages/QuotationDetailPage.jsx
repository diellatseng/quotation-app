// src/pages/QuotationDetailPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useExportPDF } from '../hooks/useExportPDF'
import { formatRocDate } from '../lib/rocDate'
import {
  formatQuotationValidationMessage,
  validateQuotationRecordForSend,
} from '../lib/validateQuotation'
import { FEATURE_NEGOTIATION, FEATURE_VERSIONING } from '../lib/featureFlags'
import { QuotationStatusBadges } from '@/components/ui/badge'
// import NegotiationPanel from '../components/NegotiationPanel' // inactive: negotiation
import ServiceTable from '../components/ServiceTable'
import A4Preview from '../components/A4Preview'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getIcon } from '@/lib/icons'

const ArrowBackIcon = getIcon('arrow_back')
const PrintIcon = getIcon('print')
const EditIcon = getIcon('edit')

const COMPANY_INFO = {
  name: import.meta.env.VITE_COMPANY_NAME || '公司名稱',
  address: import.meta.env.VITE_COMPANY_ADDRESS || '公司地址',
  phone: import.meta.env.VITE_COMPANY_PHONE || '公司電話',
  fax: import.meta.env.VITE_COMPANY_FAX || '',
  email: import.meta.env.VITE_COMPANY_EMAIL || '',
}

export default function QuotationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const quotationRef = useRef()
  const servicesRef = useRef()

  const [qt, setQt] = useState(null)
  const [services, setServices] = useState([])
  const [paymentStages, setPaymentStages] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  // const [negDialog, setNegDialog] = useState(null) // inactive: negotiation / versioning
  const [activeTab, setActiveTab] = useState('quotation')

  const { exportPDF } = useExportPDF()

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: qData, error: qErr } = await supabase
        .from('quotations')
        .select(`
          *,
          clients(*),
          contact_persons(*)
        `)
        .eq('id', id)
        .single()

      if (qErr) throw qErr
      setQt(qData)
      quotationRef.current = qData

      const { data: sData, error: sErr } = await supabase
        .from('quotation_services')
        .select('*')
        .eq('quotation_id', id)
        .order('sort_order', { ascending: true })

      if (sErr) throw sErr
      setServices(sData)
      servicesRef.current = sData

      const { data: stageData, error: stErr } = await supabase
        .from('payment_stages')
        .select('stage_name, percentage')
        .eq('quotation_id', id)
        .order('sort_order')

      if (stErr) throw stErr
      setPaymentStages(stageData || [])
    } catch (err) {
      toast.error('載入失敗: ' + err.message, { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id]) // eslint-disable-line

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
      toast.success(`狀態已更新為【${newStatus}】`)
      fetchData()
    } catch (err) {
      toast.error('更新失敗: ' + err.message, { duration: 6000 })
    }
  }

  /* inactive: negotiation / versioning
  const handleNegotiateSubmit = (amount, comment) => {
    setNegDialog({ amount, comment })
  }

  const createVersionAfterNegotiation = async ({ amount, comment, editServices }) => {
    ...
  }
  */

  const handleExport = async () => {
    if (!quotationRef.current) return
    setExporting(true)
    toast.info('正在準備 PDF 匯出資料，請稍候…')
    try {
      await exportPDF(quotationRef.current, servicesRef.current, COMPANY_INFO)
      toast.success('PDF 匯出成功')
    } catch (err) {
      toast.error('匯出失敗: ' + err.message, { duration: 6000 })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        載入中…
      </div>
    )
  }

  if (!qt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-4">
        <p className="text-sm font-medium text-muted-foreground">找不到該報價單</p>
        <Button variant="outline" size="md" className="mt-4 font-semibold" onClick={() => navigate('/dashboard')}>
          返回儀表板
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12 transition-colors duration-200">

      {/* ── Top Header Navigation Bar ── */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md px-4 py-4 md:px-8 shadow-sm">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="font-semibold"
              onClick={() => navigate('/dashboard')}
              aria-label="返回儀表板"
            >
              {ArrowBackIcon && <ArrowBackIcon data-icon="inline-start" />}
              返回
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {qt.quote_number}
                </h1>
                {FEATURE_VERSIONING && (
                  <span className="text-xs font-mono bg-muted text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    v{qt.version}
                  </span>
                )}
                <QuotationStatusBadges
                  status={qt.status}
                  isNegotiating={FEATURE_NEGOTIATION && qt.is_negotiating}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                客戶：{qt.clients?.company_name || '—'}
              </p>
            </div>
          </div>

          {/* Core System Actions Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="font-semibold"
              onClick={handleExport}
              disabled={exporting}
            >
              {PrintIcon && <PrintIcon data-icon="inline-start" />}
              {exporting ? '匯出中…' : '匯出 PDF'}
            </Button>

            {qt.status === '草稿' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                  onClick={() => navigate(`/quotation/new?edit=${qt.id}`)}
                >
                  {EditIcon && <EditIcon data-icon="inline-start" />}
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
          </div>
        </div>
      </header>

      {/* ── Main Layout Workspace ── */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
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
          </TabsList>
        </Tabs>

        {/* A4 Preview Container - Full Width */}
        <div className="bg-muted/30 rounded-xl border border-border p-4 md:p-6 flex justify-center overflow-auto shadow-inner">
          <div className="bg-white shadow-md rounded-sm border border-zinc-200 origin-top transform scale-100 max-w-full">
            <A4Preview
              quotation={qt}
              services={services}
              companyInfo={COMPANY_INFO}
              mode={activeTab}
            />
          </div>
        </div>

        {/* inactive: negotiation / versioning — new-version dialog after 議價
        {negDialog && ( ... )}
        */}
      </main>
    </div>
  )
}