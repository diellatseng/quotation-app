// src/pages/admin/ServicesAdmin.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import RichEditor from '../../components/RichEditor.jsx'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getIcon } from '@/lib/icons'

const PlusIcon = getIcon('add')
const CloseIcon = getIcon('close')

export default function ServicesAdmin() {
  const [services, setServices] = useState([])
  const [selected, setSelected] = useState(null)
  const [checklistItems, setChecklistItems] = useState([])
  const [form, setForm] = useState({ name: '', category: '', description: '' })
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)

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
      toast.success('已更新')
    } else {
      await supabase.from('services').insert([form])
      toast.success('已新增')
    }
    await load(); setShowForm(false); setSelected(null); setLoading(false)
  }

  const deleteSvc = async () => {
    await supabase.from('services').delete().eq('id', selected.id)
    toast.success('已刪除')
    setShowDeleteDialog(false)
    setShowForm(false)
    setSelected(null)
    load()
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
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除服務</AlertDialogTitle>
            <AlertDialogDescription>確定刪除此服務？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteSvc}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        <Card className="gap-0 py-0 shadow-sm">
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
        </Card>

        {/* Form */}
        {showForm && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">{selected ? '編輯服務' : '新增服務'}</CardTitle>
            </CardHeader>
            <CardContent>
            <FieldGroup className="gap-4 mb-4">
              <Field>
                <FieldLabel>服務名稱</FieldLabel>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>類別</FieldLabel>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="例如：申報作業、勘驗作業" />
              </Field>
              <Field>
                <FieldLabel>說明</FieldLabel>
                <RichEditor
                  value={form.description}
                  onChange={html => setForm(f => ({ ...f, description: html }))}
                />
              </Field>
            </FieldGroup>

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
                    <Input className="flex-1" value={item.item_text} onChange={e => updateItem(idx, e.target.value)} placeholder="準備項目" />
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
              {selected && (
                <Button variant="danger" size="md" className="font-semibold" onClick={() => setShowDeleteDialog(true)}>
                  刪除
                </Button>
              )}
              <Button variant="ghost" size="md" className="font-semibold" onClick={() => { setShowForm(false); setSelected(null) }}>取消</Button>
            </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
