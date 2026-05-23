// src/pages/wizard/Step4Confirm.jsx
import { useState } from 'react'
import ROCDateInput from '../../components/ROCDateInput'
import Switch from '../../components/Switch'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

const PRESETS = [
  {
    label: '四階段（依範本）',
    stages: [
      { stage_name: '開工完成', percentage: 20 },
      { stage_name: '結構體10樓完成', percentage: 20 },
      { stage_name: '結構體頂樓完成', percentage: 20 },
      { stage_name: '取得使用執照', percentage: 40 },
    ],
  },
  {
    label: '兩階段（50/50）',
    stages: [
      { stage_name: '開工前', percentage: 50 },
      { stage_name: '完工後', percentage: 50 },
    ],
  },
  {
    label: '三階段（30/40/30）',
    stages: [
      { stage_name: '開工前', percentage: 30 },
      { stage_name: '施工中', percentage: 40 },
      { stage_name: '完工後', percentage: 30 },
    ],
  },
]

export default function Step4Confirm({ data, update, negContext }) {
  const [useRoc, setUseRoc] = useState(true)
  const fee = Number(data.fee_amount) || 0
  const tax = data.tax_included ? fee * 0.05 : 0
  const grand = fee + tax

  const stages = data.payment_stages || []
  const totalPct = stages.reduce((s, st) => s + Number(st.percentage || 0), 0)
  const isValid = Math.abs(totalPct - 100) < 0.01

  const updateStage = (idx, field, val) => {
    const next = [...stages]
    next[idx] = { ...next[idx], [field]: val }
    update({ payment_stages: next })
  }

  const addStage = () => update({
    payment_stages: [...stages, { id: crypto.randomUUID(), stage_name: '', percentage: 0 }]
  })

  const removeStage = (idx) => update({
    payment_stages: stages.filter((_, i) => i !== idx)
  })

  return (
    <div>
      <h2 style={s.heading}>步驟 4：報價確認與付款</h2>
      <p style={s.desc}>設定付款方式、填寫報價資訊與金額。</p>

      {/* Payment stages */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <p className="section-title">付款階段</p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          設定付款里程碑。各階段百分比合計需等於 100%。
        </p>

        {/* Total indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          background: isValid ? 'var(--color-success-bg)' : totalPct > 0 ? 'var(--color-warning-bg)' : 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${isValid ? 'var(--color-success)' : totalPct > 0 ? 'var(--color-warning)' : 'var(--color-border)'}`,
          marginBottom: 'var(--space-5)',
        }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600,
            color: isValid ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {isValid ? '✓ 百分比合計 = 100%' : `百分比合計：${totalPct}%（需達 100%）`}
          </span>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700,
            color: isValid ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {totalPct}%
          </span>
        </div>

        {/* Stages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {stages.map((st, idx) => (
            <div key={st.id || idx} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--radius-full)',
                background: 'var(--color-text)', color: 'var(--color-text-inverse)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0,
              }}>{idx + 1}</div>

              <input
                className="field-input"
                style={{ flex: 2, minWidth: 160 }}
                value={st.stage_name}
                onChange={e => updateStage(idx, 'stage_name', e.target.value)}
                placeholder="付款階段名稱（例：開工完成）"
                aria-label={`第${idx+1}階段名稱`}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                <input
                  type="number"
                  className="field-input"
                  style={{ width: 90, textAlign: 'right' }}
                  min="0" max="100" step="0.1"
                  value={st.percentage}
                  onChange={e => updateStage(idx, 'percentage', e.target.value)}
                  aria-label={`第${idx+1}階段百分比`}
                />
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>%</span>
              </div>

              <button
                type="button"
                onClick={() => removeStage(idx)}
                aria-label={`刪除第${idx+1}付款階段`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-danger)', fontSize: 'var(--text-md)', padding: 'var(--space-2)',
                  minHeight: 'var(--tap-min)', minWidth: 'var(--tap-min)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-secondary"
          style={{ marginTop: 'var(--space-4)', width: '100%' }}
          onClick={addStage}>
          + 新增付款階段
        </button>

        {/* Quick presets */}
        <div style={{ marginTop: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            快速套用常見付款方式：
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => update({ payment_stages: p.stages.map(st => ({ ...st, id: crypto.randomUUID() })) })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quotation info */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <p className="section-title">報價資訊</p>
          <Switch
            checked={!useRoc}
            onChange={(isCE) => setUseRoc(!isCE)}
            labelOff="民國"
            labelOn="西元"
            id="dateFormatSwitch"
            ariaLabel="切換日期格式"
            size="sm"
          />
        </div>
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
              useRoc={useRoc}
              required
            />
          </div>
        </div>
      </div>

      {/* Service fee */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <p className="section-title">服務費用</p>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label htmlFor="fee_amount" className="field-label">報價金額（未稅）*</label>
          {negContext && (
            <div style={{
              fontSize: 'var(--text-xs)', color: 'var(--color-accent)',
              marginBottom: 'var(--space-2)',
              padding: '4px 10px',
              background: 'var(--color-accent-subtle)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex', gap: 6, alignItems: 'center',
            }}>
              <span>💬</span>
              <span>議價金額已帶入（NT$ {Number(negContext.amount).toLocaleString('zh-TW')}）{negContext.notes ? `— ${negContext.notes}` : ''}</span>
            </div>
          )}
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

      {/* Notes */}
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
