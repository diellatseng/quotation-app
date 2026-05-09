// src/components/NegotiationPanel.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../context/NotificationContext'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

export default function NegotiationPanel({ quotationId, currentAmount, logs, onLogged }) {
  const [open, setOpen]       = useState(false)
  const [newAmount, setNewAmount] = useState('')
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)
  const { user }              = useAuth()
  const { success, error }    = useNotification()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newAmount) { error('請輸入新報價金額'); return }
    setSaving(true)
    const { error: err } = await supabase.from('negotiation_log').insert([{
      quotation_id: quotationId,
      old_amount: currentAmount,
      new_amount: Number(newAmount),
      notes,
      logged_by: user.id,
    }])
    if (err) { error('記錄失敗：' + err.message); setSaving(false); return }

    // Update quotation amount + tag as negotiating
    await supabase.from('quotations').update({
      fee_amount: Number(newAmount),
      is_negotiating: true,
    }).eq('id', quotationId)

    success('議價記錄已儲存')
    setNewAmount('')
    setNotes('')
    setOpen(false)
    setSaving(false)
    onLogged?.()
  }

  return (
    <div>
      {/* Timeline */}
      {logs.length > 0 && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="section-title">議價歷程</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {logs.map((log, idx) => (
              <div key={log.id} style={{
                display: 'flex',
                gap: 'var(--space-4)',
                paddingLeft: 'var(--space-4)',
                borderLeft: '2px solid var(--color-border)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', left: -7, top: 4,
                  width: 12, height: 12, borderRadius: '50%',
                  background: idx === 0 ? 'var(--color-accent)' : 'var(--color-border)',
                  border: '2px solid var(--color-bg-surface)',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                    {new Date(log.logged_at).toLocaleString('zh-TW')}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                      原報價：<s>{fmt(log.old_amount)}</s>
                    </span>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)' }}>
                      → 議價後：{fmt(log.new_amount)}
                    </span>
                  </div>
                  {log.notes && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {log.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add entry */}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        {open ? '取消' : '+ 新增議價記錄'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-5)',
          background: 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>
          <div>
            <label className="field-label">目前報價</label>
            <p style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>{fmt(currentAmount)}</p>
          </div>
          <div>
            <label className="field-label" htmlFor="neg-new-amount">議價後金額（未稅）*</label>
            <input
              id="neg-new-amount"
              type="number"
              min="0"
              className="field-input"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              placeholder="輸入新金額"
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="neg-notes">議價備註</label>
            <textarea
              id="neg-notes"
              className="field-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="例如：業主要求減10%，同意調整"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '儲存中…' : '確認議價'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>取消</button>
          </div>
        </form>
      )}
    </div>
  )
}
