// src/pages/admin/TemplatesAdmin.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNotification } from '../../context/NotificationContext.jsx'
import { Button } from '@/components/ui/button'
import { getIcon } from '@/lib/icons'

const PlusIcon = getIcon('add')

const LABEL_CLS = 'block text-xs font-semibold text-foreground mb-1.5'
const INPUT_CLS = 'w-full h-10 px-3 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">工程範本</h2>
        <Button
          variant="default"
          size="md"
          className="font-semibold"
          onClick={() => { setSelected(null); setForm({ name: '', description: '', category: '' }); setLinkedServices([]); setShowForm(true) }}
        >
          {PlusIcon && <PlusIcon data-icon="inline-start" />}
          新增範本
        </Button>
      </div>

      <div className={`grid gap-5 ${showForm ? 'grid-cols-[1fr_1.6fr]' : 'grid-cols-1'}`}>
        {/* Template list */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
          {templates.length === 0 ? (
            <p className="p-6 text-muted-foreground text-center">尚無工程範本</p>
          ) : templates.map(t => (
            <div key={t.id} onClick={() => select(t)} className={`p-4 border-b border-border cursor-pointer transition-colors ${selected?.id === t.id
              ? 'bg-primary/10 border-l-4 border-l-primary'
              : 'border-l-4 border-l-transparent hover:bg-muted/50'
              }`}>
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">
                {t.category} ／ {(t.template_services || []).length} 項服務
              </div>
            </div>
          ))}
        </div>

        {/* Edit form */}
        {showForm && (
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
            <p className="text-base font-semibold text-foreground mb-4">{selected ? '編輯範本' : '新增範本'}</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className={LABEL_CLS}>範本名稱 *</label>
                <input className={INPUT_CLS} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例如：住宅大樓跑照" />
              </div>
              <div>
                <label className={LABEL_CLS}>類別</label>
                <input className={INPUT_CLS} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="例如：住宅、商業" />
              </div>
              <div>
                <label className={LABEL_CLS}>說明</label>
                <input className={INPUT_CLS} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            {/* Service linking */}
            <p className="text-base font-semibold text-foreground mb-1">連結服務項目</p>
            <p className="text-sm text-muted-foreground mb-3">
              已選擇 {linkedServices.length} 項服務
            </p>
            <div className="max-h-[360px] overflow-y-auto border border-border rounded-md">
              {Object.entries(grouped).map(([cat, svcs]) => (
                <div key={cat}>
                  <div className="px-4 py-2 bg-muted text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {cat}
                  </div>
                  {svcs.map(svc => (
                    <label key={svc.id} className={`flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer min-h-[44px] ${linkedServices.includes(svc.id) ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}>
                      <input
                        type="checkbox"
                        checked={linkedServices.includes(svc.id)}
                        onChange={() => toggleService(svc.id)}
                        className="w-5 h-5"
                      />
                      <span className={`text-sm ${linkedServices.includes(svc.id) ? 'font-semibold' : 'font-normal'}`}>
                        {svc.name}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
              {allServices.length === 0 && (
                <p className="p-4 text-muted-foreground text-center text-sm">
                  請先在「服務資料庫」新增服務項目
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <Button variant="default" size="md" className="font-semibold" onClick={save} disabled={loading}>{loading ? '儲存中…' : '儲存範本'}</Button>
              {selected && <Button variant="danger" size="md" className="font-semibold" onClick={deleteTmpl}>刪除</Button>}
              <Button variant="ghost" size="md" className="font-semibold" onClick={() => { setShowForm(false); setSelected(null) }}>取消</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
