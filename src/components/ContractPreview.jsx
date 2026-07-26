// src/components/ContractPreview.jsx
import { forwardRef, useState, useLayoutEffect, useRef } from 'react'
import { amountToChineseLarge, rocDateToChineseFull } from '../lib/contractLib'
import { isIndividualProfile } from '../lib/companyProfile'
import '../styles/components/ContractPreview.css'

const fmtAmt = (n) =>
  n != null && n !== '' ? Number(n).toLocaleString('zh-TW', { maximumFractionDigits: 0 }) : ''

/**
 * ContractPreview – A4 contract PDF preview component.
 *
 * Supports automatic two-page layout: when 承攬內容 overflows a single page,
 * parties + date footer are rendered on a second data-page="2" div.
 *
 * Props:
 *   contractData  – { contract_number, project_item, site_name, signed_at }
 *   quotation     – quotation record (fee_amount, tax_included, quote_number, …)
 *   services      – quotation_services rows (service_name, …)
 *   stages        – payment_stages rows (stage_name, percentage, …)
 *   client        – clients row (company_name, address, phone, responsible_person_name, …)
 *   contactPerson – contact_persons row (name, mobile, …)
 *   profile       – raw company_profiles row (for national_id, profile_type, …)
 *   companyInfo   – { name, address, phone, fax, email } derived from companyProfileToInfo()
 */
