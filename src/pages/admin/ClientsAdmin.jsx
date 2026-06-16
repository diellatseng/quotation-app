// src/pages/admin/ClientsAdmin.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNotification } from '../../context/NotificationContext.jsx'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getIcon } from '@/lib/icons'

const PlusIcon = getIcon('add')

export default function ClientsAdmin() {
  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState(null)
  const [contacts, setContacts] = useState([])
  const [form, setForm] = useState(emptyClient())
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { success, error } = useNotification()

  function emptyClient() {
    return { company_name: '', address: '', phone: '', fax: '', email: '', responsible_person_name: '', responsible_person_mobile: '', responsible_person_title: '' }
  }

  const load = async () => {
    const { data } = await supabase.from('clients').select('*').order('company_name')
    setClients(data || [])
  }

  useEffect(() => { load() }, [])

  const selectClient = async (c) => {
    setSelected(c)
    setForm(c)
    const { data } = await supabase.from('contact_persons').select('*').eq('client_id', c.id).order('is_primary', { ascending: false })
    setContacts(data || [])
    setShowForm(true)
  }

  const saveClient = async () => {
    setLoading(true)
    if (selected) {
      const { error: e } = await supabase.from('clients').update(form).eq('id', selected.id)
      if (e) { error('儲存失敗：' + e.message); setLoading(false); return }
      success('客戶資料已更新')
    } else {
      const { error: e } = await supabase.from('clients').insert([form])
      if (e) { error('新增失敗：' + e.message); setLoading(false); return }
      success('客戶已新增')
    }
    await load()
    setShowForm(false)
    setSelected(null)
    setForm(emptyClient())
    setLoading(false)
  }

  const deleteClient = async () => {
    if (!selected) return
    await supabase.from('clients').delete().eq('id', selected.id)
    success('已刪除')
    setShowDeleteDialog(false)
    setShowForm(false)
    setSelected(null)
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
  }

  return (
    <div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除客戶</AlertDialogTitle>
            <AlertDialogDescription>
              確定刪除？相關報價單的客戶連結將被清除。
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">客戶資料庫</h2>
        <Button
          variant="default"
          size="md"
          className="font-semibold"
          onClick={() => { setSelected(null); setForm(emptyClient()); setContacts([]); setShowForm(true) }}
        >
          {PlusIcon && <PlusIcon data-icon="inline-start" />}
          新增客戶
        </Button>
      </div>

      <div className={`grid gap-5 ${showForm ? 'grid-cols-[1fr_1.4fr]' : 'grid-cols-1'}`}>
        {/* List */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
          {clients.length === 0 ? (
            <p className="p-6 text-muted-foreground text-center">尚無客戶</p>
          ) : (
            clients.map(c => (
              <div key={c.id}
                onClick={() => selectClient(c)}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${selected?.id === c.id
                    ? 'bg-primary/10 border-l-4 border-l-primary'
                    : 'border-l-4 border-l-transparent hover:bg-muted/50'
                  }`}>
                <div className="font-semibold">{c.company_name}</div>
                <div className="text-xs text-muted-foreground">{c.phone} {c.email}</div>
              </div>
            ))
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
            <p className="text-base font-semibold text-foreground mb-4">{selected ? '編輯客戶' : '新增客戶'}</p>
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

            {/* Contacts */}
            {selected && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-base font-semibold text-foreground">聯絡人</p>
                  <Button variant="ghost" size="sm" className="font-semibold" onClick={addContact}>
                    {PlusIcon && <PlusIcon data-icon="inline-start" />}
                    新增
                  </Button>
                </div>
                {contacts.map((ct, idx) => (
                  <div key={ct.id} className="border border-border rounded-lg p-3 mb-3">
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
                      <Button variant="danger" size="sm" className="font-semibold" onClick={() => deleteContact(ct.id)}>刪除</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <Button variant="default" size="md" className="font-semibold" onClick={saveClient} disabled={loading}>{loading ? '儲存中…' : '儲存'}</Button>
              {selected && (
                <Button variant="danger" size="md" className="font-semibold" onClick={() => setShowDeleteDialog(true)}>
                  刪除客戶
                </Button>
              )}
              <Button variant="ghost" size="md" className="font-semibold" onClick={() => { setShowForm(false); setSelected(null) }}>取消</Button>
            </div>
          </div>
        )}
      </div>
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
