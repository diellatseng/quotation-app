// src/components/A4Preview.jsx
import { forwardRef, useRef, useEffect, useState } from 'react'
import { formatRocDate } from '../lib/rocDate'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

// ─── Physical A4 dimensions at 96 dpi ────────────────────────────────────────
const A4_W          = 794
const A4_H          = 1123
const MARGIN_TOP    = 40
const MARGIN_SIDE   = 50
const MARGIN_BOTTOM = 50   // a bit taller to leave room for footer
const PAGE_HEADER_H = 36   // continuation-page repeat header
const PAGE_FOOTER_H = 20   // "第 N / M 頁" bar
// usable content height per page (leaving room for footer inside margin)
const USABLE_H      = A4_H - MARGIN_TOP    - MARGIN_BOTTOM - PAGE_FOOTER_H
const USABLE_H_CONT = A4_H - PAGE_HEADER_H - MARGIN_BOTTOM - PAGE_FOOTER_H - MARGIN_TOP

// ─── Main component ───────────────────────────────────────────────────────────
const A4Preview = forwardRef(function A4Preview(
  { quotation, services, stages, client, contactPerson, companyInfo, negLogs = [] },
  ref,
) {
  const total      = quotation.fee_amount || 0
  const taxAmount  = quotation.tax_included ? total * 0.05 : 0
  const grandTotal = total + taxAmount
  const hasChecklist = services.some(s => (s.checklist_items || []).some(i => i.item_text?.trim()))

  const measureRef = useRef(null)
  const [pages, setPages] = useState(null)

  const sections = buildSections({ quotation, services, stages, client, contactPerson, companyInfo, total, taxAmount, grandTotal, hasChecklist, negLogs })

  // Dependency string: re-measure whenever any data that affects heights changes
  const depsKey = JSON.stringify({
    quotation,
    svcKeys: services.map(s => s.service_name + (s.description || '')),
    stages,
    client,
    contactPerson,
  })

  useEffect(() => {
    if (!measureRef.current) return
    const sectionEls = measureRef.current.querySelectorAll('[data-section]')
    const heights = Array.from(sectionEls).map(el => el.getBoundingClientRect().height + 2) // +2px safety
    setPages(paginate(sections, heights))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey])

  const totalPages = pages ? pages.length : 1

  return (
    <>
      {/* Hidden measurement layer */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: A4_W - MARGIN_SIDE * 2,
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      >
        {sections.map((sec, i) => (
          <div key={sec.key} data-section={i}>{sec.element}</div>
        ))}
      </div>

      {/* Rendered pages */}
      <div ref={ref} style={{ fontFamily: '"Noto Sans TC", "Microsoft JhengHei", sans-serif', background: 'transparent' }}>
        <style>{`
          .a4-desc ul, .a4-desc ol { padding-left: 1.4em; margin: 0.2em 0; }
          .a4-desc ul { list-style-type: disc; }
          .a4-desc ol { list-style-type: decimal; }
          .a4-desc ul ul { list-style-type: circle; }
          .a4-desc ul ul ul { list-style-type: square; }
          .a4-desc ol ol { list-style-type: lower-alpha; }
          .a4-desc li { margin: 0.1em 0; }
        `}</style>
        {(pages || [sections]).map((pageSections, pageIdx) => (
          <PageShell
            key={pageIdx}
            pageNum={pageIdx + 1}
            totalPages={totalPages}
            isFirst={pageIdx === 0}
            isLast={pageIdx === (pages || [sections]).length - 1}
            companyInfo={companyInfo}
            quotation={quotation}
          >
            {pageSections.map((sec) => (
              <div key={sec.key}>{sec.element}</div>
            ))}
          </PageShell>
        ))}
      </div>
    </>
  )
})

export default A4Preview

// ─── PageShell ────────────────────────────────────────────────────────────────
function PageShell({ children, pageNum, totalPages, isFirst, isLast, companyInfo, quotation }) {
  return (
    <div>
      {/* The A4 page box */}
      <div
        data-page={pageNum}
        style={{
          width: A4_W,
          minHeight: A4_H,
          background: '#fff',
          boxSizing: 'border-box',
          padding: `${MARGIN_TOP}px ${MARGIN_SIDE}px ${MARGIN_BOTTOM}px`,
          color: '#1a1916',
          position: 'relative',
        }}
      >
        {/* Continuation header (pages 2+) */}
        {!isFirst && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: PAGE_HEADER_H,
            marginBottom: 10,
            paddingBottom: 6,
            borderBottom: '1.5px solid #1a1916',
            fontSize: 11,
            color: '#555',
          }}>
            <span style={{ fontWeight: 700 }}>{companyInfo?.name || '公司名稱'}</span>
            <span>報價單　{quotation.quote_number}</span>
          </div>
        )}

        {/* Content */}
        <div style={{ paddingBottom: PAGE_FOOTER_H + 8 }}>
          {children}
        </div>

        {/* Footer pinned inside page box */}
        <div style={{
          position: 'absolute',
          bottom: 18,
          left: MARGIN_SIDE,
          right: MARGIN_SIDE,
          borderTop: '1px solid #e0ded8',
          paddingTop: 5,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#aaa',
        }}>
          <span>本報價單有效期限為開立日起 30 天，逾期請重新詢價。如有疑問，敬請來電洽詢。</span>
          <span style={{ whiteSpace: 'nowrap', marginLeft: 16 }}>第 {pageNum} / {totalPages} 頁</span>
        </div>
      </div>

      {/* Dashed page-break indicator between pages (preview only) */}
      {!isLast && (
        <div style={{
          width: A4_W,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#999',
          fontSize: 10,
          userSelect: 'none',
        }}>
          <div style={{ flex: 1, borderTop: '2px dashed #bbb' }} />
          <span>— 分頁線 第 {pageNum} / {totalPages} 頁 —</span>
          <div style={{ flex: 1, borderTop: '2px dashed #bbb' }} />
        </div>
      )}
    </div>
  )
}