const ContractPreview = forwardRef(function ContractPreview(
  {
    contractData = {},
    quotation = {},
    services = [],
    stages = [],
    client,
    contactPerson,
    profile,
    companyInfo,
  },
  ref,
) {
  const feeAmount = Number(quotation?.fee_amount || 0)
  const taxAmount = quotation?.tax_included ? Math.round(feeAmount * 0.05) : 0
  const grandTotal = feeAmount + taxAmount
  const isIndividual = isIndividualProfile(profile)

  const projectItem = contractData?.project_item || '—'
  const siteName = contractData?.site_name || '—'
  const contractNum = contractData?.contract_number || ''
  const signedAt = contractData?.signed_at || ''

  const dateFooterText = rocDateToChineseFull(signedAt)

  // ── Overflow detection: split to two pages when 承攬內容 is too long ───────
  const bodyRef = useRef(null)
  const [twoPage, setTwoPage] = useState(false)
  const totalPages = twoPage ? 2 : 1

  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) return
    // Re-measure after layout settles; only promote to two-page (never demote),
    // so the parties section is never orphaned mid-content.
    requestAnimationFrame(() => {
      if (el.scrollHeight > el.clientHeight + 4) {
        setTwoPage(true)
      }
    })
  }, [services, stages])

  // ── Shared bottom section (parties + date) ────────────────────────────────
  const bottomSection = (
    <>
      <div className="ct-parties-rule" />

      <div className="ct-parties">
        {/* 甲方：委託方 (client) */}
        <div className="ct-party">
          <div className="ct-party-header">甲　方</div>
          <div className="ct-party-name">{client?.company_name || '—'}</div>
          <div className="ct-stamp-area">（蓋章）</div>
          <div className="ct-party-fields">
            <PartyRow label="負責人" value={client?.responsible_person_name} />
            {/* 統一編號 not in DB yet — reserved blank */}
            <PartyRow label="統一編號" labelClass="ct-party-label--wide" value="" />
            <PartyRow label="地　址" value={client?.address} fullWidth />
            <PartyRow label="電　話" value={client?.phone} />
            {contactPerson?.name && (
              <PartyRow
                label="連絡人"
                value={`${contactPerson.name}${contactPerson.mobile ? '　' + contactPerson.mobile : ''}`}
              />
            )}
          </div>
        </div>

        {/* 乙方：承攬方 (issuer profile) */}
        <div className="ct-party">
          <div className="ct-party-header">乙　方</div>
          <div className="ct-party-name">{companyInfo?.name || '—'}</div>
          <div className="ct-stamp-area">（蓋章）</div>
          <div className="ct-party-fields">
            {isIndividual ? (
              <PartyRow label="身分證" value={profile?.national_id} />
            ) : (
              <PartyRow label="統一編號" labelClass="ct-party-label--wide" value="" />
            )}
            {/* 行動電話 not in DB yet — reserved blank */}
            <PartyRow label="行動電話" labelClass="ct-party-label--wide" value="" />
            <PartyRow label="地　址" value={companyInfo?.address} fullWidth />
            <PartyRow label="電　話" value={companyInfo?.phone} />
            {companyInfo?.fax && <PartyRow label="傳　真" value={companyInfo?.fax} />}
          </div>
        </div>
      </div>

      {/* Date footer: in document flow, cannot overlap parties */}
      <div className="ct-date-footer">
        {dateFooterText || '中　華　民　國　　　年　　月　　日'}
      </div>
    </>
  )

  return (
    <div ref={ref} className="ct-root">

      {/* ── Page 1 ── */}
      <div data-page="1" className="ct-page">

        {/* Upper body: flex-1; clips when single-page, allows overflow when two-page */}
        <div
          ref={bodyRef}
          className={`ct-body${twoPage ? ' ct-body--full' : ''}`}
        >
          {/* ── Letterhead: company info left, contract title right ── */}
          <div className="ct-letterhead">
            <div className="ct-company-block">
              <div className="ct-company-name">{companyInfo?.name || '公司名稱'}</div>
              {companyInfo?.address && <div className="ct-company-meta">{companyInfo.address}</div>}
              {companyInfo?.phone && <div className="ct-company-meta">電話：{companyInfo.phone}</div>}
              {companyInfo?.fax && <div className="ct-company-meta">傳真：{companyInfo.fax}</div>}
              {companyInfo?.email && <div className="ct-company-meta">E-mail：{companyInfo.email}</div>}
            </div>
            <div className="ct-doc-title">
              <div className="ct-doc-title__main">承　攬　合　約</div>
              {contractNum && <div className="ct-doc-title__num">合約編號：{contractNum}</div>}
            </div>
          </div>
          <div className="ct-letterhead-rule" />

          {/* ── Meta ── */}
          <div className="ct-meta-sections">
            <div className="ct-section">
              <div className="ct-section-title">工程項目</div>
              <div className="ct-meta-val-text">{projectItem}</div>
            </div>
            <div className="ct-section">
              <div className="ct-section-title">工地名稱</div>
              <div className="ct-meta-val-text">{siteName}</div>
            </div>
          </div>

          {/* ── Fee table (4 columns) ── */}
          <div className="ct-section">
          <div className="ct-section-title">承攬金額</div>
          <table className="ct-fee-table">
            <thead>
              <tr>
                <th className="ct-th ct-col-item">項　目</th>
                <th className="ct-th ct-col-price">單　價</th>
                <th className="ct-th ct-col-qty">數　量</th>
                <th className="ct-th ct-col-total">金　額</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ct-td ct-td--left ct-col-item">{projectItem}</td>
                <td className="ct-td ct-col-price">{fmtAmt(feeAmount)}</td>
                <td className="ct-td ct-col-qty">1 式</td>
                <td className="ct-td ct-col-total">{fmtAmt(feeAmount)}</td>
              </tr>
              <tr className="ct-tr-sub">
                <td className="ct-td" colSpan={2} />
                <td className="ct-td ct-td--sub-label">小　計</td>
                <td className="ct-td ct-td--sub-val">{fmtAmt(feeAmount)}</td>
              </tr>
              <tr className="ct-tr-sub">
                <td className="ct-td" colSpan={2} />
                <td className="ct-td ct-td--sub-label">營業稅</td>
                <td className="ct-td ct-td--sub-val">{taxAmount > 0 ? fmtAmt(taxAmount) : '—'}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="ct-tr-grand">
                <td className="ct-td ct-td--grand-label" colSpan={3}>總承攬價</td>
                <td className="ct-td ct-td--grand-val">
                  <div className="ct-grand-amount">NT$ {fmtAmt(grandTotal)}</div>
                  <div className="ct-grand-note">
                    {quotation?.tax_included ? '含稅' : '未稅'}，{amountToChineseLarge(grandTotal)}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
          </div>{/* end ct-section 承攬金額 */}

          {/* ── 承攬內容 ── */}
          <div className="ct-section">
            <div className="ct-section-title">承攬內容</div>
            <div className="ct-content-body">

              {services.length > 0 && (
                <div className="ct-clause">
                  <div className="ct-clause-title">一、本項工程之申辦項目為：</div>
                  <ol className="ct-clause-list ct-clause-list--two-col">
                    {services.map((svc, i) => (
                      <li key={svc.id || i}>{svc.service_name}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="ct-clause">
                二、本費用不含空污、門牌、罰款、使照伴案辦理變更設計費用。
              </div>

              <div className="ct-clause">
                三、本費用單次支付金額達 20,000 元時，須代扣行業所得稅 10%；單次支付金額達 5,000 元時，須代為補充保險費 2%。
              </div>

              {stages.length > 0 && (
                <div className="ct-clause">
                  <div className="ct-clause-title">四、付款方法：</div>
                  <div className="ct-stages-inline">
                    {stages.map((st, i) => {
                      const stageAmt = Math.round((Number(st.percentage) / 100) * grandTotal)
                      return (
                        <span key={st.id || i}>
                          {i + 1}、{st.stage_name} {st.percentage}%　NT$ {fmtAmt(stageAmt)}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="ct-clause">
                五、付款方式：100% 五天現金票。
              </div>

              <div className="ct-blank-marker">～以下空白～</div>
            </div>
          </div>
        </div>{/* end .ct-body */}

        {/* Bottom section: only on page 1 if single-page layout */}
        {!twoPage && (
          <div className="ct-bottom">{bottomSection}</div>
        )}

        {/* Page footer */}
        <div className="ct-page-footer">
          <span>合約如有疑問，敬請來電洽詢。</span>
          <span className="ct-page-footer__page">第 1 / {totalPages} 頁</span>
        </div>
      </div>

      {/* ── Page break indicator (preview only — removed by useExportPDF before PDF gen) ── */}
      {twoPage && (
        <div className="a4-page-break">
          <div className="a4-page-break__line" />
          <span>— 分頁線 第 1 / 2 頁 —</span>
          <div className="a4-page-break__line" />
        </div>
      )}

      {/* ── Page 2 (rendered only when content overflows page 1) ── */}
      {twoPage && (
        <div data-page="2" className="ct-page">
          {/* Subtle continuation header so page 2 is identifiable */}
          <div className="ct-continuation-header">
            <span className="ct-continuation-header__title">承　攬　合　約</span>
            <span className="ct-continuation-header__tag">
              {contractNum ? `${contractNum}　` : ''}甲乙方簽署
            </span>
          </div>

          <div className="ct-bottom ct-bottom--page2">{bottomSection}</div>

          {/* Page footer */}
          <div className="ct-page-footer">
            <span>合約如有疑問，敬請來電洽詢。</span>
            <span className="ct-page-footer__page">第 2 / {totalPages} 頁</span>
          </div>
        </div>
      )}

    </div>
  )
})

function PartyRow({ label, value, labelClass, fullWidth }) {
  return (
    <div className={`ct-party-row${fullWidth ? ' ct-party-row--full' : ''}`}>
      <span className={`ct-party-label ${labelClass || ''}`}>{label}</span>
      <span>：</span>
      <span className="ct-party-val">{value || ''}</span>
    </div>
  )
}

export default ContractPreview
