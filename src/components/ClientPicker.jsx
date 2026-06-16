// src/components/ClientPicker.jsx
import { useState, useEffect, useId } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Building2, Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { getIcon } from '@/lib/icons'

const PlusIcon = getIcon('add')

function matchesClient(client, query) {
  const q = query.toLowerCase()
  return (
    client.company_name.toLowerCase().includes(q) ||
    (client.phone || '').includes(query) ||
    (client.email || '').toLowerCase().includes(q)
  )
}

export default function ClientPicker({ value, onChange, disabled = false }) {
  const inputId = useId()
  const [clients, setClients] = useState([])
  const [pendingClientId, setPendingClientId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)

  const [newClient, setNewClient] = useState({
    company_name: '', address: '', phone: '', fax: '', email: '',
    responsible_person_name: '', responsible_person_mobile: '', responsible_person_title: '',
  })
  const [newContact, setNewContact] = useState({ name: '', mobile: '', office_phone: '', fax: '', email: '' })

  useEffect(() => {
    supabase.from('clients').select('id, company_name, phone, email')
      .order('company_name')
      .then(({ data }) => setClients(data || []))
  }, [])

  useEffect(() => {
    if (value) setPendingClientId(null)
  }, [value])

  const selectedClient = clients.find(c => c.id === (value ?? pendingClientId)) ?? null

  const handleSelect = (client) => {
    if (!client) {
      setPendingClientId(null)
      onChange?.(null)
      return
    }

    setPendingClientId(client.id)

    ; (async () => {
      try {
        const { data: fullClient } = await supabase
          .from('clients')
          .select('*')
          .eq('id', client.id)
          .single()

        const { data: contacts } = await supabase
          .from('contact_persons')
          .select('*')
          .eq('client_id', client.id)
          .order('is_primary', { ascending: false })

        onChange?.({ client: fullClient, contacts: contacts || [] })
      } catch (err) {
        toast.error(err.message || '載入客戶資料失敗', { duration: 6000 })
      }
    })()
  }

  const createClient = async () => {
    if (!newClient.company_name.trim()) {
      toast.error('請輸入公司名稱', { duration: 6000 })
      return
    }
    setLoading(true)
    try {
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .insert([newClient])
        .select()
        .single()

      if (clientErr) throw clientErr

      if (newContact.name.trim()) {
        const { error: contactErr } = await supabase
          .from('contact_persons')
          .insert([{ ...newContact, client_id: clientData.id }])

        if (contactErr) throw contactErr
      }

      toast.success('成功建立客戶與聯絡人')

      const { data: updatedClients } = await supabase
        .from('clients')
        .select('id, company_name, phone, email')
        .order('company_name')
      setClients(updatedClients || [])

      const createdContact = newContact.name.trim() ? newContact : null
      onChange?.({
        client: clientData,
        contacts: createdContact ? [{ ...newContact, client_id: clientData.id }] : []
      })
      setShowCreate(false)
    } catch (err) {
      toast.error(err.message || '建立失敗', { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4 text-foreground">
      <div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Combobox
              items={clients}
              value={selectedClient}
              onValueChange={handleSelect}
              itemToStringLabel={(client) => client.company_name}
              isItemEqualToValue={(a, b) => a.id === b.id}
              filter={matchesClient}
              autoHighlight
              modal={false}
              disabled={disabled || showCreate}
              onInputValueChange={(inputValue, { reason }) => {
                if (reason === 'item-press' || reason === 'keyboard' || reason === 'list-navigation') {
                  return
                }
                if (reason === 'clear-press' || reason === 'input-clear') {
                  setPendingClientId(null)
                  onChange?.(null)
                  return
                }
                if (reason === 'input-change' && inputValue === '') {
                  setPendingClientId(null)
                  if (value) onChange?.(null)
                  return
                }
                if (
                  reason === 'input-change' &&
                  (value || pendingClientId) &&
                  inputValue !== selectedClient?.company_name
                ) {
                  setPendingClientId(null)
                  onChange?.(null)
                }
              }}
            >
              <ComboboxInput
                id={inputId}
                size="md"
                className="w-full"
                placeholder="搜尋公司名稱、電話或 Email..."
                showTrigger={false}
                showClear={!!selectedClient}
              />
              <ComboboxContent>
                <ComboboxEmpty>查無符合的客戶</ComboboxEmpty>
                <ComboboxList>
                  {(client) => (
                    <ComboboxItem key={client.id} value={client} className="items-start py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{client.company_name}</div>
                        {(client.phone || client.email) && (
                          <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            {client.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                                {client.phone}
                              </span>
                            )}
                            {client.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                                {client.email}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {!showCreate && (
            <Button
              variant="outline"
              type="button"
              size="md"
              className="font-semibold shrink-0"
              onClick={() => setShowCreate(true)}
              disabled={disabled}
            >
              {PlusIcon && <PlusIcon data-icon="inline-start" />}
              新增客戶
            </Button>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1.5 flex items-center gap-1.5">
            <Building2 className="size-4 shrink-0" aria-hidden="true" />
            新增客戶基本資料
          </h3>

          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>公司名稱</FieldLabel>
              <Input
                required
                value={newClient.company_name}
                onChange={e => setNewClient(p => ({ ...p, company_name: e.target.value }))}
                placeholder="例如：米爾斯股份有限公司"
              />
            </Field>
            <Field>
              <FieldLabel>公司地址</FieldLabel>
              <Input
                value={newClient.address}
                onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel>公司電話</FieldLabel>
              <Input
                value={newClient.phone}
                onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel>傳真號碼</FieldLabel>
              <Input
                value={newClient.fax}
                onChange={e => setNewClient(p => ({ ...p, fax: e.target.value }))}
              />
            </Field>
          </FieldGroup>

          <h3 className="text-sm font-semibold text-foreground border-b border-border pt-2 pb-1.5 flex items-center gap-1.5">
            <User className="size-4 shrink-0" aria-hidden="true" />
            聯絡人資料
          </h3>

          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>姓名</FieldLabel>
              <Input
                value={newContact.name}
                onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel>行動電話</FieldLabel>
              <Input
                value={newContact.mobile}
                onChange={e => setNewContact(p => ({ ...p, mobile: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel>辦公室電話</FieldLabel>
              <Input
                value={newContact.office_phone}
                onChange={e => setNewContact(p => ({ ...p, office_phone: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel>電子郵件</FieldLabel>
              <Input
                type="email"
                value={newContact.email}
                onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
              />
            </Field>
          </FieldGroup>

          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              type="button"
              size="md"
              className="font-semibold"
              onClick={createClient}
              disabled={loading || disabled}
            >
              {loading ? '建立中…' : '建立客戶'}
            </Button>
            <Button
              variant="ghost"
              type="button"
              size="md"
              className="font-semibold"
              onClick={() => setShowCreate(false)}
              disabled={disabled}
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
