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
import { QuotationStatusBadges, Badge } from '@/components/ui/badge'
// import NegotiationPanel from '../components/NegotiationPanel' // inactive: negotiation
import ServiceTable from '../components/ServiceTable'
import A4Preview from '../components/A4Preview'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuotationDetailSkeleton } from '@/components/skeletons'
import { AppBackButton, AppBreadcrumbBar } from '@/components/AppShellHeader'
import { Pencil, Printer } from 'lucide-react'


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
  const previewRef = useRef(null)

  const [qt, setQt] = useState(null)
  const [services, setServices] = useState([])
  const [paymentStages, setPaymentStages] = useState([])
  const [loading, setLoading] = useState(true)
  // const [negDialog, setNegDialog] = useState(null) // inactive: negotiation / versioning
  const [activeTab, setActiveTab] = useState('quotation')

  const { exporting, exportPDF } = useExportPDF()

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

      const { data: sData, error: sErr } = await supabase
        .from('quotation_services')
        .select('*')
        .eq('quotation_id', id)
        .order('sort_order', { ascending: true })

      if (sErr) throw sErr
      setServices(sData)

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-4">
        <p className="text-sm font-medium text-muted-foreground">找不到該報價單</p>
        <AppBackButton to="/dashboard" label="報價單列表" className="mt-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground transition-colors duration-200">
      <AppBreadcrumbBar
        backTo="/dashboard"
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
            <Button
              variant="outline"
              size="sm"
              className="font-semibold"
              onClick={handleExport}
              disabled={exporting}
            >
              <Printer data-icon="inline-start" />
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

        <div className="flex justify-center overflow-auto rounded-xl border border-border bg-muted/30 p-4 shadow-inner md:p-6">
          <div className="max-w-full origin-top scale-100 transform rounded-sm border border-border bg-white shadow-md">
            <A4Preview
              ref={previewRef}
              quotation={qt}
              services={services}
              stages={paymentStages}
              client={qt.clients}
              contactPerson={qt.contact_persons}
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