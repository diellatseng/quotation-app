// src/pages/wizard/Step6Preview.jsx
import { useRef, useState } from 'react'
import A4Preview from '../../components/A4Preview'

const COMPANY_INFO = {
  name:    process.env.REACT_APP_COMPANY_NAME    || '公司名稱',
  address: process.env.REACT_APP_COMPANY_ADDRESS || '公司地址',
  phone:   process.env.REACT_APP_COMPANY_PHONE   || '公司電話',
  fax:     process.env.REACT_APP_COMPANY_FAX     || '',
  email:   process.env.REACT_APP_COMPANY_EMAIL   || '',
}

export default function Step6Preview({ data, onFinish, saving }) {
  const previewRef = useRef()
  const [exporting, setExporting] = useState(false)

  const selectedContact = data.contacts.find(c => c.id === data.selectedContactId) || data.contacts[0] || null

  const quotation = {
    quote_number:   data.quote_number,
    version:        1,
    quote_date:     data.quote_date,
    fee_amount:     Number(data.fee_amount) || 0,
    tax_included:   data.tax_included,
    notes:          data.notes,
    building_permit: data.building_permit,
    land_section:   data.land_section,
    project_scale:  data.project_scale,
    project_owner:  data.project_owner,
    project_address: data.project_address,
  }

  const exportPDF = async () => {
    setExporting(true)
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    const el = previewRef.current
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, w, h)
    pdf.save(`報價單-${data.quote_number}.pdf`)
    setExporting(false)
  }

  return (
    <div>
      <h2 style={s.heading}>步驟 6：預覽報價單</h2>
      <p style={s.desc}>確認內容無誤後，點擊「完成並儲存」。您也可以先匯出 PDF 查看實際列印效果。</p>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={exportPDF} disabled={exporting}>
          {exporting ? '匯出中…' : '匯出 PDF 預覽'}
        </button>
        <button className="btn btn-primary" onClick={onFinish} disabled={saving}>
          {saving ? '儲存中…' : '完成並儲存'}
        </button>
      </div>

      {/* A4 preview scroll container */}
      <div style={{
        overflowX: 'auto',
        background: '#e8e6de',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
      }}>
        <div style={{ boxShadow: 'var(--shadow-lg)', display: 'inline-block', minWidth: 794 }}>
          <A4Preview
            ref={previewRef}
            quotation={quotation}
            services={data.services}
            stages={data.payment_stages.map(st => ({
              ...st,
              stage_name: st.stage_name,
            }))}
            client={data.client}
            contactPerson={selectedContact}
            companyInfo={COMPANY_INFO}
          />
        </div>
      </div>
    </div>
  )
}

const s = {
  heading: { fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' },
  desc: { fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)' },
}
