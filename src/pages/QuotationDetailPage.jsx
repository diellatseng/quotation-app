// src/pages/QuotationDetailPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../context/NotificationContext'
import { useExportPDF } from '../hooks/useExportPDF'
import { formatRocDate } from '../lib/rocDate'
import StatusBadge from '../components/StatusBadge'
import NegotiationPanel from '../components/NegotiationPanel'
import ServiceTable from '../components/ServiceTable'
import A4Preview from '../components/A4Preview'
import Button from '../components/Button'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

const COMPANY_INFO = {
  name: process.env.REACT_APP_COMPANY_NAME || '公司名稱',
  address: process.env.REACT_APP_COMPANY_ADDRESS || '公司地址',
  phone: process.env.REACT_APP_COMPANY_PHONE || '公司電話',
  fax: process.env.REACT_APP_COMPANY_FAX || '',
  email: process.env.REACT_APP_COMPANY_EMAIL || '',
}

export default function QuotationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error, info } = useNotification()
  const quotationRef = useRef()
  const servicesRef = useRef()

  const [qt, setQt] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [negDialog, setNegDialog] = useState(null)
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
    } catch (err) {
      error('載入失敗: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id]) // eslint-disable-line

  const updateStatus = async (newStatus) => {
    try {
      const { error: err } = await supabase
        .from('quotations')
        .update({ status: newStatus })
        .eq('id', id)

      if (err) throw err
      success(`狀態已更新為【${newStatus}】`)
      fetchData()
    } catch (err) {
      error('更新失敗: ' + err.message)
    }
  }

  const handleNegotiateSubmit = (amount, comment) => {
    setNegDialog({ amount, comment })
  }

  const createVersionAfterNegotiation = async ({ amount, comment, editServices }) => {
    setNegDialog(null)
    setLoading(true)
    try {
      const { data: updatedParent, error: upErr } = await supabase
        .from('quotations')
        .update({ is_negotiating: true })
        .eq('id', id)
        .select()
        .single()

      if (upErr) throw upErr

      const newVersion = (qt.version || 1) + 1
      const { data: newQt, error: createErr } = await supabase
        .from('quotations')
        .insert([{
          quote_number: qt.quote_number,
          version: newVersion,
          parent_id: qt.id,
          client_id: qt.client_id,
          contact_person_id: qt.contact_person_id,
          quote_date: new Date().toISOString().split('T')[0],
          fee_amount: amount,
          tax_included: qt.tax_included,
          status: '草稿',
          is_negotiating: false,
          comment: comment || `從 v${qt.version} 議價產生的新版本`
        }])
        .select()
        .single()

      if (createErr) throw createErr

      if (!editServices && services.length > 0) {
        const servicesToInsert = services.map(s => ({
          quotation_id: newQt.id,
          service_name: s.service_name,
          service_description: s.service_description,
          fee: s.fee,
          sort_order: s.sort_order
        }))
        const { error: insErr } = await supabase
          .from('quotation_services')
          .insert(servicesToInsert)

        if (insErr) throw insErr
      }

      success(`成功建立第 ${newVersion} 版草稿！`)
      if (editServices) {
        navigate(`/quotation/new?edit=${newQt.id}`)
      } else {
        navigate(`/quotation/${newQt.id}`)
      }
    } catch (err) {
      error('議價版本建立失敗: ' + err.message)
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!quotationRef.current) return
    setExporting(true)
    info('正在準備 PDF 匯出資料，請稍候…')
    try {
      await exportPDF(quotationRef.current, servicesRef.current, COMPANY_INFO)
      success('PDF 匯出成功')
    } catch (err) {
      error('匯出失敗: ' + err.message)
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
        <Button variant="normal" className="mt-4" onClick={() => navigate('/dashboard')}>
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
            <Button variant="normal" size="sm" onClick={() => navigate('/dashboard')} aria-label="返回儀表板">
              ← 返回
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {qt.quote_number}
                </h1>
                <span className="text-xs font-mono bg-muted text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  v{qt.version}
                </span>
                <StatusBadge status={qt.status} isNegotiating={qt.is_negotiating} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                客戶：{qt.clients?.company_name || '—'}
              </p>
            </div>
          </div>

          {/* Core System Actions Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="normal" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? '匯出中…' : '🖨️ 匯出 PDF'}
            </Button>

            {qt.status === '草稿' && (
              <>
                <Button variant="normal" size="sm" onClick={() => navigate(`/quotation/new?edit=${qt.id}`)}>
                  ✎ 編輯草稿
                </Button>
                <Button variant="primary" size="sm" onClick={() => updateStatus('已報價')}>
                  發送報價 (置為已報價)
                </Button>
              </>
            )}

            {qt.status === '已報價' && (
              <Button variant="primary" size="sm" onClick={() => updateStatus('已確認')}>
                客戶確認簽回
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Layout Workspace ── */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('quotation')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'quotation'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            報價單
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'services'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            服務明細
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'checklist'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            客戶準備清單
          </button>
        </div>

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

        {/* ── Custom Adaptive Dialog Modal Sheet Overlay ── */}
        {negDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200" role="dialog" aria-modal="true">
            <div className="w-full max-w-md bg-card text-card-foreground rounded-xl border border-border p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xl text-primary-foreground" aria-hidden="true">
                  📋
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  建立第 {qt.version + 1} 版報價單
                </h3>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <p>議價已記錄。系統將自動建立新版本報價單。</p>
                <p className="font-semibold text-foreground bg-muted p-2 rounded-md border border-border font-mono">
                  議價金額：{fmt(negDialog.amount)}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  ⚠️ 是否同時更改服務明細項目內容？
                </p>
              </div>

              {/* Modal Core Operational Control Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => createVersionAfterNegotiation({ ...negDialog, editServices: true })}
                >
                  ✎ 更改服務內容
                </Button>
                <Button
                  variant="normal"
                  className="w-full"
                  onClick={() => createVersionAfterNegotiation({ ...negDialog, editServices: false })}
                >
                  沿用原有服務內容
                </Button>
              </div>

              <div className="border-t border-border pt-3 text-center">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer"
                  onClick={() => setNegDialog(null)}
                >
                  稍後再說（不建立新版本）
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}