// ─── Build content sections ───────────────────────────────────────────────────
function buildSections({ quotation, services, stages, client, contactPerson, companyInfo, total, taxAmount, grandTotal, hasChecklist, negLogs = [] }) {
  const sec = []

  // Document header (company + title + meta)
  sec.push({
    key: 'doc-header',
    element: (
      <div>
        <div style={a4.header}>
          <div style={a4.companyBlock}>
            <div style={a4.companyName}>{companyInfo?.name || '公司名稱'}</div>
            <div style={a4.companyMeta}>{companyInfo?.address}</div>
            <div style={a4.companyMeta}>電話：{companyInfo?.phone}</div>
            {companyInfo?.fax   && <div style={a4.companyMeta}>傳真：{companyInfo?.fax}</div>}
            {companyInfo?.email && <div style={a4.companyMeta}>E-mail：{companyInfo?.email}</div>}
          </div>
          <div style={a4.docTitle}>報　價　單</div>
        </div>
        <div style={a4.rule} />
        <div style={a4.metaGrid}>
          <MetaRow label="報價編號" value={`${quotation.quote_number}${quotation.version > 1 ? ` (v${quotation.version})` : ''}`} />
          <MetaRow label="報價日期" value={formatRocDate(quotation.quote_date)} />
          <MetaRow label="有效期限" value="開立日起 30 日" />
        </div>
        <div style={a4.rule} />
      </div>
    ),
  })

  // Client info
  sec.push({
    key: 'client',
    element: (
      <div style={a4.section}>
        <div style={a4.sectionLabel}>委託方資料</div>
        <div style={a4.infoGrid}>
          <MetaRow label="公司名稱" value={client?.company_name} />
          <MetaRow label="地　　址" value={client?.address} />
          {contactPerson && <MetaRow label="聯　絡　人" value={`${contactPerson.name || ''}　${contactPerson.mobile || ''}`} />}
          {contactPerson?.email && <MetaRow label="電子郵件" value={contactPerson.email} />}
        </div>
      </div>
    ),
  })

  // Project info
  if (quotation.building_permit || quotation.project_owner || quotation.land_section) {
    sec.push({
      key: 'project',
      element: (
        <div style={a4.section}>
          <div style={a4.sectionLabel}>工程資料</div>
          <div style={a4.infoGrid}>
            {quotation.project_owner   && <MetaRow label="起　造　人" value={quotation.project_owner} />}
            {quotation.building_permit && <MetaRow label="建照號碼"   value={quotation.building_permit} />}
            {quotation.land_section    && <MetaRow label="地　　段"   value={quotation.land_section} />}
            {quotation.project_scale   && <MetaRow label="工程規模"   value={quotation.project_scale} />}
            {quotation.project_name    && <MetaRow label="工程名稱"   value={quotation.project_name} />}
          </div>
        </div>
      ),
    })
  }

  // Services table — thead as its own section so it always precedes rows
  sec.push({
    key: 'svc-thead',
    element: (
      <div style={{ ...a4.section, marginBottom: 0 }}>
        <div style={a4.sectionLabel}>服務內容</div>
        <table style={a4.table}>
          <thead>
            <tr>
              <th style={{ ...a4.th, width: '6%' }}>項次</th>
              <th style={{ ...a4.th, width: '4rem', textAlign: 'left' }}>類別</th>
              <th style={{ ...a4.th, width: '25%', textAlign: 'left' }}>服務項目</th>
              <th style={{ ...a4.th, width: 'auto', textAlign: 'left' }}>說明</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    ),
  })

  // One section per service row — paginator will never split mid-row
  services.forEach((svc, idx) => {
    sec.push({
      key: `svc-row-${svc.id || idx}`,
      element: (
        <table style={{ ...a4.table, marginTop: -1 }}>
          <tbody>
            <tr style={idx % 2 === 1 ? { background: '#f9f9f7' } : {}}>
              <td style={{ ...a4.td, width: '6%',  verticalAlign: 'top', paddingTop: 8 }}>{idx + 1}</td>
              <td style={{ ...a4.td, width: '4rem', textAlign: 'left', color: '#666', fontSize: 10, verticalAlign: 'top', paddingTop: 8 }}>{svc.category || ''}</td>
              <td style={{ ...a4.td, width: '25%', textAlign: 'left', fontWeight: 400, verticalAlign: 'top', paddingTop: 8 }}>
                {svc.diff_status === 'removed' ? (
                  <span style={{ textDecoration: 'line-through', color: '#999' }}>{svc.service_name}</span>
                ) : svc.service_name}
                {svc.diff_status && (
                  <span style={{
                    display: 'inline-block', marginLeft: 5,
                    fontSize: 8, fontWeight: 700, padding: '1px 5px',
                    borderRadius: 3, verticalAlign: 'middle',
                    ...a4DiffStyle[svc.diff_status],
                  }}>
                    {svc.diff_status === 'added' ? '▲新增' : svc.diff_status === 'modified' ? '✎更改' : '✕刪除'}
                  </span>
                )}
              </td>
              <td style={{ ...a4.td, width: 'auto', textAlign: 'left', verticalAlign: 'top', padding: '6px 10px' }}>
                {svc.description
                  ? <div className="a4-desc" style={a4.descriptionCell} dangerouslySetInnerHTML={{ __html: svc.description.replace(/\n/g, '<br>') }} />
                  : <span style={{ color: '#bbb', fontSize: 10 }}>—</span>}
              </td>
            </tr>
          </tbody>
        </table>
      ),
    })
  })

  // Fee summary
  sec.push({
    key: 'fee',
    element: (
      <div style={{ ...a4.section, marginTop: 16 }}>
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
              <td style={{ ...a4.td, textAlign: 'left', color: '#fff', fontWeight: 700, padding: '8px 12px' }}>合計金額</td>
              <td style={{ ...a4.td, fontWeight: 700, color: '#fff', padding: '8px 12px' }}>{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  })

  // Negotiation history (only for versioned quotations with logs)
  if (negLogs && negLogs.length > 0) {
    sec.push({
      key: 'neg-history',
      element: (
        <div style={{ ...a4.section, marginTop: 12 }}>
          <div style={a4.sectionLabel}>議價歷程</div>
          <table style={{ ...a4.table, width: '70%', marginLeft: 'auto' }}>
            <thead>
              <tr>
                <th style={{ ...a4.th, textAlign: 'left', width: '40%' }}>議價日期</th>
                <th style={{ ...a4.th, textAlign: 'left' }}>原報價</th>
                <th style={a4.th}>議價後</th>
              </tr>
            </thead>
            <tbody>
              {negLogs.map((log, i) => (
                <tr key={log.id || i} style={i % 2 === 1 ? { background: '#f9f9f7' } : {}}>
                  <td style={{ ...a4.td, textAlign: 'left', fontSize: 10 }}>
                    {new Date(log.logged_at).toLocaleDateString('zh-TW')}
                    {log.notes && <div style={{ color: '#888', fontSize: 9, marginTop: 2 }}>{log.notes}</div>}
                  </td>
                  <td style={{ ...a4.td, textAlign: 'left', fontSize: 10, color: '#888' }}>
                    <s>{fmt(log.old_amount)}</s>
                  </td>
                  <td style={{ ...a4.td, fontWeight: 700, fontSize: 10 }}>{fmt(log.new_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    })
  }

  // Payment stages
  if (stages.length > 0) {
    sec.push({
      key: 'stages',
      element: (
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
      ),
    })
  }

  // Notes
  if (quotation.notes) {
    sec.push({
      key: 'notes',
      element: (
        <div style={a4.section}>
          <div style={a4.sectionLabel}>備註</div>
          <div style={a4.notesBox}>{quotation.notes}</div>
        </div>
      ),
    })
  }

  // Signatures
  sec.push({
    key: 'signatures',
    element: (
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
    ),
  })

  // Checklist appendix — always starts on a new page
  if (hasChecklist) {
    sec.push({
      key: 'checklist-header',
      forceNewPage: true,   // ← paginator will always break before this section
      element: (
        <div style={{ marginTop: 8 }}>
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
        </div>
      ),
    })

    services
      .filter(s => (s.checklist_items || []).some(i => i.item_text?.trim()))
      .forEach((svc, sIdx) => {
        sec.push({
          key: `checklist-svc-${svc.id || sIdx}`,
          element: (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, background: '#1a1916', color: '#fff', padding: '5px 10px', borderRadius: 4, marginBottom: 8 }}>
                {svc.service_name}
              </div>
              <table style={{ ...a4.table, fontSize: 11 }}>
                <tbody>
                  {(svc.checklist_items || []).filter(i => i.item_text?.trim()).map((item, iIdx) => (
                    <tr key={item.id || iIdx}>
                      <td style={{ ...a4.td, width: '5%', textAlign: 'center' }}>{iIdx + 1}</td>
                      <td style={{ ...a4.td, width: '5%', textAlign: 'center' }}>□</td>
                      <td style={{ ...a4.td, textAlign: 'left' }}>{item.item_text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        })
      })
  }

  return sec
}

// ─── Paginator ────────────────────────────────────────────────────────────────
function paginate(sections, heights) {
  const pages = []
  let cur     = []
  let used    = 0
  let isFirst = true

  const cap = () => isFirst ? USABLE_H : USABLE_H_CONT

  sections.forEach((sec, i) => {
    const h = heights[i] || 0

    // Force a page break before this section if flagged, or if it won't fit
    const mustBreak = sec.forceNewPage || (used + h > cap() && cur.length > 0)

    if (mustBreak && cur.length > 0) {
      pages.push(cur)
      cur     = []
      used    = 0
      isFirst = false
    }
    cur.push(sec)
    used += h
  })

  if (cur.length > 0) pages.push(cur)
  return pages.length > 0 ? pages : [[]]
}

// ─── Shared sub-component ─────────────────────────────────────────────────────
function MetaRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: '#888', width: 70, flexShrink: 0, borderRight: '1px solid #ddd', paddingRight: 6 }}>{label}</span>
      <span style={{ fontSize: 12, flex: 1, wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const a4 = {
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  companyBlock:    { flex: 1 },
  companyName:     { fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 },
  companyMeta:     { fontSize: 11, color: '#555', lineHeight: 1.7 },
  docTitle:        { fontSize: 22, fontWeight: 700, letterSpacing: '0.25em', alignSelf: 'center', color: '#1a1916' },
  rule:            { borderTop: '2.5px solid #1a1916', margin: '12px 0' },
  metaGrid:        { display: 'flex', gap: 32, marginBottom: 8, flexWrap: 'wrap' },
  section:         { marginBottom: 16 },
  sectionLabel:    { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #ddd' },
  infoGrid:        { paddingLeft: 8 },
  table:           { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:              { background: '#1a1916', color: '#fff', padding: '7px 10px', textAlign: 'center', fontWeight: 700, fontSize: 11, border: '1px solid #1a1916' },
  td:              { padding: '6px 10px', textAlign: 'center', border: '1px solid #d4d2cb', color: '#333', fontSize: 12 },
  notesBox:        { background: '#f9f9f7', border: '1px solid #e0ded8', borderRadius: 4, padding: '10px 12px', fontSize: 11, lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  descriptionCell: {
    fontSize: 10, lineHeight: 1.6, color: '#333', wordBreak: 'break-word',
    // ensure ul/ol indent renders correctly in PDF
  },
  sigRow:          { display: 'flex', gap: 40, marginTop: 32, marginBottom: 24 },
  sigBlock:        { flex: 1 },
  sigTitle:        { fontSize: 12, fontWeight: 700, marginBottom: 24 },
  sigLine:         { borderTop: '1px solid #333', marginBottom: 8 },
  sigLabel2:       { fontSize: 11, color: '#555', marginTop: 6 },
}

const a4DiffStyle = {
  added:    { background: '#dcfce7', color: '#166534' },
  modified: { background: '#fef9c3', color: '#854d0e' },
  removed:  { background: '#fee2e2', color: '#991b1b' },
}
