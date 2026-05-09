// src/pages/wizard/Step3Payment.jsx

export default function Step3Payment({ data, update }) {
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
      <h2 style={s.heading}>步驟 3：付款方式</h2>
      <p style={s.desc}>設定付款里程碑。各階段百分比合計需等於 100%。</p>

      <div className="card">
        <p className="section-title">付款階段</p>

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
    </div>
  )
}

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

const s = {
  heading: { fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' },
  desc: { fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' },
}
