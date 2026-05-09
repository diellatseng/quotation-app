// src/pages/admin/TemplatesAdmin.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNotification } from '../../context/NotificationContext.jsx'

export default function TemplatesAdmin() {
  const [templates, setTemplates] = useState([])
  const [allServices, setAllServices] = useState([])
  const [selected, setSelected]   = useState(null)
  const [linkedServices, setLinkedServices] = useState([])
  const [form, setForm]           = useState({ name: '', description: '', category: '' })
  const [showForm, setShowForm]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const { success, error }        = useNotification()

  const load = async () => {
    const [{ data: tmpl }, { data: svcs }] = await Promise.all([
      supabase.from('project_templates').select('*, template_services(service_id)').order('name'),
      supabase.from('services').select('id, name, category').order('category').order('name'),
    ])
    setTemplates(tmpl || [])
    setAllServices(svcs || [])
  }

  useEffect(() => { load() }, [])

  const select = async (tmpl) => {
    setSelected(tmpl)
    setForm({ name: tmpl.name, description: tmpl.description || '', category: tmpl.category || '' })
    const { data } = await supabase.from('template_services')
      .select('service_id, sort_order').eq('template_id', tmpl.id).order('sort_order')
    setLinkedServices((data || []).map(ts => ts.service_id))
    setShowForm(true)
  }

  const save = async () => {
    setLoading(true)
    let tmplId = selected?.id
    if (selected) {
      await supabase.from('project_templates').update(form).eq('id', selected.id)
    } else {
      const { data } = await supabase.from('project_templates').insert([form]).select().single()
      tmplId = data.id
    }
    // Sync linked services
    await supabase.from('template_services').delete().eq('template_id', tmplId)
    if (linkedServices.length) {
      await supabase.from('template_services').insert(
        linkedServices.map((sid, i) => ({ template_id: tmplId, service_id: sid, sort_order: i }))
      )
    }
    success(selected ? '範本已更新' : '範本已新增')
    await load()
    setShowForm(false); setSelected(null); setLoading(false)
  }

  const deleteTmpl = async () => {
    if (!window.confirm('確定刪除此範本？')) return
    await supabase.from('project_templates').delete().eq('id', selected.id)
    success('已刪除'); setShowForm(false); setSelected(null); load()
  }

  const toggleService = (svcId) => {
    setLinkedServices(prev =>
      prev.includes(svcId) ? prev.filter(id => id !== svcId) : [...prev, svcId]
    )
  }

  // Group services by category for display
  const grouped = allServices.reduce((acc, s) => {
    const cat = s.category || '未分類'; if (!acc[cat]) acc[cat] = []; acc[cat].push(s); return acc
  }, {})

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>工程範本</h2>
        <button className="btn btn-primary" onClick={() => { setSelected(null); setForm({ name: '', description: '', category: '' }); setLinkedServices([]); setShowForm(true) }}>
          + 新增範本
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 1.6fr' : '1fr', gap: 'var(--space-5)' }}>
        {/* Template list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {templates.length === 0 ? (
            <p style={{ padding: 'var(--space-6)', color: 'var(--color-text-muted)', textAlign: 'center' }}>尚無工程範本</p>
          ) : templates.map(t => (
            <div key={t.id} onClick={() => select(t)} style={{
              padding: 'var(--space-4)',
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer',
              background: selected?.id === t.id ? 'var(--color-accent-subtle)' : 'transparent',
              borderLeft: selected?.id === t.id ? '3px solid var(--color-accent)' : '3px solid transparent',
            }}>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {t.category} ／ {(t.template_services || []).length} 項服務
              </div>
            </div>
          ))}
        </div>

        {/* Edit form */}
        {showForm && (
          <div className="card">
            <p className="section-title">{selected ? '編輯範本' : '新增範本'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="field-label">範本名稱 *</label>
                <input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例如：住宅大樓跑照" />
              </div>
              <div>
                <label className="field-label">類別</label>
                <input className="field-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="例如：住宅、商業" />
              </div>
              <div>
                <label className="field-label">說明</label>
                <input className="field-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            {/* Service linking */}
            <p className="section-title">連結服務項目</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
              已選擇 {linkedServices.length} 項服務
            </p>
            <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              {Object.entries(grouped).map(([cat, svcs]) => (
                <div key={cat}>
                  <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-bg-subtle)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {cat}
                  </div>
                  {svcs.map(svc => (
                    <label key={svc.id} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: linkedServices.includes(svc.id) ? 'var(--color-accent-subtle)' : 'transparent',
                      minHeight: 44,
                    }}>
                      <input
                        type="checkbox"
                        checked={linkedServices.includes(svc.id)}
                        onChange={() => toggleService(svc.id)}
                        style={{ width: 20, height: 20 }}
                      />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: linkedServices.includes(svc.id) ? 600 : 400 }}>
                        {svc.name}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
              {allServices.length === 0 && (
                <p style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                  請先在「服務資料庫」新增服務項目
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
              <button className="btn btn-primary" onClick={save} disabled={loading}>{loading ? '儲存中…' : '儲存範本'}</button>
              {selected && <button className="btn btn-danger" onClick={deleteTmpl}>刪除</button>}
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setSelected(null) }}>取消</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
