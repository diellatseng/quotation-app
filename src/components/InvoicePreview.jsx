import { forwardRef, useMemo } from 'react'
import {
  buildInvoiceLineItems,
  parseReturnedDocuments,
  formatInvoiceAmount,
  formatInvoiceBuildingPermit,
  formatInvoiceDateShort,
  formatInvoiceTotal,
  invoiceRecipientName,
  padInvoiceTableRows,
  sumInvoiceRequestedAmounts,
} from '../lib/invoiceDocument'
import { formatBankAccountLines } from '../lib/bankAccount'
import '../styles/components/InvoicePreview.css'

const InvoicePreview = forwardRef(function InvoicePreview(
  {
    project,
    client,
    contactPerson,
    stage,
    invoice,
    disbursements = [],
    companyInfo,
    bankAccount,
  },
  ref,
) {
  const lineItems = useMemo(() => buildInvoiceLineItems({
    landSection: project?.land_section,
    contractTotal: project?.total_amount,
    stage,
    disbursements,
  }), [project?.land_section, project?.total_amount, stage, disbursements])

  const tableRows = useMemo(() => padInvoiceTableRows(lineItems), [lineItems])
  const requestedTotal = sumInvoiceRequestedAmounts(lineItems)
  const returnedDocuments = useMemo(
    () => parseReturnedDocuments(invoice?.returned_documents),
    [invoice?.returned_documents],
  )
  const recipient = invoiceRecipientName({
    contactPerson,
    projectOwner: project?.project_owner,
    clientName: client?.company_name,
  })
  const honorificMatch = recipient.match(/(.*?)( 先生| 小姐| 女士)$/)
  const displayName = honorificMatch?.[1] || recipient
  const honorific = honorificMatch?.[2] || ''
  const permitLine = formatInvoiceBuildingPermit(project?.building_permit, invoice?.invoiced_at)
  const dateLine = formatInvoiceDateShort(invoice?.invoiced_at)
  const bankLines = formatBankAccountLines(bankAccount)

  return (
    <div ref={ref} className="inv-root">
      <div className="inv-page" data-page="1">
        <div className="inv-page__body">
          <div className="inv-header">
            <div className="inv-company-block">
              <div className="inv-company-name">{companyInfo?.name || '公司名稱'}</div>
              <div className="inv-company-meta">
                {companyInfo?.address && <div>{companyInfo.address}</div>}
                <div>
                  {companyInfo?.phone && `Tel ${companyInfo.phone}`}
                  {companyInfo?.fax && ` · Fax ${companyInfo.fax}`}
                </div>
                {companyInfo?.email && <div>{companyInfo.email}</div>}
              </div>
            </div>
            <div className="inv-doc-title">請款單</div>
          </div>

          <div className="inv-rule" />

          <div className="inv-letterhead">
          <div className="inv-recipient">
            <span className="inv-recipient-name">{displayName}</span>
            {honorific}
            <span className="inv-tai-zhao">台照</span>
          </div>
          <div className="inv-date-line">日期： {dateLine || '—'}</div>
          {permitLine && <div className="inv-permit-line">{permitLine}</div>}
        </div>

        <table className="inv-main-table">
          <thead>
            <tr>
              <th className="inv-col-item inv-th">費用項目</th>
              <th className="inv-col-total inv-th">總價</th>
              <th className="inv-col-unit inv-th">單價</th>
              <th className="inv-col-qty inv-th">數量</th>
              <th className="inv-col-requested inv-th">請領金額</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map(row => (
              <tr key={row.key} className={row.empty ? 'inv-row-empty' : undefined}>
                <td className="inv-col-item inv-td inv-td--left">{row.item}</td>
                <td className="inv-col-total inv-td">{row.totalPrice != null ? formatInvoiceAmount(row.totalPrice) : ''}</td>
                <td className="inv-col-unit inv-td">{row.unitPrice != null ? formatInvoiceAmount(row.unitPrice) : ''}</td>
                <td className="inv-col-qty inv-td">{row.quantity ?? ''}</td>
                <td className="inv-col-requested inv-td">
                  {row.requestedAmount != null && row.requestedAmount !== 0
                    ? formatInvoiceAmount(row.requestedAmount)
                    : ''}
                </td>
              </tr>
            ))}
            <tr className="inv-row-total">
              <td className="inv-col-item inv-td inv-td--left inv-td--total">總計新台幣</td>
              <td className="inv-col-total inv-td inv-td--total" />
              <td className="inv-col-unit inv-td inv-td--total" />
              <td className="inv-col-qty inv-td inv-td--total" />
              <td className="inv-col-requested inv-td inv-td--total">{formatInvoiceTotal(requestedTotal)}</td>
            </tr>
          </tbody>
        </table>

        <div className="inv-footer-blocks">
          <div className="inv-section">
            <div className="inv-section-label">檢還文件</div>
            <div className="inv-section-body">
              {returnedDocuments.length > 0 ? (
                <ol className="inv-footer-list">
                  {returnedDocuments.map((doc, index) => (
                    <li key={`${index}-${doc}`}>{doc}</li>
                  ))}
                </ol>
              ) : (
                <div className="inv-footer-empty">&nbsp;</div>
              )}
            </div>
          </div>
          <div className="inv-section">
            <div className="inv-section-label">備註</div>
            <div className="inv-section-body">
              {invoice?.notes?.trim() ? (
                <div className="inv-footer-text">{invoice.notes.trim()}</div>
              ) : (
                <div className="inv-footer-empty">&nbsp;</div>
              )}
            </div>
          </div>
        </div>

        {bankLines.length > 0 && (
          <div className="inv-section inv-section--full">
            <div className="inv-section-label">匯款帳戶</div>
            <div className="inv-section-body inv-bank-box">
              {bankLines.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        )}
        </div>

        <div className="inv-footer">
          <span>{companyInfo?.name || '公司名稱'}</span>
          <span className="inv-footer__page">第 1 頁</span>
        </div>
      </div>
    </div>
  )
})

export default InvoicePreview
