// src/components/A4Preview.jsx
import { forwardRef, useRef, useEffect, useState } from 'react'
import { formatRocDate } from '../lib/rocDate'
import { FEATURE_VERSIONING } from '../lib/featureFlags'
import '../styles/components/A4Preview.css'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

// ─── Physical A4 dimensions at 96 dpi ────────────────────────────────────────
const A4_W = 794
const A4_H = 1123
const MARGIN_TOP = 40
const MARGIN_SIDE = 50
const MARGIN_BOTTOM = 50
const PAGE_HEADER_H = 36
const PAGE_FOOTER_H = 20
const USABLE_H = A4_H - MARGIN_TOP - MARGIN_BOTTOM - PAGE_FOOTER_H
const USABLE_H_CONT = A4_H - PAGE_HEADER_H - MARGIN_BOTTOM - PAGE_FOOTER_H - MARGIN_TOP

// ─── Main component ───────────────────────────────────────────────────────────
const A4Preview = forwardRef(function A4Preview(
  {
    quotation,
    services = [],
    stages = [],
    client,
    contactPerson,
    companyInfo,
    negLogs = [],
    mode = 'quotation'
  },
  ref,
) {
  const total = quotation.fee_amount || 0
  const taxAmount = quotation.tax_included ? total * 0.05 : 0
  const grandTotal = total + taxAmount
  const measureRef = useRef(null)
  const [pages, setPages] = useState(null)

  const sections = buildSections({
    mode, quotation, services, stages, client, contactPerson,
    companyInfo, total, taxAmount, grandTotal, negLogs,
  })

  const depsKey = JSON.stringify({
    mode,
    quotation,
    svcKeys: services.map(s => s.service_name + (s.description || '')),
    stages, client, contactPerson,
  })

  useEffect(() => {
    if (!measureRef.current) return
    const sectionEls = measureRef.current.querySelectorAll('[data-section]')
    const heights = Array.from(sectionEls).map(el => el.getBoundingClientRect().height + 2)
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
        className="a4-measure-layer"
        style={{ width: A4_W - MARGIN_SIDE * 2 }}
      >
        {sections.map((sec, i) => (
          <div key={sec.key} data-section={i}>{sec.element}</div>
        ))}
      </div>

      {/* Rendered pages */}
      <div ref={ref} className="a4-root">
        {(pages || [sections]).map((pageSections, pageIdx) => (
          <PageShell
            key={pageIdx}
            pageNum={pageIdx + 1}
            totalPages={totalPages}
            isFirst={pageIdx === 0}
            isLast={pageIdx === (pages || [sections]).length - 1}
            companyInfo={companyInfo}
            quotation={quotation}
            mode={mode}
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
// Footer text and continuation label per mode
const FOOTER_TEXT = {
  quotation: '本報價單有效期限為開立日起 30 天，逾期請重新詢價。如有疑問，敬請來電洽詢。',
  services: '服務細項說明，僅供已確認報價之客戶參考。',
  checklist: '請依清單準備資料，如有疑問，敬請來電洽詢。',
}
const CONT_LABEL = {
  quotation: (qt) => `報價單　${qt.quote_number}`,
  services: () => '服務細項說明',
  checklist: () => '準備資料清單',
}

function PageShell({ children, pageNum, totalPages, isFirst, isLast, companyInfo, quotation, mode }) {
  return (
    <div>
      <div data-page={pageNum} className="a4-page">

        {/* Continuation header (pages 2+) */}
        {!isFirst && (
          <div className="a4-cont-header">
            <span className="a4-cont-header__company">{companyInfo?.name || '公司名稱'}</span>
            <span>{(CONT_LABEL[mode] || CONT_LABEL.quotation)(quotation)}</span>
          </div>
        )}

        {/* Content */}
        <div className="a4-page__body">{children}</div>

        {/* Footer */}
        <div className="a4-footer">
          <span>{FOOTER_TEXT[mode] || FOOTER_TEXT.quotation}</span>
          <span className="a4-footer__page">第 {pageNum} / {totalPages} 頁</span>
        </div>
      </div>

      {/* Dashed page-break indicator between pages (preview only) */}
      {!isLast && (
        <div className="a4-page-break">
          <div className="a4-page-break__line" />
          <span>— 分頁線 第 {pageNum} / {totalPages} 頁 —</span>
          <div className="a4-page-break__line" />
        </div>
      )}
    </div>
  )
}

// ─── Build content sections ───────────────────────────────────────────────────

// ─── Shared document header (all three modes) ─────────────────────────────────
// company info + title + rule + meta + 委託方資料 + 工程資料 (conditional)
function DocHeader({ mode, quotation, client, contactPerson, companyInfo, title }) {
  return (
    <div>
      <div className="a4-header">
        <div className="a4-company-block">
          <div className="a4-company-name">{companyInfo?.name || '公司名稱'}</div>
          <div className="a4-company-meta">{companyInfo?.address}</div>
          <div className="a4-company-meta">電話：{companyInfo?.phone}</div>
          {companyInfo?.fax && <div className="a4-company-meta">傳真：{companyInfo?.fax}</div>}
          {companyInfo?.email && <div className="a4-company-meta">E-mail：{companyInfo?.email}</div>}
        </div>
        <div className="a4-doc-title">{title}</div>
      </div>
      {mode === 'quotation' && (
        <>
          <div className="a4-rule" />
          <div className="a4-meta-grid">
            <MetaRow label="報價編號" value={`${quotation.quote_number}${FEATURE_VERSIONING && quotation.version > 1 ? ` (v${quotation.version})` : ''}`} />
            <MetaRow label="報價日期" value={formatRocDate(quotation.quote_date)} />
            <MetaRow label="有效期限" value="開立日起 30 日" />
          </div>
        </>
      )}
      <div className="a4-rule" />
      <div className="a4-section">
        <div className="a4-section-label">委託方資料</div>
        <div className="a4-info-grid">
          <MetaRow label="公司名稱" value={client?.company_name} />
          <MetaRow label="地　　址" value={client?.address} />
          {contactPerson && <MetaRow label="聯　絡　人" value={`${contactPerson.name || ''}　${contactPerson.mobile || ''}`} />}
          {contactPerson?.email && <MetaRow label="電子郵件" value={contactPerson.email} />}
        </div>
      </div>
      {(quotation.building_permit || quotation.project_owner || quotation.land_section) && (
        <div className="a4-section">
          <div className="a4-section-label">工程資料</div>
          <div className="a4-info-grid">
            {quotation.project_owner && <MetaRow label="起　造　人" value={quotation.project_owner} />}
            {quotation.building_permit && <MetaRow label="建照號碼" value={quotation.building_permit} />}
            {quotation.land_section && <MetaRow label="地　　段" value={quotation.land_section} />}
            {quotation.project_scale && <MetaRow label="工程規模" value={quotation.project_scale} />}
            {quotation.project_name && <MetaRow label="工程名稱" value={quotation.project_name} />}
          </div>
        </div>
      )}
    </div>
  )
}

function buildSections(args) {
  switch (args.mode) {
    case 'services': return buildDescSections(args)
    case 'checklist': return buildChecklistSections(args)
    default: return buildQuotationSections(args)
  }
}

// ── Mode: quotation ────────────────────────────────────────────────────────────
function buildQuotationSections({
  mode, quotation, services, stages, client, contactPerson,
  companyInfo, total, taxAmount, grandTotal, negLogs,
}) {
  const sec = []

  // ── Document header ──
  sec.push({
    key: 'doc-header',
    element: (
      <DocHeader
        quotation={quotation}
        client={client}
        contactPerson={contactPerson}
        companyInfo={companyInfo}
        title="報　價　單"
        mode={mode}
      />
    ),
  })

  // ── Services table thead ──
  sec.push({
    key: 'svc-thead',
    element: (
      <div className="a4-section a4-section--flush">
        <div className="a4-section-label">服務內容</div>
        <table className="a4-table">
          <thead>
            <tr>
              <th className="a4-th a4-th--num">項次</th>
              <th className="a4-th a4-th--cat">類別</th>
              <th className="a4-th a4-th--left">服務項目</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    ),
  })

  // ── One section per service row ──
  services.forEach((svc, idx) => {
    sec.push({
      key: `svc-row-${svc.id || idx}`,
      element: (
        <table className="a4-table a4-table--join">
          <tbody>
            <tr className={idx % 2 === 1 ? 'a4-tr--stripe' : ''}>
              <td className="a4-td a4-td--num a4-td--top">{idx + 1}</td>
              <td className="a4-td a4-td--cat a4-td--top a4-td--muted">{svc.category || ''}</td>
              <td className="a4-td a4-td--left a4-td--top">
                {FEATURE_VERSIONING && svc.diff_status === 'removed'
                  ? <span className="a4-svc-removed">{svc.service_name}</span>
                  : svc.service_name}
                {FEATURE_VERSIONING && svc.diff_status && (
                  <span className={`a4-diff-badge a4-diff-badge--${svc.diff_status}`}>
                    {svc.diff_status === 'added' ? '▲新增' : svc.diff_status === 'modified' ? '✎更改' : '✕刪除'}
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      ),
    })
  })

  // ── Payment stages (conditional) ──
  if (stages.length > 0) {
    sec.push({
      key: 'stages',
      element: (
        <div className="a4-section a4-section--top">
          <div className="a4-section-label">報價金額及付款階段</div>
          <table className="a4-table">
            <thead>
              <tr>
                <th className="a4-th a4-th--left a4-th--half">付款階段</th>
                <th className="a4-th">百分比</th>
                <th className="a4-th">金額</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((st, idx) => (
                <tr key={st.id || idx}>
                  <td className="a4-td a4-td--left">{st.stage_name}</td>
                  <td className="a4-td">{st.percentage}%</td>
                  <td className="a4-td a4-td--strong">{fmt(st.percentage / 100 * grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    })
  }

  // ── Fee summary ──
  sec.push({
    key: 'fee',
    element: (
      <table className="a4-table a4-table--fee">
        <tbody>
          <tr>
            <td className="a4-td a4-td--left">服務費用（未稅）</td>
            <td className="a4-td a4-td--strong">{fmt(total)}</td>
          </tr>
          {quotation.tax_included && (
            <tr>
              <td className="a4-td a4-td--left">營業稅（5%）</td>
              <td className="a4-td">{fmt(taxAmount)}</td>
            </tr>
          )}
          <tr className="a4-tr--total">
            <td className="a4-td a4-td--left a4-td--total">合計金額</td>
            <td className="a4-td a4-td--total a4-td--strong">{fmt(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    ),
  })

  // ── Notes (conditional) ──
  if (quotation.notes) {
    sec.push({
      key: 'notes',
      element: (
        <div className="a4-section">
          <div className="a4-section-label">備註</div>
          <div className="a4-notes-box">{quotation.notes}</div>
        </div>
      ),
    })
  }

  // ── Signatures ──
  sec.push({
    key: 'signatures',
    element: (
      <div className="a4-section">
        <div className="a4-section-label">確認請簽名回傳</div>
        <div className="a4-sig-row">
          <div className="a4-sig-label a4-sig-label--name">簽名：</div>
          <div className="a4-sig-label a4-sig-label--date">日期：</div>
        </div>
      </div>
    ),
  })

  return sec
}

// ── Mode: services ─────────────────────────────────────────────────────────────
function buildDescSections({ mode, quotation, services, client, contactPerson, companyInfo }) {
  const sec = []

  sec.push({
    key: 'desc-header',
    element: (
      <DocHeader
        quotation={quotation}
        client={client}
        contactPerson={contactPerson}
        companyInfo={companyInfo}
        title="服務細項說明"
        mode={mode}
      />
    ),
  })

  const servicesWithDesc = services.filter(s => s.description?.trim())

  if (servicesWithDesc.length === 0) {
    sec.push({
      key: 'desc-empty',
      element: <p className="a4-empty-note">本報價單無服務說明內容。</p>,
    })
    return sec
  }

  servicesWithDesc.forEach((svc, sIdx) => {
    sec.push({
      key: `desc-svc-${svc.id || sIdx}`,
      element: (
        <div className="a4-appendix-svc">
          <div className="a4-svc-header">{svc.service_name}</div>
          <div
            className="a4-desc-block"
            dangerouslySetInnerHTML={{ __html: (svc.description || '').replace(/\n/g, '<br>') }}
          />
        </div>
      ),
    })
  })

  return sec
}

// ── Mode: checklist ────────────────────────────────────────────────────────────
function buildChecklistSections({ mode, quotation, services, client, contactPerson, companyInfo }) {
  const sec = []

  sec.push({
    key: 'checklist-header',
    element: (
      <DocHeader
        quotation={quotation}
        client={client}
        contactPerson={contactPerson}
        companyInfo={companyInfo}
        title="準備資料清單"
        mode={mode}
      />
    ),
  })

  const servicesWithChecklist = services.filter(
    s => (s.checklist_items || []).some(i => i.item_text?.trim())
  )

  if (servicesWithChecklist.length === 0) {
    sec.push({
      key: 'checklist-empty',
      element: <p className="a4-empty-note">本報價單無準備資料清單。</p>,
    })
    return sec
  }

  servicesWithChecklist.forEach((svc, sIdx) => {
    sec.push({
      key: `checklist-svc-${svc.id || sIdx}`,
      element: (
        <div className="a4-appendix-svc">
          <div className="a4-svc-header">{svc.service_name}</div>
          <table className="a4-table">
            <tbody>
              {(svc.checklist_items || []).filter(i => i.item_text?.trim()).map((item, iIdx) => (
                <tr key={item.id || iIdx}>
                  <td className="a4-td a4-td--idx">{iIdx + 1}</td>
                  <td className="a4-td a4-td--check">□</td>
                  <td className="a4-td a4-td--left">{item.item_text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    })
  })

  return sec
}

// ─── Paginator ────────────────────────────────────────────────────────────────
function paginate(sections, heights) {
  const pages = []
  let cur = []
  let used = 0
  let isFirst = true

  const cap = () => isFirst ? USABLE_H : USABLE_H_CONT

  sections.forEach((sec, i) => {
    const h = heights[i] || 0
    const mustBreak = sec.forceNewPage || (used + h > cap() && cur.length > 0)

    if (mustBreak && cur.length > 0) {
      pages.push(cur)
      cur = []
      used = 0
      isFirst = false
    }
    cur.push(sec)
    used += h
  })

  if (cur.length > 0) pages.push(cur)
  return pages.length > 0 ? pages : [[]]
}

// ─── MetaRow ──────────────────────────────────────────────────────────────────
function MetaRow({ label, value }) {
  if (!value) return null
  return (
    <div className="a4-meta-row">
      <span className="a4-meta-label">{label}</span>
      <span className="a4-meta-value">{value}</span>
    </div>
  )
}
