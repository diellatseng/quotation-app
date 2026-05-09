// src/pages/admin/ServicesAdmin.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNotification } from '../../context/NotificationContext.jsx'

export default function ServicesAdmin() {
  const [services, setServices] = useState([])
  const [selected, setSelected] = useState(null)
  const [checklistItems, setChecklistItems] = useState([])
  const [form, setForm]         = useState({ name: '', category: '', description: '' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { success, error }      = useNotification()

  const load = async () => {
    const { data } = await supabase.from('services').select('*').order('category').order('name')
    setServices(data || [])
  }

  useEffect(() => { load() }, [])

  const select = async (svc) => {
    setSelected(svc)
    setForm({ name: svc.name, category: svc.category || '', description: svc.description || '' })
    const { data } = await supabase.from('service_checklist_items').select('*').eq('service_id', svc.id).order('sort_order')
    setChecklistItems(data || [])
    setShowForm(true)
  }

  const save = async () => {
    setLoading(true)
    if (selected) {
      await supabase.from('services').update(form).eq('id', selected.id)
      success('已更新')
    } else {
      await supabase.from('services').insert([form])
      success('已新增')
    }
    await load(); setShowForm(false); setSelected(null); setLoading(false)
  }

  const deleteSvc = async () => {
    if (!window.confirm('確定刪除此服務？')) return
    await supabase.from('services').delete().eq('id', selected.id)
    success('已刪除'); setShowForm(false); setSelected(null); load()
  }

  const addItem = async () => {
    if (!selected) return
    const { data } = await supabase.from('service_checklist_items').insert([{
      service_id: selected.id, item_text: '', sort_order: checklistItems.length,
    }]).select().single()
    setChecklistItems(prev => [...prev, data])
  }

  const updateItem = async (idx, val) => {
    const item = checklistItems[idx]
    const next = [...checklistItems]; next[idx] = { ...item, item_text: val }; setChecklistItems(next)
    await supabase.from('service_checklist_items').update({ item_text: val }).eq('id', item.id)
  }

  const deleteItem = async (id) => {
    await supabase.from('service_checklist_items').delete().eq('id', id)
    setChecklistItems(prev => prev.filter(i => i.id !== id))
  }

  // Group by category
  const grouped = services.reduce((acc, s) => {
    const cat = s.category || '未分類'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>服務資料庫</h2>
        <button className="btn btn-primary" onClick={() => { setSelected(null); setForm({ name: '', category: '', description: '' }); setChecklistItems([]); setShowForm(true) }}>
          + 新增服務
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 1.4fr' : '1fr', gap: 'var(--space-5)' }}>
        {/* List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {Object.entries(grouped).map(([cat, svcs]) => (
            <div key={cat}>
              <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-bg-subtle)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {cat}
              </div>
              {svcs.map(svc => (
                <div key={svc.id} onClick={() => select(svc)} style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  background: selected?.id === svc.id ? 'var(--color-accent-subtle)' : 'transparent',
                  borderLeft: selected?.id === svc.id ? '3px solid var(--color-accent)' : '3px solid transparent',
                }}>
                  <div style={{ fontWeight: 500 }}>{svc.name}</div>
                </div>
              ))}
            </div>
          ))}
          {services.length === 0 && (
            <p style={{ padding: 'var(--space-6)', color: 'var(--color-text-muted)', textAlign: 'center' }}>尚無服務項目</p>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="card">
            <p className="section-title">{selected ? '編輯服務' : '新增服務'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div>
                <label className="field-label">服務名稱 *</label>
                <input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">類別</label>
                <input className="field-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="例如：申報作業、勘驗作業" />
              </div>
              <div>
                <label className="field-label">說明</label>
                <textarea className="field-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
              </div>
            </div>

            {/* Checklist items */}
            {selected && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <p className="section-title" style={{ marginBottom: 0 }}>客戶準備清單</p>
                  <button className="btn btn-ghost btn-sm" onClick={addItem}>+ 新增</button>
                </div>
                {checklistItems.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', width: 24, textAlign: 'right', flexShrink: 0 }}>{idx + 1}.</span>
                    <input className="field-input" value={item.item_text} onChange={e => updateItem(idx, e.target.value)} placeholder="準備項目" style={{ flex: 1 }} />
                    <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item.id)} aria-label="刪除">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
              <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? '儲存中…' : '儲存'}</button>
              {selected && <button className="btn btn-danger" onClick={deleteSvc}>刪除</button>}
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setSelected(null) }}>取消</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
