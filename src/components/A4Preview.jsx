// src/components/A4Preview.jsx
import { forwardRef } from 'react'
import { formatRocDate } from '../lib/rocDate'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

const A4Preview = forwardRef(function A4Preview({ quotation, services, stages, client, contactPerson, companyInfo }, ref) {
  const total = quotation.fee_amount || 0
  const taxAmount = quotation.tax_included ? total * 0.05 : 0
  const grandTotal = total + taxAmount

  const hasChecklist = services.some(s => (s.checklist_items || []).some(i => i.item_text?.trim()))

  return (
    <div ref={ref} style={a4.wrapper}>
      {/* ═══ PAGE 1: QUOTATION ═══ */}
      <div style={a4.page}>
        {/* Company header */}
        <div style={a4.header}>
          <div style={a4.companyBlock}>
            <div style={a4.companyName}>{companyInfo?.name || '公司名稱'}</div>
            <div style={a4.companyMeta}>{companyInfo?.address}</div>
            <div style={a4.companyMeta}>電話：{companyInfo?.phone}</div>
            {companyInfo?.fax && <div style={a4.companyMeta}>傳真：{companyInfo?.fax}</div>}
            {companyInfo?.email && <div style={a4.companyMeta}>E-mail：{companyInfo?.email}</div>}
          </div>
          <div style={a4.docTitle}>報　價　單</div>
        </div>

        <div style={a4.rule} />

        {/* Quote meta */}
        <div style={a4.metaGrid}>
          <MetaRow label="報價編號" value={`${quotation.quote_number}${quotation.version > 1 ? ` (v${quotation.version})` : ''}`} />
          <MetaRow label="報價日期" value={formatRocDate(quotation.quote_date)} />
          <MetaRow label="有效期限" value="開立日起 30 日" />
        </div>

        <div style={a4.rule} />

        {/* Client info */}
        <div style={a4.section}>
          <div style={a4.sectionLabel}>委託方資料</div>
          <div style={a4.infoGrid}>
            <MetaRow label="公司名稱" value={client?.company_name} />
            <MetaRow label="地　　址" value={client?.address} />
            {contactPerson && <MetaRow label="聯　絡　人" value={`${contactPerson.name || ''}　${contactPerson.mobile || ''}`} />}
            {contactPerson?.email && <MetaRow label="電子郵件" value={contactPerson.email} />}
          </div>
        </div>

        {/* Project info */}
        {(quotation.building_permit || quotation.project_owner || quotation.land_section) && (
          <div style={a4.section}>
            <div style={a4.sectionLabel}>工程資料</div>
            <div style={a4.infoGrid}>
              {quotation.project_owner && <MetaRow label="起　造　人" value={quotation.project_owner} />}
              {quotation.building_permit && <MetaRow label="建照號碼" value={quotation.building_permit} />}
              {quotation.land_section && <MetaRow label="地　　段" value={quotation.land_section} />}
              {quotation.project_scale && <MetaRow label="工程規模" value={quotation.project_scale} />}
              {quotation.project_name && <MetaRow label="工程名稱" value={quotation.project_name} />}
            </div>
          </div>
        )}

        {/* Services */}
        <div style={a4.section}>
          <div style={a4.sectionLabel}>服務內容</div>
          <table style={a4.table}>
            <thead>
              <tr>
                <th style={{ ...a4.th, width: '8%' }}>項次</th>
                <th style={{ ...a4.th, width: '30%', textAlign: 'left' }}>類別</th>
                <th style={{ ...a4.th, width: '62%', textAlign: 'left' }}>服務項目</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc, idx) => (
                <tr key={svc.id || idx} style={idx % 2 === 1 ? { background: '#f9f9f7' } : {}}>
                  <td style={a4.td}>{idx + 1}</td>
                  <td style={{ ...a4.td, textAlign: 'left', color: '#666', fontSize: 11 }}>{svc.category || ''}</td>
                  <td style={{ ...a4.td, textAlign: 'left', fontWeight: svc.is_added ? 600 : 400 }}>
                    {svc.service_name}
                    {svc.is_added && <span style={{ marginLeft: 6, fontSize: 10, color: '#1a5fad' }}>▲新增</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fee */}
        <div style={a4.section}>
          <div style={a4.sectionLabel}>報價金額</div>
          <table style={{ ...a4.table, width: '60%', marginLeft: 'auto' }}>
            <tbody>
              <tr>
                <td style={{ ...a4.td, textAlign: 'left' }}>服務費用（未稅）</td>
                <td style={{ ...a4.td, fontWeight: 700 }}>{fmt(total)}</td>
              </tr>
              {quotation.tax_included && (
                <tr>
                  <td style={{ ...a4.td, textAlign: 'left' }}>營業稅（5%）</td>
                  <td style={a4.td}>{fmt(taxAmount)}</td>
                </tr>
              )}
              <tr style={{ background: '#1a1916', color: '#fff' }}>
                <td style={{ ...a4.td, textAlign: 'left', color: '#fff', fontWeight: 700, padding: '8px 12px' }}>
                  合計金額
                </td>
                <td style={{ ...a4.td, fontWeight: 700, color: '#fff', padding: '8px 12px' }}>
                  {fmt(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment stages */}
        {stages.length > 0 && (
          <div style={a4.section}>
            <div style={a4.sectionLabel}>收款方式</div>
            <table style={a4.table}>
              <thead>
                <tr>
                  <th style={{ ...a4.th, textAlign: 'left', width: '50%' }}>付款階段</th>
                  <th style={a4.th}>百分比</th>
                  <th style={a4.th}>金額</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((st, idx) => (
                  <tr key={st.id || idx}>
                    <td style={{ ...a4.td, textAlign: 'left' }}>{st.stage_name}</td>
                    <td style={a4.td}>{st.percentage}%</td>
                    <td style={{ ...a4.td, fontWeight: 600 }}>{fmt(st.percentage / 100 * grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        {quotation.notes && (
          <div style={a4.section}>
            <div style={a4.sectionLabel}>備註</div>
            <div style={a4.notesBox}>{quotation.notes}</div>
          </div>
        )}

        {/* Signatures */}
        <div style={a4.sigRow}>
          <div style={a4.sigBlock}>
            <div style={a4.sigTitle}>立約方（甲方）</div>
            <div style={a4.sigLine} />
            <div style={a4.sigLabel2}>簽名：________________</div>
            <div style={a4.sigLabel2}>日期：________________</div>
          </div>
          <div style={a4.sigBlock}>
            <div style={a4.sigTitle}>承包方（乙方）</div>
            <div style={a4.sigLine} />
            <div style={a4.sigLabel2}>簽名：________________</div>
            <div style={a4.sigLabel2}>日期：________________</div>
          </div>
        </div>

        <div style={a4.footer}>
          本報價單有效期限為開立日起 30 天，逾期請重新詢價。如有疑問，敬請來電洽詢。
        </div>
      </div>

      {/* ═══ PAGE 2: APPENDIX CHECKLIST (only if any items exist) ═══ */}
      {hasChecklist && (
        <div style={{ ...a4.page, marginTop: 32, borderTop: '3px dashed #ccc', paddingTop: 40 }}>
          <div style={a4.header}>
            <div style={a4.companyBlock}>
              <div style={a4.companyName}>{companyInfo?.name || '公司名稱'}</div>
            </div>
            <div style={{ ...a4.docTitle, fontSize: 18 }}>附件：客戶準備資料清單</div>
          </div>
          <div style={a4.rule} />
          <div style={{ fontSize: 11, color: '#666', marginBottom: 16 }}>
            報價單號：{quotation.quote_number} ／ 客戶：{client?.company_name}
          </div>

          {services
            .filter(s => (s.checklist_items || []).some(i => i.item_text?.trim()))
            .map((svc, sIdx) => (
              <div key={svc.id || sIdx} style={{ marginBottom: 20 }}>
                <div style={{
                  fontWeight: 700, fontSize: 13,
                  background: '#1a1916', color: '#fff',
                  padding: '5px 10px', borderRadius: 4,
                  marginBottom: 8,
                }}>
                  {svc.service_name}
                </div>
                <table style={{ ...a4.table, fontSize: 11 }}>
                  <tbody>
                    {(svc.checklist_items || [])
                      .filter(i => i.item_text?.trim())
                      .map((item, iIdx) => (
                        <tr key={item.id || iIdx}>
                          <td style={{ ...a4.td, width: '5%', textAlign: 'center' }}>{iIdx + 1}</td>
                          <td style={{ ...a4.td, width: '5%', textAlign: 'center' }}>□</td>
                          <td style={{ ...a4.td, textAlign: 'left' }}>{item.item_text}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))}

          <div style={a4.footer}>
            請於開工前備齊以上資料並交予本公司，以利作業進行。感謝您的配合。
          </div>
        </div>
      )}
    </div>
  )
})

export default A4Preview

function MetaRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: '#888', width: 70, flexShrink: 0, borderRight: '1px solid #ddd', paddingRight: 6 }}>{label}</span>
      <span style={{ fontSize: 12, flex: 1, wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

const a4 = {
  wrapper: {
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
    background: '#fff',
  },
  page: {
    width: 794,
    minHeight: 1123,
    padding: '40px 50px',
    background: '#fff',
    boxSizing: 'border-box',
    color: '#1a1916',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  companyBlock: { flex: 1 },
  companyName: { fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 },
  companyMeta: { fontSize: 11, color: '#555', lineHeight: 1.7 },
  docTitle: {
    fontSize: 22, fontWeight: 700,
    letterSpacing: '0.25em',
    alignSelf: 'center',
    color: '#1a1916',
  },
  rule: { borderTop: '2.5px solid #1a1916', margin: '12px 0' },
  metaGrid: { display: 'flex', gap: 32, marginBottom: 8, flexWrap: 'wrap' },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    color: '#888', textTransform: 'uppercase',
    marginBottom: 8, paddingBottom: 4,
    borderBottom: '1px solid #ddd',
  },
  infoGrid: { paddingLeft: 8 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    background: '#1a1916', color: '#fff',
    padding: '7px 10px', textAlign: 'center',
    fontWeight: 700, fontSize: 11,
    border: '1px solid #1a1916',
  },
  td: {
    padding: '6px 10px', textAlign: 'center',
    border: '1px solid #d4d2cb', color: '#333',
    fontSize: 12,
  },
  notesBox: {
    background: '#f9f9f7', border: '1px solid #e0ded8',
    borderRadius: 4, padding: '10px 12px',
    fontSize: 11, lineHeight: 1.8, whiteSpace: 'pre-wrap',
  },
  sigRow: { display: 'flex', gap: 40, marginTop: 32, marginBottom: 24 },
  sigBlock: { flex: 1 },
  sigTitle: { fontSize: 12, fontWeight: 700, marginBottom: 24 },
  sigLine: { borderTop: '1px solid #333', marginBottom: 8 },
  sigLabel2: { fontSize: 11, color: '#555', marginTop: 6 },
  footer: {
    marginTop: 16, paddingTop: 10,
    borderTop: '1px solid #e0ded8',
    fontSize: 10, color: '#aaa', textAlign: 'center',
  },
}
