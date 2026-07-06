// src/pages/admin/ClientsAdmin.jsx
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
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AdminMasterDetailLayout from '@/components/admin/admin-master-detail-layout'
import ClientImportDialog, { ClientImportToolbarMenu } from '@/components/ClientImportDialog'
import ClientsDataTable from './clients/clients-data-table'
import {
  DATA_TABLE_TOOLBAR_BUTTON_SIZE,
  dataTableToolbarButtonClassName,
} from '@/components/data-table/toolbar-styles'
import { Plus } from 'lucide-react'

function emptyClient() {
  return { company_name: '', address: '', phone: '', fax: '', email: '', responsible_person_name: '', responsible_person_mobile: '', responsible_person_title: '' }
}

export default function ClientsAdmin() {
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(null)
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState(emptyClient())
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [contactDeleteId, setContactDeleteId] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)

  const load = async () => {
    setFetchLoading(true)
    const { data } = await supabase.from('clients').select('*').order('company_name')
    setClients(data || [])
    setFetchLoading(false)
  }

  useEffect(() => { load() }, [])

  const selectClient = useCallback(async (c) => {
    setSelected(c)
    setForm(c)
    const { data } = await supabase
      .from('contact_persons')
      .select('*')
      .eq('client_id', c.id)
      .order('is_primary', { ascending: false })
    setContacts(data || [])
    setShowForm(true)
  }, [])

  const openCreate = useCallback(() => {
    setSelected(null)
    setForm(emptyClient())
    setContacts([])
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((client) => {
    selectClient(client)
  }, [selectClient])

  const handleDeleteRequest = useCallback((client) => {
    setClientToDelete(client)
    setShowDeleteDialog(true)
  }, [])

  const saveClient = async () => {
    if (!form.company_name?.trim()) {
      toast.warning('請填寫公司名稱')
      return
    }

    setLoading(true)
    if (selected) {
      const { error: e } = await supabase.from('clients').update(form).eq('id', selected.id)
      if (e) { toast.error('儲存失敗：' + e.message, { duration: 6000 }); setLoading(false); return }
      toast.success('客戶資料已更新')
    } else {
      const { error: e } = await supabase.from('clients').insert([form])
      if (e) { toast.error('新增失敗：' + e.message, { duration: 6000 }); setLoading(false); return }
      toast.success('客戶已新增')
    }
    await load()
    setShowForm(false)
    setSelected(null)
    setForm(emptyClient())
    setLoading(false)
  }

  const deleteClient = async () => {
    const target = clientToDelete ?? selected
    if (!target) return
    await supabase.from('clients').delete().eq('id', target.id)
    toast.success('已刪除')
    setShowDeleteDialog(false)
    setClientToDelete(null)
    if (selected?.id === target.id) {
      setShowForm(false)
      setSelected(null)
    }
    load()
  }

  const addContact = async () => {
    const { data } = await supabase.from('contact_persons').insert([{
      client_id: selected.id, name: '新聯絡人', mobile: '', office_phone: '', fax: '', email: '', is_primary: false,
    }]).select().single()
    setContacts(prev => [...prev, data])
  }

  const updateContact = async (idx, field, val) => {
    const c = contacts[idx]
    const next = [...contacts]; next[idx] = { ...c, [field]: val }; setContacts(next)
    await supabase.from('contact_persons').update({ [field]: val }).eq('id', c.id)
  }

  const deleteContact = async (id) => {
    await supabase.from('contact_persons').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
    setContactDeleteId(null)
  }

  const toolbarActions = (
    <>
      <ClientImportToolbarMenu onUploadClick={() => setImportOpen(true)} />
      <Button
        variant="default"
        size={DATA_TABLE_TOOLBAR_BUTTON_SIZE}
        className={dataTableToolbarButtonClassName}
        onClick={openCreate}
      >
        <Plus data-icon="inline-start" />
        新增客戶
      </Button>
    </>
  )

  return (
    <div>
      <AlertDialog
        open={contactDeleteId !== null}
        onOpenChange={open => {
          if (!open) setContactDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除聯絡人</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此聯絡人嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => contactDeleteId && deleteContact(contactDeleteId)}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除客戶</AlertDialogTitle>
            <AlertDialogDescription>
              確定刪除「{clientToDelete?.company_name || selected?.company_name}」？相關報價單的客戶連結將被清除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteClient}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClientImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingClients={clients}
        onSuccess={load}
      />

      <AdminMasterDetailLayout
        showDetail={showForm}
        list={(
          <ClientsDataTable
            clients={clients}
            loading={fetchLoading}
            selectedRowId={selected?.id}
            onRowClick={selectClient}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            toolbarActions={toolbarActions}
          />
        )}
        detail={showForm && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-semibold">{selected ? '編輯客戶' : '新增客戶'}</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <F label="公司名稱" required value={form.company_name} onChange={v => setForm(f => ({ ...f, company_name: v }))} />
              <F label="電子郵件" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
              <F label="電話" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              <F label="傳真" value={form.fax} onChange={v => setForm(f => ({ ...f, fax: v }))} />
              <F label="負責人姓名" value={form.responsible_person_name} onChange={v => setForm(f => ({ ...f, responsible_person_name: v }))} />
              <F label="負責人手機" value={form.responsible_person_mobile} onChange={v => setForm(f => ({ ...f, responsible_person_mobile: v }))} />
              <F label="負責人職稱" value={form.responsible_person_title} onChange={v => setForm(f => ({ ...f, responsible_person_title: v }))} />
            </div>
            <F label="地址" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} />

            {selected && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-base font-semibold text-foreground">聯絡人</p>
                  <Button variant="ghost" size="sm" className="font-semibold" onClick={addContact}>
                    <Plus data-icon="inline-start" />
                    新增
                  </Button>
                </div>
                {contacts.map((ct, idx) => (
                  <div key={ct.id} className="mb-3 rounded-lg border border-border p-3">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <F label="姓名" value={ct.name} onChange={v => updateContact(idx, 'name', v)} compact />
                      <F label="手機" value={ct.mobile || ''} onChange={v => updateContact(idx, 'mobile', v)} compact />
                      <F label="辦公室電話" value={ct.office_phone || ''} onChange={v => updateContact(idx, 'office_phone', v)} compact />
                      <F label="電子郵件" value={ct.email || ''} onChange={v => updateContact(idx, 'email', v)} compact />
                    </div>
                    <div className="flex gap-3 items-center">
                      <Field orientation="horizontal">
                        <Checkbox
                          id={`primary-${ct.id}`}
                          checked={ct.is_primary}
                          onCheckedChange={(checked) => updateContact(idx, 'is_primary', checked)}
                        />
                        <Label htmlFor={`primary-${ct.id}`} className="font-normal">
                          主要聯絡人
                        </Label>
                      </Field>
                      <Button variant="destructive" size="sm" className="font-semibold" onClick={() => setContactDeleteId(ct.id)}>刪除</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <Button variant="default" size="md" className="font-semibold" onClick={saveClient} disabled={loading}>{loading ? '儲存中…' : '儲存'}</Button>
              {selected && (
                <Button variant="destructive" size="md" className="font-semibold" onClick={() => handleDeleteRequest(selected)}>
                  刪除客戶
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

function F({ label, value, onChange, compact, required }) {
  return (
    <Field className={compact ? '' : 'mb-4'}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        required={required}
      />
    </Field>
  )
}
