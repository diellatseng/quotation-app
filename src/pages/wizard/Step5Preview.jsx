// src/pages/wizard/Step5Preview.jsx
import { useRef, useState } from 'react'
import A4Preview from '../../components/A4Preview'

const COMPANY_INFO = {
  name:    process.env.REACT_APP_COMPANY_NAME    || '公司名稱',
  address: process.env.REACT_APP_COMPANY_ADDRESS || '公司地址',
  phone:   process.env.REACT_APP_COMPANY_PHONE   || '公司電話',
  fax:     process.env.REACT_APP_COMPANY_FAX     || '',
  email:   process.env.REACT_APP_COMPANY_EMAIL   || '',
}

export default function Step5Preview({ data, onFinish, saving, negContext }) {
  const previewRef = useRef()
  const [exporting, setExporting] = useState(false)

  const selectedContact = data.contacts.find(c => c.id === data.selectedContactId) || data.contacts[0] || null

  const quotation = {
    quote_number:    data.quote_number,
    version:         data.version || 1,
    quote_date:      data.quote_date,
    fee_amount:      Number(data.fee_amount) || 0,
    tax_included:    data.tax_included,
    notes:           data.notes,
    building_permit: data.building_permit,
    land_section:    data.land_section,
    project_scale:   data.project_scale,
    project_owner:   data.project_owner,
    project_name:    data.project_name,
  }

  const exportPDF = async () => {
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      // Each explicit page box rendered by A4Preview
      const pageEls = previewRef.current.querySelectorAll('[data-page]')
      if (!pageEls.length) return

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()   // 210 mm
      const pdfH = pdf.internal.pageSize.getHeight()  // 297 mm

      for (let i = 0; i < pageEls.length; i++) {
        if (i > 0) pdf.addPage()

        const canvas = await html2canvas(pageEls[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: pageEls[i].offsetWidth,
          height: pageEls[i].offsetHeight,
        })

        // Fit canvas into full A4 page (page boxes are already A4-proportioned)
        const imgH = (canvas.height * pdfW) / canvas.width
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, Math.min(imgH, pdfH))
      }

      pdf.save(`報價單-${data.quote_number}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <h2 style={s.heading}>步驟 5：預覽報價單</h2>
      <p style={s.desc}>確認內容無誤後，點擊「完成並儲存」。您也可以先匯出 PDF 查看實際列印效果。</p>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={exportPDF} disabled={exporting}>
          {exporting ? '匯出中…' : '匯出 PDF 預覽'}
        </button>
      </div>

      {/* A4 preview container — expands to fit A4 width (794 px), scrolls horizontally
          only on very narrow screens. No transform scaling so PDF export is pixel-perfect. */}
      <div style={{
        overflowX: 'auto',
        background: '#e8e6de',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
      }}>
        <div style={{ display: 'inline-block', boxShadow: 'var(--shadow-lg)', verticalAlign: 'top' }}>
          <A4Preview
            ref={previewRef}
            quotation={quotation}
            services={data.services}
            stages={data.payment_stages}
            client={data.client}
            contactPerson={selectedContact}
            companyInfo={COMPANY_INFO}
            negLogs={negContext ? [{
              id: 'preview',
              logged_at: new Date().toISOString(),
              old_amount: null,
              new_amount: negContext.amount,
              notes: negContext.notes,
            }] : []}
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
