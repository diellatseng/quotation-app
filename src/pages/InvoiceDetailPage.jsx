import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useExportPDF } from '../hooks/useExportPDF'
import InvoicePreview from '../components/InvoicePreview'
import { Button } from '@/components/ui/button'
import { InvoiceStatusBadges } from '@/components/ui/badge'
import { QuotationDetailSkeleton } from '@/components/skeletons'
import { AppBreadcrumbBar } from '@/components/AppShellHeader'
import { projectPrimaryLabel } from '../lib/projectDisplay'
import { Printer } from 'lucide-react'

const COMPANY_INFO = {
  name: import.meta.env.VITE_COMPANY_NAME || '公司名稱',
  address: import.meta.env.VITE_COMPANY_ADDRESS || '公司地址',
  phone: import.meta.env.VITE_COMPANY_PHONE || '公司電話',
  fax: import.meta.env.VITE_COMPANY_FAX || '',
  email: import.meta.env.VITE_COMPANY_EMAIL || '',
}

export default function InvoiceDetailPage() {
  const { projectId, invoiceId } = useParams()
  const previewRef = useRef(null)

  const [project, setProject] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [stage, setStage] = useState(null)
  const [disbursements, setDisbursements] = useState([])
  const [loading, setLoading] = useState(true)

  const { exporting, exportPDF } = useExportPDF()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: inv, error: invErr } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .eq('project_id', projectId)
          .single()

        if (invErr) throw invErr
        setInvoice(inv)

        const { data: proj, error: projErr } = await supabase
          .from('projects')
          .select(`
            *,
            clients(*),
            contact_persons(*)
          `)
          .eq('id', projectId)
          .single()

        if (projErr) throw projErr
        setProject(proj)

        const { data: stageData, error: stageErr } = await supabase
          .from('payment_stages')
          .select('id, stage_name, percentage, amount')
          .eq('id', inv.payment_stage_id)
          .single()

        if (stageErr) throw stageErr
        setStage(stageData)

        const { data: disb, error: disbErr } = await supabase
          .from('disbursements')
          .select('id, name, amount, is_preset')
          .eq('payment_stage_id', inv.payment_stage_id)
          .order('created_at', { ascending: true })

        if (disbErr) throw disbErr
        setDisbursements(disb || [])
      } catch (err) {
        toast.error('載入失敗：' + err.message, { duration: 6000 })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, invoiceId])

  const handleExport = async () => {
    if (!invoice) return
    toast.info('正在準備 PDF 匯出資料，請稍候…')
    try {
      await exportPDF(previewRef, {
        filename: `請款單-${invoice.invoice_number || stage?.stage_name || invoice.id.slice(0, 8)}`,
        styleMatchers: ['inv-', 'a4-'],
        onSuccess: () => toast.success('PDF 匯出成功'),
      })
    } catch (err) {
      toast.error('匯出失敗：' + err.message, { duration: 6000 })
    }
  }

  if (loading) {
    return <QuotationDetailSkeleton />
  }

  if (!project || !invoice || !stage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AppBreadcrumbBar backTo={`/projects/${projectId}?tab=invoices`} backLabel="發票" segments={['找不到請款紀錄']} />
        <main className="mx-auto max-w-7xl px-4 py-12 text-center md:px-8">
          <p className="text-sm font-medium text-muted-foreground">找不到該請款紀錄</p>
        </main>
      </div>
    )
  }

  const backLabel = projectPrimaryLabel(project)

  return (
    <div className="min-h-screen bg-background pb-12 text-foreground transition-colors duration-200">
      <AppBreadcrumbBar
        backTo={`/projects/${projectId}?tab=invoices`}
        backLabel={backLabel}
        segments={[
          <span key="invoice" className="inline-flex flex-wrap items-center gap-2">
            <span>{invoice.invoice_number || stage.stage_name}</span>
            <InvoiceStatusBadges status={invoice.status} />
          </span>,
        ]}
        actions={
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
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <p className="mb-4 text-sm text-muted-foreground">
          {stage.stage_name} · 客戶：{project.clients?.company_name || '—'}
        </p>

        <div className="flex justify-center overflow-auto rounded-xl border border-border bg-muted/30 p-4 shadow-inner md:p-6">
          <div className="max-w-full origin-top scale-100 transform rounded-sm border border-border bg-white shadow-md">
            <InvoicePreview
              ref={previewRef}
              project={project}
              client={project.clients}
              contactPerson={project.contact_persons}
              stage={stage}
              invoice={invoice}
              disbursements={disbursements}
              companyInfo={COMPANY_INFO}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
