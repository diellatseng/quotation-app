import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { useExportPDF } from '../hooks/useExportPDF'
import InvoicePreview from '../components/InvoicePreview'
import { Button } from '@/components/ui/button'
import { InvoiceStatusBadges } from '@/components/ui/badge'
import { QuotationDetailSkeleton } from '@/components/skeletons'
import { AppBreadcrumbBar } from '@/components/AppShellHeader'
import { projectPrimaryLabel } from '../lib/projectDisplay'
import { companyProfileToInfo } from '../lib/companyProfile'
import { todayCe } from '../lib/rocDate'
import { Pencil, Printer } from 'lucide-react'

export default function InvoiceDetailPage() {
  const { projectId, invoiceId } = useParams()
  const navigate = useNavigate()
  const previewRef = useRef(null)

  const [project, setProject] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [stage, setStage] = useState(null)
  const [disbursements, setDisbursements] = useState([])
  const [loading, setLoading] = useState(true)

  const { exporting, exportPDF } = useExportPDF()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .select(`
          *,
          bank_accounts(*)
        `)
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
          contact_persons(*),
          company_profiles(*)
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
  }, [projectId, invoiceId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateStatus = async (newStatus) => {
    try {
      const patch = { status: newStatus }
      if (newStatus === '已收款') {
        patch.received_at = todayCe()
      }
      const { error } = await supabase
        .from('invoices')
        .update(patch)
        .eq('id', invoiceId)
      if (error) throw error
      toast.success(`狀態已更新為【${newStatus}】`)
      fetchData()
    } catch (err) {
      toast.error('更新失敗：' + err.message, { duration: 6000 })
    }
  }

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
        <AppBreadcrumbBar backTo={`/projects/${projectId}?tab=invoices`} backLabel="請款單" segments={['找不到請款紀錄']} />
        <main className="mx-auto max-w-7xl px-4 py-12 text-center md:px-8">
          <p className="text-sm font-medium text-foreground">找不到該請款紀錄</p>
        </main>
      </div>
    )
  }

  const backLabel = projectPrimaryLabel(project)
  const companyInfo = companyProfileToInfo(project.company_profiles)

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

            {invoice.status === '草稿' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                  onClick={() => navigate(`/projects/${projectId}?tab=invoices&editInvoice=${invoice.id}`)}
                >
                  <Pencil data-icon="inline-start" />
                  編輯草稿
                </Button>
                <Button variant="default" size="sm" className="font-semibold" onClick={() => updateStatus('已請款')}>
                  送出請款 (置為已請款)
                </Button>
              </>
            )}

            {invoice.status === '已請款' && (
              <Button variant="default" size="sm" className="font-semibold" onClick={() => updateStatus('已收款')}>
                標記已收款
              </Button>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <p className="mb-4 text-sm font-medium text-foreground">
          {stage.stage_name} · 客戶：{project.clients?.company_name || '—'}
        </p>

        <div className="flex justify-center overflow-auto rounded-xl border border-border bg-muted/30 p-4 shadow-inner md:p-6">
          <div className="max-w-full origin-top scale-100 transform rounded-sm border border-border bg-card shadow-md">
            <InvoicePreview
              ref={previewRef}
              project={project}
              client={project.clients}
              contactPerson={project.contact_persons}
              stage={stage}
              invoice={invoice}
              disbursements={disbursements}
              companyInfo={companyInfo}
              bankAccount={invoice.bank_accounts}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
