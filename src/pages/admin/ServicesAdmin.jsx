// src/pages/admin/ServicesAdmin.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNotification } from '../../context/NotificationContext.jsx'
import RichEditor from '../../components/RichEditor.jsx'
import { Button } from '@/components/ui/button'
import { getIcon } from '@/lib/icons'

const PlusIcon = getIcon('add')
const CloseIcon = getIcon('close')

const LABEL_CLS = 'block text-xs font-semibold text-foreground mb-1.5'
const INPUT_CLS = 'w-full h-10 px-3 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'

export default function ServicesAdmin() {
  const [services, setServices] = useState([])
  const [selected, setSelected] = useState(null)
  const [checklistItems, setChecklistItems] = useState([])
  const [form, setForm] = useState({ name: '', category: '', description: '' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const { success, error } = useNotification()

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">服務資料庫</h2>
        <Button
          variant="default"
          size="md"
          className="font-semibold"
          onClick={() => { setSelected(null); setForm({ name: '', category: '', description: '' }); setChecklistItems([]); setShowForm(true) }}
        >
          {PlusIcon && <PlusIcon data-icon="inline-start" />}
          新增服務
        </Button>
      </div>

      <div className={`grid gap-5 ${showForm ? 'grid-cols-[1fr_1.4fr]' : 'grid-cols-1'}`}>
        {/* List */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
          {Object.entries(grouped).map(([cat, svcs]) => (
            <div key={cat}>
              <div className="px-4 py-2 bg-muted text-xs font-bold text-muted-foreground uppercase tracking-wide">
                {cat}
              </div>
              {svcs.map(svc => (
                <div key={svc.id} onClick={() => select(svc)} className={`p-3 px-4 border-b border-border cursor-pointer transition-colors ${selected?.id === svc.id
                  ? 'bg-primary/10 border-l-4 border-l-primary'
                  : 'border-l-4 border-l-transparent hover:bg-muted/50'
                  }`}>
                  <div className="font-medium">{svc.name}</div>
                </div>
              ))}
            </div>
          ))}
          {services.length === 0 && (
            <p className="p-6 text-muted-foreground text-center">尚無服務項目</p>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
            <p className="text-base font-semibold text-foreground mb-4">{selected ? '編輯服務' : '新增服務'}</p>
            <div className="flex flex-col gap-4 mb-4">
              <div>
                <label className={LABEL_CLS}>服務名稱 *</label>
                <input className={INPUT_CLS} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className={LABEL_CLS}>類別</label>
                <input className={INPUT_CLS} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="例如：申報作業、勘驗作業" />
              </div>
              <div>
                <label className={LABEL_CLS}>說明</label>
                <RichEditor
                  value={form.description}
                  onChange={html => setForm(f => ({ ...f, description: html }))}
                />
              </div>
            </div>

            {/* Checklist items */}
            {selected && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-base font-semibold text-foreground">客戶準備清單</p>
                  <Button variant="ghost" size="sm" className="font-semibold" onClick={addItem}>
                    {PlusIcon && <PlusIcon data-icon="inline-start" />}
                    新增
                  </Button>
                </div>
                {checklistItems.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-center mb-2">
                    <span className="text-muted-foreground text-sm w-6 text-right shrink-0">{idx + 1}.</span>
                    <input className={`${INPUT_CLS} flex-1`} value={item.item_text} onChange={e => updateItem(idx, e.target.value)} placeholder="準備項目" />
                    <Button
                      variant="danger"
                      size="icon"
                      title="刪除"
                      aria-label="刪除"
                      onClick={() => deleteItem(item.id)}
                    >
                      {CloseIcon && <CloseIcon />}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <Button variant="default" size="md" className="font-semibold" onClick={save} disabled={loading}>{loading ? '儲存中…' : '儲存'}</Button>
              {selected && <Button variant="danger" size="md" className="font-semibold" onClick={deleteSvc}>刪除</Button>}
              <Button variant="ghost" size="md" className="font-semibold" onClick={() => { setShowForm(false); setSelected(null) }}>取消</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
