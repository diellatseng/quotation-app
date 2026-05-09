// src/pages/wizard/Step5Confirm.jsx
import ROCDateInput from '../../components/ROCDateInput'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

export default function Step5Confirm({ data, update }) {
  const fee = Number(data.fee_amount) || 0
  const tax = data.tax_included ? fee * 0.05 : 0
  const grand = fee + tax

  return (
    <div>
      <h2 style={s.heading}>步驟 5：報價確認</h2>
      <p style={s.desc}>填寫報價編號、日期與金額，完成後進入預覽。</p>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <p className="section-title">報價資訊</p>
        <div style={s.grid}>
          <div>
            <label htmlFor="quote_number" className="field-label">報價編號 *</label>
            <input
              id="quote_number"
              className="field-input"
              value={data.quote_number}
              onChange={e => update({ quote_number: e.target.value })}
              placeholder="QT-2025-00001"
              required
              aria-required="true"
            />
          </div>
          <div>
            <ROCDateInput
              id="quote_date"
              label="報價日期 *"
              value={data.quote_date}
              onChange={v => update({ quote_date: v })}
              required
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <p className="section-title">服務費用</p>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label htmlFor="fee_amount" className="field-label">報價金額（未稅）*</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0 }}>NT$</span>
            <input
              id="fee_amount"
              type="number"
              min="0"
              className="field-input"
              value={data.fee_amount}
              onChange={e => update({ fee_amount: e.target.value })}
              placeholder="1,570,000"
              required
              aria-required="true"
            />
          </div>
        </div>

        <label style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          cursor: 'pointer', minHeight: 'var(--tap-min)',
          padding: 'var(--space-3) var(--space-4)',
          border: `1.5px solid ${data.tax_included ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          background: data.tax_included ? 'var(--color-accent-subtle)' : 'var(--color-bg-input)',
        }}>
          <input
            type="checkbox"
            checked={data.tax_included}
            onChange={e => update({ tax_included: e.target.checked })}
            style={{ width: 22, height: 22 }}
            aria-label="含稅（加計5%營業稅）"
          />
          <div>
            <div style={{ fontWeight: 600 }}>含稅（加計 5% 營業稅）</div>
            {data.tax_included && fee > 0 && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                稅額：{fmt(tax)}
              </div>
            )}
          </div>
        </label>

        {/* Amount summary */}
        {fee > 0 && (
          <div style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-4)',
            background: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>服務費用（未稅）</span>
              <span style={{ fontWeight: 600 }}>{fmt(fee)}</span>
            </div>
            {data.tax_included && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>營業稅（5%）</span>
                <span>{fmt(tax)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)',
              fontSize: 'var(--text-md)', fontWeight: 700,
            }}>
              <span>合計</span>
              <span style={{ color: 'var(--color-accent)' }}>{fmt(grand)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <p className="section-title">備註</p>
        <textarea
          className="field-input"
          value={data.notes || ''}
          onChange={e => update({ notes: e.target.value })}
          placeholder="備註事項，例如：有效期限、特殊條件、注意事項等…"
          rows={4}
          style={{ resize: 'vertical' }}
          aria-label="備註"
        />
      </div>
    </div>
  )
}

const s = {
  heading: { fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' },
  desc: { fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-5)' },
}
