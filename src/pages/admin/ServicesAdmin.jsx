// src/pages/admin/ServicesAdmin.jsx
import { useState, useEffect, useCallback } from 'react'
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
import AdminMasterDetailLayout from '@/components/admin/admin-master-detail-layout'
import ServicesDataTable from './services/services-data-table'
import {
  DATA_TABLE_TOOLBAR_BUTTON_SIZE,
  dataTableToolbarButtonClassName,
} from '@/components/data-table/toolbar-styles'
import IconTooltip from '@/components/IconTooltip'
import { Plus, X } from 'lucide-react'

function emptyService() {
  return { name: '', category: '', description: '' }
}

export default function ServicesAdmin() {
  const [services, setServices] = useState([])
  const [selected, setSelected] = useState(null)
  const [checklistItems, setChecklistItems] = useState([])
  const [form, setForm] = useState(emptyService())
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState(null)
  const [checklistDeleteId, setChecklistDeleteId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  const load = async () => {
    setFetchLoading(true)
    const { data } = await supabase.from('services').select('*').order('category').order('name')
    setServices(data || [])
    setFetchLoading(false)
  }

  useEffect(() => { load() }, [])

  const selectService = useCallback(async (svc) => {
    setSelected(svc)
    setForm({ name: svc.name, category: svc.category || '', description: svc.description || '' })
    const { data } = await supabase.from('service_checklist_items').select('*').eq('service_id', svc.id).order('sort_order')
    setChecklistItems(data || [])
    setShowForm(true)
  }, [])

  const openCreate = useCallback(() => {
    setSelected(null)
    setForm(emptyService())
    setChecklistItems([])
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((service) => {
    selectService(service)
  }, [selectService])

  const handleDeleteRequest = useCallback((service) => {
    setServiceToDelete(service)
    setShowDeleteDialog(true)
  }, [])

  const save = async () => {
    if (!form.name?.trim()) {
      toast.warning('請填寫服務名稱')
      return
    }

    setLoading(true)
    if (selected) {
      const { error: e } = await supabase.from('services').update(form).eq('id', selected.id)
      if (e) { toast.error('儲存失敗：' + e.message, { duration: 6000 }); setLoading(false); return }
      toast.success('已更新')
    } else {
      const { error: e } = await supabase.from('services').insert([form])
      if (e) { toast.error('新增失敗：' + e.message, { duration: 6000 }); setLoading(false); return }
      toast.success('已新增')
    }
    await load()
    setShowForm(false)
    setSelected(null)
    setLoading(false)
  }

  const deleteSvc = async () => {
    const target = serviceToDelete ?? selected
    if (!target) return
    await supabase.from('services').delete().eq('id', target.id)
    toast.success('已刪除')
    setShowDeleteDialog(false)
    setServiceToDelete(null)
    if (selected?.id === target.id) {
      setShowForm(false)
      setSelected(null)
    }
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
    setChecklistDeleteId(null)
  }

  const toolbarActions = (
    <Button
      variant="default"
      size={DATA_TABLE_TOOLBAR_BUTTON_SIZE}
      className={dataTableToolbarButtonClassName}
      onClick={openCreate}
    >
      <Plus data-icon="inline-start" />
      新增服務
    </Button>
  )

  return (
    <div>
      <AlertDialog
        open={checklistDeleteId !== null}
        onOpenChange={open => {
          if (!open) setChecklistDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除清單項目</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此準備項目嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => checklistDeleteId && deleteItem(checklistDeleteId)}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除服務</AlertDialogTitle>
            <AlertDialogDescription>
              確定刪除「{serviceToDelete?.name || selected?.name}」？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteSvc}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminMasterDetailLayout
        showDetail={showForm}
        list={(
          <ServicesDataTable
            services={services}
            loading={fetchLoading}
            selectedRowId={selected?.id}
            onRowClick={selectService}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            toolbarActions={toolbarActions}
          />
        )}
        detail={showForm && (
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

            {selected && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-base font-semibold text-foreground">客戶準備清單</p>
                  <Button variant="ghost" size="sm" className="font-semibold" onClick={addItem}>
                    <Plus data-icon="inline-start" />
                    新增
                  </Button>
                </div>
                {checklistItems.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-center mb-2">
                    <span className="text-muted-foreground text-sm w-6 text-right shrink-0">{idx + 1}.</span>
                    <Input className="flex-1" value={item.item_text} onChange={e => updateItem(idx, e.target.value)} placeholder="準備項目" />
                    <IconTooltip label="刪除">
                      <Button
                        variant="destructive"
                        size="icon"
                        aria-label="刪除"
                        onClick={() => setChecklistDeleteId(item.id)}
                      >
                        <X />
                      </Button>
                    </IconTooltip>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <Button variant="default" size="md" className="font-semibold" onClick={save} disabled={loading}>{loading ? '儲存中…' : '儲存'}</Button>
              {selected && (
                <Button variant="destructive" size="md" className="font-semibold" onClick={() => handleDeleteRequest(selected)}>
                  刪除
                </Button>
              )}
              <Button variant="ghost" size="md" className="font-semibold" onClick={() => { setShowForm(false); setSelected(null) }}>取消</Button>
            </div>
            </CardContent>
          </Card>
        )}
      />
    </div>
  )
}
