// src/components/ClientPicker.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNotification } from '../context/NotificationContext'

export default function ClientPicker({ value, onChange }) {
  const [clients, setClients]       = useState([])
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [newClient, setNewClient]   = useState({
    company_name: '', address: '', phone: '', fax: '', email: '',
    responsible_person_name: '', responsible_person_title: '',
  })
  const [newContact, setNewContact] = useState({ name: '', mobile: '', office_phone: '', fax: '', email: '' })
  const { success, error } = useNotification()

  useEffect(() => {
    supabase.from('clients').select('id, company_name, phone, email')
      .order('company_name')
      .then(({ data }) => setClients(data || []))
  }, [])

  const filtered = clients.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const selectClient = async (client) => {
    const { data: contacts } = await supabase
      .from('contact_persons')
      .select('*')
      .eq('client_id', client.id)
      .order('is_primary', { ascending: false })
    onChange({ client, contacts: contacts || [] })
    setSearch('')
    setShowCreate(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!search || showCreate) return
    
    const isOpen = search && !showCreate && filtered.length > 0
    if (!isOpen) {
      if (e.key === 'Escape') {
        setSearch('')
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => prev < filtered.length - 1 ? prev + 1 : prev)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          selectClient(filtered[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setSearch('')
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }

  const createClient = async () => {
    if (!newClient.company_name.trim()) { error('請輸入公司名稱'); return }
    setLoading(true)
    const { data: created, error: err } = await supabase
      .from('clients').insert([newClient]).select().single()
    if (err) { error('建立客戶失敗：' + err.message); setLoading(false); return }

    if (newContact.name.trim()) {
      await supabase.from('contact_persons').insert([{
        client_id: created.id, ...newContact, is_primary: true,
      }])
    }
    const { data: contacts } = await supabase
      .from('contact_persons').select('*').eq('client_id', created.id)
    setClients(prev => [...prev, created])
    onChange({ client: created, contacts: contacts || [] })
    setSearch('')
    setShowCreate(false)
    success('客戶資料已建立')
    setLoading(false)
  }

  return (
    <div>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
        <input
          type="text"
          className="field-input"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setHighlightedIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          placeholder="搜尋現有客戶（公司名稱、電話）"
          aria-label="搜尋客戶"
          autoComplete="off"
        />
        {search && !showCreate && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: 260,
            overflowY: 'auto',
            marginTop: 4,
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                找不到符合的客戶
              </div>
            ) : (
              filtered.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectClient(c)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: 'var(--space-3) var(--space-4)',
                    background: idx === highlightedIndex ? 'var(--color-bg-subtle)' : 'none',
                    border: 'none', cursor: 'pointer',
                    fontSize: 'var(--text-base)',
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    transition: 'background var(--transition)',
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                >
                  <div style={{ fontWeight: 600 }}>{c.company_name}</div>
                  {c.phone && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{c.phone}</div>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Toggle create */}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setShowCreate(v => !v)}
        aria-expanded={showCreate}
      >
        {showCreate ? '取消' : '+ 建立新客戶'}
      </button>

      {/* Create form */}
      {showCreate && (
        <div style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-5)',
          background: 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>
          <p className="section-title" style={{ marginBottom: 0 }}>新客戶資料</p>

          <Grid>
            <Field label="公司名稱 *">
              <input className="field-input" value={newClient.company_name}
                onChange={e => setNewClient(p => ({ ...p, company_name: e.target.value }))}
                placeholder="某某建設股份有限公司" />
            </Field>
            <Field label="電子郵件">
              <input className="field-input" type="email" value={newClient.email}
                onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} />
            </Field>
          </Grid>
          <Field label="地址">
            <input className="field-input" value={newClient.address}
              onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))} />
          </Field>
          <Grid>
            <Field label="電話">
              <input className="field-input" value={newClient.phone}
                onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label="傳真">
              <input className="field-input" value={newClient.fax}
                onChange={e => setNewClient(p => ({ ...p, fax: e.target.value }))} />
            </Field>
          </Grid>
          <Grid>
            <Field label="負責人姓名">
              <input className="field-input" value={newClient.responsible_person_name}
                onChange={e => setNewClient(p => ({ ...p, responsible_person_name: e.target.value }))} />
            </Field>
            <Field label="負責人職稱">
              <input className="field-input" value={newClient.responsible_person_title}
                onChange={e => setNewClient(p => ({ ...p, responsible_person_title: e.target.value }))} />
            </Field>
          </Grid>

          <p className="section-title" style={{ marginBottom: 0, marginTop: 'var(--space-2)' }}>主要聯絡人</p>
          <Grid>
            <Field label="姓名">
              <input className="field-input" value={newContact.name}
                onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="手機">
              <input className="field-input" value={newContact.mobile}
                onChange={e => setNewContact(p => ({ ...p, mobile: e.target.value }))} />
            </Field>
          </Grid>
          <Grid>
            <Field label="辦公室電話">
              <input className="field-input" value={newContact.office_phone}
                onChange={e => setNewContact(p => ({ ...p, office_phone: e.target.value }))} />
            </Field>
            <Field label="電子郵件">
              <input className="field-input" type="email" value={newContact.email}
                onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} />
            </Field>
          </Grid>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary" type="button" onClick={createClient} disabled={loading}>
              {loading ? '建立中…' : '建立客戶'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setShowCreate(false)}>取消</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

function Grid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
      {children}
    </div>
  )
}
