// src/pages/admin/TemplatesAdmin.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AppEmptyState } from '@/components/AppEmptyState'
import AdminMasterDetailLayout from '@/components/admin/admin-master-detail-layout'
import TemplatesDataTable from './templates/templates-data-table'
import {
  DATA_TABLE_TOOLBAR_BUTTON_SIZE,
  dataTableToolbarButtonClassName,
} from '@/components/data-table/toolbar-styles'
import { Layers, Plus } from 'lucide-react'

function emptyTemplate() {
  return { name: '', description: '', category: '' }
}

export default function TemplatesAdmin() {
  const [templates, setTemplates] = useState([])
  const [allServices, setAllServices] = useState([])
  const [selected, setSelected] = useState(null)
  const [linkedServices, setLinkedServices] = useState([])
  const [form, setForm] = useState(emptyTemplate())
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  const load = async () => {
    setFetchLoading(true)
    const [{ data: tmpl }, { data: svcs }] = await Promise.all([
      supabase.from('project_templates').select('*, template_services(service_id)').order('name'),
      supabase.from('services').select('id, name, category').order('category').order('name'),
    ])
    setTemplates(tmpl || [])
    setAllServices(svcs || [])
    setFetchLoading(false)
  }

  useEffect(() => { load() }, [])

  const selectTemplate = useCallback(async (tmpl) => {
    setSelected(tmpl)
    setForm({ name: tmpl.name, description: tmpl.description || '', category: tmpl.category || '' })
    const { data } = await supabase.from('template_services')
      .select('service_id, sort_order').eq('template_id', tmpl.id).order('sort_order')
    setLinkedServices((data || []).map(ts => ts.service_id))
    setShowForm(true)
  }, [])

  const openCreate = useCallback(() => {
    setSelected(null)
    setForm(emptyTemplate())
    setLinkedServices([])
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((template) => {
    selectTemplate(template)
  }, [selectTemplate])

  const handleDeleteRequest = useCallback((template) => {
    setTemplateToDelete(template)
    setShowDeleteDialog(true)
  }, [])

  const save = async () => {
    if (!form.name?.trim()) {
      toast.warning('請填寫範本名稱')
      return
    }

    setLoading(true)
    let tmplId = selected?.id
    if (selected) {
      const { error: e } = await supabase.from('project_templates').update(form).eq('id', selected.id)
      if (e) { toast.error('儲存失敗：' + e.message, { duration: 6000 }); setLoading(false); return }
      tmplId = selected.id
    } else {
      const { data, error: e } = await supabase.from('project_templates').insert([form]).select().single()
      if (e) { toast.error('新增失敗：' + e.message, { duration: 6000 }); setLoading(false); return }
      tmplId = data.id
    }
    await supabase.from('template_services').delete().eq('template_id', tmplId)
    if (linkedServices.length) {
      await supabase.from('template_services').insert(
        linkedServices.map((sid, i) => ({ template_id: tmplId, service_id: sid, sort_order: i })),
      )
    }
    toast.success(selected ? '範本已更新' : '範本已新增')
    await load()
    setShowForm(false)
    setSelected(null)
    setLoading(false)
  }

  const deleteTmpl = async () => {
    const target = templateToDelete ?? selected
    if (!target) return
    await supabase.from('project_templates').delete().eq('id', target.id)
    toast.success('已刪除')
    setShowDeleteDialog(false)
    setTemplateToDelete(null)
    if (selected?.id === target.id) {
      setShowForm(false)
      setSelected(null)
    }
    load()
  }

  const toggleService = (svcId) => {
    setLinkedServices(prev =>
      prev.includes(svcId) ? prev.filter(id => id !== svcId) : [...prev, svcId],
    )
  }

  const grouped = allServices.reduce((acc, s) => {
    const cat = s.category || '未分類'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  const toolbarActions = (
    <Button
      variant="default"
      size={DATA_TABLE_TOOLBAR_BUTTON_SIZE}
      className={dataTableToolbarButtonClassName}
      onClick={openCreate}
    >
      <Plus data-icon="inline-start" />
      新增範本
    </Button>
  )

  return (
    <div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除範本</AlertDialogTitle>
            <AlertDialogDescription>
              確定刪除「{templateToDelete?.name || selected?.name}」？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteTmpl}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminMasterDetailLayout
        showDetail={showForm}
        list={(
          <TemplatesDataTable
            templates={templates}
            loading={fetchLoading}
            selectedRowId={selected?.id}
            onRowClick={selectTemplate}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            toolbarActions={toolbarActions}
          />
        )}
        detail={showForm && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">{selected ? '編輯範本' : '新增範本'}</CardTitle>
            </CardHeader>
            <CardContent>
            <FieldGroup className="grid grid-cols-2 gap-4 mb-4">
              <Field className="col-span-2">
                <FieldLabel>範本名稱</FieldLabel>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例如：住宅大樓跑照" />
              </Field>
              <Field>
                <FieldLabel>類別</FieldLabel>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="例如：住宅、商業" />
              </Field>
              <Field>
                <FieldLabel>說明</FieldLabel>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </Field>
            </FieldGroup>

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
                    <label key={svc.id} className={`flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer min-h-[44px] ${linkedServices.includes(svc.id) ? 'bg-primary/10' : 'hover:bg-surface-hover'
                      }`}>
                      <Checkbox
                        checked={linkedServices.includes(svc.id)}
                        onCheckedChange={() => toggleService(svc.id)}
                      />
                      <span className={`text-sm ${linkedServices.includes(svc.id) ? 'font-semibold text-foreground' : 'font-normal text-foreground'}`}>
                        {svc.name}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
              {allServices.length === 0 && (
                <AppEmptyState
                  compact
                  embedded
                  icon={Layers}
                  title="尚無可連結的服務"
                  description="請先在「服務資料庫」新增服務項目"
                />
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <Button variant="default" size="md" className="font-semibold" onClick={save} disabled={loading}>{loading ? '儲存中…' : '儲存範本'}</Button>
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
