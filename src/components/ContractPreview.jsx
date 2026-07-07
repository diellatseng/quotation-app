// src/components/ContractPreview.jsx
import { forwardRef } from 'react'
import { amountToChineseLarge, rocDateToChineseFull } from '../lib/contractLib'
import { isIndividualProfile } from '../lib/companyProfile'
import '../styles/components/ContractPreview.css'

const fmtAmt = (n) =>
  n != null && n !== '' ? Number(n).toLocaleString('zh-TW', { maximumFractionDigits: 0 }) : ''

/**
 * ContractPreview – A4 contract PDF preview component.
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

  return (
    <div ref={ref} className="ct-root">
      {/* data-page required for useExportPDF pagination */}
      <div data-page="1" className="ct-page">

        {/* ── Header ── */}
        <div className="ct-header">
          <span className="ct-header__title">承　攬　合　約</span>
          {contractNum && (
            <span className="ct-header__num">合約編號：{contractNum}</span>
          )}
        </div>

        {/* ── Meta ── */}
        <div className="ct-meta">
          <table className="ct-meta-table">
            <colgroup>
              <col style={{ width: '60px' }} />
              <col style={{ width: '8px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <td className="ct-meta-label">工程項目</td>
                <td className="ct-meta-sep">：</td>
                <td className="ct-meta-value">{projectItem}</td>
              </tr>
              <tr>
                <td className="ct-meta-label">工地名稱</td>
                <td className="ct-meta-sep">：</td>
                <td className="ct-meta-value">{siteName}</td>
              </tr>
              <tr>
                <td className="ct-meta-label">廠商名稱</td>
                <td className="ct-meta-sep">：</td>
                <td className="ct-meta-value">{companyInfo?.name || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Fee table ── */}
        <table className="ct-fee-table">
          <thead>
            <tr>
              <th className="ct-th ct-col-no">編號</th>
              <th className="ct-th ct-col-item">項　目</th>
              <th className="ct-th ct-col-unit">單位</th>
              <th className="ct-th ct-col-qty">數量</th>
              <th className="ct-th ct-col-price">單　價</th>
              <th className="ct-th ct-col-total">積　價</th>
              <th className="ct-th ct-col-note">備　註</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ct-td ct-col-no">1</td>
              <td className="ct-td ct-col-item ct-td--left">{projectItem}</td>
              <td className="ct-td ct-col-unit">式</td>
              <td className="ct-td ct-col-qty">1</td>
              <td className="ct-td ct-col-price">{fmtAmt(feeAmount)}</td>
              <td className="ct-td ct-col-total">{fmtAmt(feeAmount)}</td>
              <td className="ct-td ct-col-note"></td>
            </tr>
            <tr className="ct-tr-sum">
              <td className="ct-td ct-col-note" colSpan={5}>小　計</td>
              <td className="ct-td ct-col-total">{fmtAmt(feeAmount)}</td>
              <td className="ct-td ct-col-note"></td>
            </tr>
            <tr className="ct-tr-sum">
              <td className="ct-td ct-col-note" colSpan={5}>營業稅</td>
              <td className="ct-td ct-col-total">{taxAmount > 0 ? fmtAmt(taxAmount) : ''}</td>
              <td className="ct-td ct-col-note"></td>
            </tr>
            <tr className="ct-tr-total">
              <td className="ct-td ct-col-note" colSpan={5}>合　計</td>
              <td className="ct-td ct-col-total">{fmtAmt(grandTotal)}</td>
              <td className="ct-td ct-col-note"></td>
            </tr>
          </tbody>
        </table>

        {/* ── Chinese total amount ── */}
        <div className="ct-amount-text">
          總承攬價：{amountToChineseLarge(grandTotal)}
          {quotation?.tax_included ? '（含稅）' : '（未稅）'}
        </div>

        {/* ── 承攬內容 ── */}
        <div className="ct-section">
          <div className="ct-section-title">承　攬　內　容</div>
          <div className="ct-content-body">

            {services.length > 0 && (
              <div className="ct-clause">
                <div className="ct-clause-title">一、本項工程之申辦項目為：</div>
                <ol className="ct-clause-list">
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
                <ol className="ct-clause-list">
                  {stages.map((st, i) => {
                    const stageAmt = Math.round((Number(st.percentage) / 100) * grandTotal)
                    return (
                      <li key={st.id || i}>
                        {st.stage_name} {st.percentage}% 請領 NT$ {fmtAmt(stageAmt)}
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}

            <div className="ct-clause">
              五、付款方式：100% 五天現金票。
            </div>

            <div className="ct-blank-marker">～以下空白～</div>
          </div>
        </div>

        {/* ── Parties (甲方 / 乙方) ── */}
        <div className="ct-parties">
          {/* 甲方：委託方 (client) */}
          <div className="ct-party">
            <div className="ct-party-header">甲　方</div>
            <div className="ct-party-name">{client?.company_name || '—'}</div>
            <div className="ct-stamp-area">（蓋章）</div>
            <PartyRow label="負責人" value={client?.responsible_person_name} />
            <PartyRow label="地　址" value={client?.address} />
            <PartyRow label="電　話" value={client?.phone} />
            {contactPerson?.name && (
              <PartyRow
                label="連絡人"
                value={`${contactPerson.name}${contactPerson.mobile ? '　' + contactPerson.mobile : ''}`}
              />
            )}
          </div>

          {/* 乙方：承攬方 (issuer profile) */}
          <div className="ct-party">
            <div className="ct-party-header">乙　方</div>
            <div className="ct-party-name">{companyInfo?.name || '—'}</div>
            <div className="ct-stamp-area">（蓋章）</div>
            {isIndividual ? (
              <PartyRow label="身分證" value={profile?.national_id} />
            ) : (
              <PartyRow label="統一編號" labelClass="ct-party-label--wide" value="" />
            )}
            <PartyRow label="地　址" value={companyInfo?.address} />
            <PartyRow label="行動電話" labelClass="ct-party-label--wide" value="" />
            <PartyRow label="電　話" value={companyInfo?.phone} />
            {companyInfo?.fax && <PartyRow label="傳　真" value={companyInfo?.fax} />}
          </div>
        </div>

        {/* ── Date footer ── */}
        <div className="ct-date-footer">
          {dateFooterText || '中　華　民　國　　　年　　月　　日'}
        </div>

      </div>
    </div>
  )
})

function PartyRow({ label, value, labelClass }) {
  return (
    <div className="ct-party-row">
      <span className={`ct-party-label ${labelClass || ''}`}>{label}</span>
      <span>：</span>
      <span className="ct-party-val">{value || ''}</span>
    </div>
  )
}

export default ContractPreview
