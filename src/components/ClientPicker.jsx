// src/components/ClientPicker.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNotification } from '../context/NotificationContext'
import Button from './Button'
import Icon from './Icon'
import IconButton from './IconButton'

export default function ClientPicker({ value, onChange, disabled = false }) {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const [newClient, setNewClient] = useState({
    company_name: '', address: '', phone: '', fax: '', email: '',
    responsible_person_name: '', responsible_person_mobile: '', responsible_person_title: '',
  })
  const [newContact, setNewContact] = useState({ name: '', mobile: '', office_phone: '', fax: '', email: '' })
  const { success: notifySuccess, error: notifyError } = useNotification()
  const containerRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    supabase.from('clients').select('id, company_name, phone, email')
      .order('company_name')
      .then(({ data }) => setClients(data || []))
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const clickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  const filtered = clients.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedClient = clients.find(c => c.id === value)

  useEffect(() => {
    if (selectedClient && !search) {
      setSearch(selectedClient.company_name)
    }
  }, [selectedClient])

  // Keep the highlighted option scrolled into view during keyboard navigation
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return
    listRef.current.children[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const handleKeyDown = (e) => {
    if (showCreate) return

    if (e.key === 'Escape') {
      setIsOpen(false)
      return
    }

    // Open the dropdown on first arrow press
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          handleSelect(filtered[highlightedIndex])
        }
        break
      default:
        break
    }
  }

  const handleSelect = (client) => {
    // Close UI immediately
    setSearch(client.company_name)
    setIsOpen(false)

      // Fetch client data in the background
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
          notifyError?.(err.message || '載入客戶資料失敗')
        }
      })()
  }

  const createClient = async () => {
    if (!newClient.company_name.trim()) {
      notifyError?.('請輸入公司名稱')
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

      notifySuccess?.('成功建立客戶與聯絡人')

      const { data: updatedClients } = await supabase.from('clients').select('id, company_name, phone, email').order('company_name')
      setClients(updatedClients || [])

      // Pass full client data and contacts to onChange
      const createdContact = newContact.name.trim() ? newContact : null
      onChange?.({
        client: clientData,
        contacts: createdContact ? [{ ...newContact, client_id: clientData.id }] : []
      })
      setShowCreate(false)
    } catch (err) {
      notifyError?.(err.message || '建立失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full space-y-4 text-foreground">
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-1">
          選擇客戶
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 text-sm"
              placeholder="搜尋公司名稱、電話或 Email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setIsOpen(true)
                setHighlightedIndex(-1)
                if (!e.target.value) onChange?.(null)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              disabled={disabled || showCreate}
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); onChange?.(null); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label="清除搜尋"
              >
                <Icon name="close" className="text-base leading-none" title="" />
              </button>
            )}
          </div>

          {!showCreate && (
            <IconButton
              variant="normal"
              type="button"
              icon="add"
              label="新增客戶"
              onClick={() => setShowCreate(true)}
              disabled={disabled}
            />
          )}
        </div>

        {/* Dropdown panel */}
        {isOpen && !showCreate && (
          <div ref={listRef} className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-card border border-border rounded-md shadow-lg divide-y divide-border animate-in fade-in duration-100">
            {filtered.length > 0 ? (
              filtered.map((client, idx) => (
                <div
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex justify-between items-center ${highlightedIndex === idx || value === client.id
                    ? 'bg-muted text-foreground'
                    : 'text-foreground hover:bg-muted/50'
                    }`}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div>
                    <div className="font-medium">{client.company_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      {client.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="call" className="text-sm leading-none" title="" />
                          {client.phone}
                        </span>
                      )}
                      {client.email && (
                        <span className="inline-flex items-center gap-1">
                          <Icon name="mail" className="text-sm leading-none" title="" />
                          {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                  {value === client.id && <span className="text-primary text-xs font-semibold">已選取</span>}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                查無符合的客戶
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline Creation Subform */}
      {showCreate && (
        <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-4 animate-in fade-in duration-200">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1.5 flex items-center gap-1.5">
            <Icon name="domain_add" className="text-base leading-none" title="" />
            新增客戶基本資料
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="公司名稱 *">
              <input
                className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                value={newClient.company_name}
                onChange={e => setNewClient(p => ({ ...p, company_name: e.target.value }))}
                placeholder="例如：米爾斯股份有限公司"
              />
            </Field>
            <Field label="公司地址">
              <input
                className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                value={newClient.address}
                onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))}
              />
            </Field>
            <Field label="公司電話">
              <input
                className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                value={newClient.phone}
                onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))}
              />
            </Field>
            <Field label="傳真號碼">
              <input
                className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                value={newClient.fax}
                onChange={e => setNewClient(p => ({ ...p, fax: e.target.value }))}
              />
            </Field>
          </div>

          <h3 className="text-sm font-semibold text-foreground border-b border-border pt-2 pb-1.5 flex items-center gap-1.5">
            <Icon name="person" className="text-base leading-none" title="" />
            聯絡人資料
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="姓名">
              <input
                className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                value={newContact.name}
                onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
              />
            </Field>
            <Field label="行動電話">
              <input
                className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                value={newContact.mobile}
                onChange={e => setNewContact(p => ({ ...p, mobile: e.target.value }))}
              />
            </Field>
            <Field label="辦公室電話">
              <input
                className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                value={newContact.office_phone}
                onChange={e => setNewContact(p => ({ ...p, office_phone: e.target.value }))}
              />
            </Field>
            <Field label="電子郵件">
              <input
                className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                type="email"
                value={newContact.email}
                onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))}
              />
            </Field>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              type="button"
              onClick={createClient}
              disabled={loading || disabled}
            >
              {loading ? '建立中…' : '建立客戶'}
            </Button>
            <Button
              variant="ghost"
              type="button"
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

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}