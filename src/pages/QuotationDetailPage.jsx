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
  const quotationRef = useRef()  // quotation
  const servicesRef = useRef()  // services appendix
  const checklistRef = useRef()  // checklist appendix

  const [qt, setQt] = useState(null)
  const [services, setServices] = useState([])
  const [stages, setStages] = useState([])
  const [negLogs, setNegLogs] = useState([])
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('quotation')  // 'quotation' | 'services' | 'checklist'
  const [negDialog, setNegDialog] = useState(null)
  const [showVersions, setShowVersions] = useState(false) // { amount, notes }
  const [emailing, setEmailing] = useState(false)

  const { exporting, exportPDF } = useExportPDF()

  // Pick the correct ref for the active tab
  const activeRef = tab === 'services' ? servicesRef : tab === 'checklist' ? checklistRef : quotationRef

  const load = async () => {
    setLoading(true)
    const [{ data: q }, { data: sv }, { data: st }, { data: nl }] = await Promise.all([
      supabase.from('quotations')
        .select('*, clients(*), contact_persons(*)')
        .eq('id', id).single(),
      supabase.from('quotation_services').select('*').eq('quotation_id', id).order('sort_order'),
      supabase.from('payment_stages').select('*').eq('quotation_id', id).order('sort_order'),
      supabase.from('negotiation_log').select('*').eq('quotation_id', id).order('logged_at', { ascending: false }),
    ])
    if (!q) { error('找不到報價單'); navigate('/dashboard'); return }
    setQt(q)
    setServices(sv || [])
    setStages(st || [])
    setNegLogs(nl || [])

    // Load version chain
    if (q.parent_id || q.version > 1) {
      const { data: chain } = await supabase
        .from('quotations')
        .select('id, quote_number, version, status, created_at, fee_amount')
        .or(`id.eq.${q.parent_id || id},parent_id.eq.${q.parent_id || id},id.eq.${id}`)
        .order('version')
      setVersions(chain || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line

  const setStatus = async (status) => {
    await supabase.from('quotations').update({ status }).eq('id', qt.id)
    setQt(q => ({ ...q, status }))
    success(`狀態已更新為「${status}」`)
  }

  const sendEmail = async () => {
    const recipientEmail = qt.contact_persons?.email || qt.clients?.email
    if (!recipientEmail) { error('聯絡人或客戶無電子郵件，無法發送'); return }

    const ejsKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY
    const ejsSvc = process.env.REACT_APP_EMAILJS_SERVICE_ID
    const ejsTmpl = process.env.REACT_APP_EMAILJS_TEMPLATE_ID

    if (!ejsKey || !ejsSvc || !ejsTmpl) {
      error('尚未設定 EmailJS 設定值，請參閱 README 完成設定')
      return
    }

    setEmailing(true)
    info('正在產生 PDF 並發送…')

    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')
      const pageEls = quotationRef.current.querySelectorAll('[data-page]')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      for (let i = 0; i < pageEls.length; i++) {
        if (i > 0) pdf.addPage()
        const canvas = await html2canvas(pageEls[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
        const imgH = (canvas.height * pdfW) / canvas.width
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, Math.min(imgH, pdfH))
      }
      const pdfBase64 = pdf.output('datauristring')

      const emailjs = await import('emailjs-com')

      await emailjs.send(ejsSvc, ejsTmpl, {
        to_email: recipientEmail,
        to_name: qt.contact_persons?.name || qt.clients?.company_name || '',
        quote_number: qt.quote_number,
        client_name: qt.clients?.company_name || '',
        amount: fmt(grand),
        quote_date: formatRocDate(qt.quote_date),
        company_name: COMPANY_INFO.name,
        pdf_content: pdfBase64,
      }, ejsKey)

      // Auto-set to 已報價
      await setStatus('已報價')
      success(`報價單已發送至 ${recipientEmail}`)
    } catch (e) {
      error('發送失敗：' + (e?.text || e?.message || '未知錯誤'))
    }
    setEmailing(false)
  }

  const createVersionAfterNegotiation = async ({ amount, notes: negNotes, editServices }) => {
    setNegDialog(null)
    // Build new version row
    const { data: newQt, error: err } = await supabase.from('quotations').insert([{
      quote_number: qt.quote_number,
      version: qt.version + 1,
      parent_id: qt.parent_id || qt.id,
      status: '草稿',
      project_id: qt.project_id,
      client_id: qt.client_id,
      contact_person_id: qt.contact_person_id,
      project_template_id: qt.project_template_id,
      building_permit: qt.building_permit,
      land_section: qt.land_section,
      project_scale: qt.project_scale,
      project_owner: qt.project_owner,
      project_name: qt.project_name,
      fee_amount: amount,
      tax_included: qt.tax_included,
      quote_date: new Date().toISOString().split('T')[0],
      notes: qt.notes,
      is_negotiating: true,
      created_by: user.id,
    }]).select().single()
    if (err || !newQt) { error('建立新版本失敗：' + (err?.message || '')); return }

    // Copy services — all unchanged initially (diff will be computed in wizard if editServices)
    const newServices = services.map((s, i) => ({
      quotation_id: newQt.id,
      service_id: s.service_id,
      service_name: s.service_name,
      category: s.category,
      description: s.description || null,
      checklist_items: s.checklist_items || [],
      sort_order: i,
      is_added: false,
      diff_status: null,
    }))
    if (newServices.length) await supabase.from('quotation_services').insert(newServices)

    // Copy payment stages (with project_id)
    const newStages = stages.map((st, i) => ({
      quotation_id: newQt.id,
      project_id: qt.project_id,
      stage_name: st.stage_name,
      percentage: st.percentage,
      amount: st.amount,
      sort_order: i,
    }))
    if (newStages.length) await supabase.from('payment_stages').insert(newStages)

    if (editServices) {
      // Go to wizard step 3, carrying negotiation context
      navigate(`/quotation/new?edit=${newQt.id}&step=3&negAmount=${amount}&negNotes=${encodeURIComponent(negNotes || '')}`)
    } else {
      success('新版本報價單已建立')
      navigate(`/quotation/${newQt.id}`)
    }
  }

  const handleNegLogged = (payload) => {
    load()
    setNegDialog(payload)
  }

  if (loading) return (
    <div className="detail-loading">
      載入中…
    </div>
  )

  const contactPerson = qt.contact_persons
  const fee = qt.fee_amount || 0
  const grand = fee + (qt.tax_included ? fee * 0.05 : 0)

  return (
    <div className="detail-page">
      {/* Header */}
      <header className="detail-header">
        <div className="detail-header__left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ← 返回
          </button>
          <div>
            <div className="detail-header__title-row">
              <h1 className="detail-header__title">{qt.quote_number}</h1>
              {qt.version > 1 && (
                <span className="detail-header__version">
                  v{qt.version}
                </span>
              )}
              <StatusBadge status={qt.status} isNegotiating={qt.is_negotiating} size="sm" />
            </div>
            <p className="detail-header__subtitle">{qt.clients?.company_name} ／ {formatRocDate(qt.quote_date)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="detail-header__actions">
          <button
            className="btn btn-sm"
            onClick={() => exportPDF(activeRef, {
              filename: `${
                tab === 'services'  ? '服務說明' :
                tab === 'checklist' ? '準備清單' : '報價單'
              }-${qt?.quote_number || ''}`,
              onSuccess: async () => {
                if (tab === 'quotation' && qt.status === '草稿') {
                  if (window.confirm('是否將狀態更新為「已報價」？')) setStatus('已報價')
                }
              },
            })}
            disabled={exporting}
          >
            {exporting ? '匯出中…' : '匯出 PDF'}
          </button>
          {qt.status === '草稿' && (
            <button className="btn btn-sm" onClick={() => setStatus('已報價')}>
              標記為已報價
            </button>
          )}
          {qt.status === '已報價' && (
            <button className="btn btn-sm" onClick={() => setStatus('已確認')}>
              標記為已確認
            </button>
          )}
          {qt.status === '已確認' && (
            <button className="btn btn-sm" onClick={() => setStatus('已結案')}>
              標記為已結案
            </button>
          )}
        </div>
      </header>

      <main className="page-body">
        {/* Version history */}
        {versions.length > 1 && (
          <div className="detail-versions">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowVersions(v => !v)}>
              {showVersions ? '隱藏' : '查看'}版本歷程（共 {versions.length} 版）
            </button>
            {showVersions && (
              <div className="detail-versions__list">
                {versions.map(v => (
                  <button key={v.id} className="btn btn-sm btn-secondary"
                    data-current={v.id === id}
                    onClick={() => navigate(`/quotation/${v.id}`)}>
                    v{v.version} — {fmt(v.fee_amount)} — <StatusBadge status={v.status} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary cards */}
        <div className="detail-summary">
          {[
            { label: '合計金額', value: fmt(grand) },
            { label: '服務項目', value: `${services.length} 項` },
            { label: '付款階段', value: `${stages.length} 階段` },
            // { label: '議價次數', value: `${negLogs.length} 次` },
          ].map(c => (
            <div key={c.label} className="stat-card detail-summary__card">
              <p className="stat-card__label">{c.label}</p>
              <p className="stat-card__value">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="tab-bar detail-tabs" role="tablist">
          {[
            { key: 'quotation', label: '報價單' },
            { key: 'services', label: '服務細項說明' },
            { key: 'checklist', label: '準備資料清單' },
            // { key: 'negotiation', label: `議價記錄（${negLogs.length}）` },
          ].map(t => (
            <button
              key={t.key}
              className="tab-item"
              onClick={() => setTab(t.key)}
              aria-selected={tab === t.key}
              role="tab"
            >{t.label}</button>
          ))}
        </div>

        {/* Tab content — all three panels stay mounted so their refs are always
             populated. Inactive panels are hidden with display:none so the
             export hook can always read [data-page] elements from the active ref. */}
        <div style={{ display: tab === 'quotation' ? '' : 'none' }}>
          <div className="detail-preview-tray">
            <div className="detail-preview-paper">
              <A4Preview
                ref={quotationRef}
                mode="quotation"
                quotation={qt}
                services={services}
                stages={stages}
                client={qt.clients}
                contactPerson={contactPerson}
                companyInfo={COMPANY_INFO}
                negLogs={negLogs}
              />
            </div>
          </div>
        </div>

        <div style={{ display: tab === 'services' ? '' : 'none' }}>
          <div className="detail-preview-tray">
            <div className="detail-preview-paper">
              <A4Preview
                ref={servicesRef}
                mode="services"
                quotation={qt}
                services={services}
                stages={stages}
                client={qt.clients}
                contactPerson={contactPerson}
                companyInfo={COMPANY_INFO}
              />
            </div>
          </div>
        </div>

        <div style={{ display: tab === 'checklist' ? '' : 'none' }}>
          <div className="detail-preview-tray">
            <div className="detail-preview-paper">
              <A4Preview
                ref={checklistRef}
                mode="checklist"
                quotation={qt}
                services={services}
                stages={stages}
                client={qt.clients}
                contactPerson={contactPerson}
                companyInfo={COMPANY_INFO}
              />
            </div>
          </div>
        </div>

        {/* {tab === 'negotiation' && (
          <div className="card">
            <p className="section-title">議價記錄</p>
            <NegotiationPanel
              quotationId={qt.id}
              currentAmount={qt.fee_amount}
              logs={negLogs}
              onLogged={handleNegLogged}
            />
          </div>
        )} */}

        {/* Post-negotiation version dialog */}
        {negDialog && (
          <div className="detail-dialog">
            <div className="detail-dialog__content">
              <div className="detail-dialog__icon">📋</div>
              <h2 className="detail-dialog__title">
                建立第 {qt.version + 1} 版報價單
              </h2>
              <p className="detail-dialog__body">
                議價已記錄。系統將自動建立新版本報價單（議價金額：NT$ {Number(negDialog.amount).toLocaleString('zh-TW')}）。
              </p>
              <p className="detail-dialog__question">
                是否同時更改服務內容？
              </p>
              <div className="detail-dialog__actions">
                <button
                  className="btn btn-primary"
                  onClick={() => createVersionAfterNegotiation({ ...negDialog, editServices: true })}
                >
                  ✎ 更改服務內容
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => createVersionAfterNegotiation({ ...negDialog, editServices: false })}
                >
                  沿用原有服務內容
                </button>
              </div>
              <div className="detail-dialog__footer">
                <button
                  className="btn btn-ghost btn-sm"
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
