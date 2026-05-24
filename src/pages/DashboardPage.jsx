// src/pages/DashboardPage.jsx
import { React, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../context/NotificationContext'
import { formatRocDate } from '../lib/rocDate'
import StatusBadge from '../components/StatusBadge'
import Switch from '../components/Switch'
import packageJson from '../../package.json';

const STATUS_FILTERS = ['全部', '草稿', '已報價', '已確認']
const fmt = (n) => n ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—'

export default function DashboardPage() {
  const [quotations, setQuotations]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [showArchived, setShowArchived] = useState(false)
  const [showNegotiating, setShowNegotiating] = useState(false)
  const { user, signOut }             = useAuth()
  const { baseFontSize, setFontSize, contrast, toggleContrast } = useTheme()
  const { success, error }            = useNotification()
  const navigate                      = useNavigate()

  const fetchQuotations = async () => {
    setLoading(true)
    let q = supabase
      .from('quotations')
      .select(`
        id, quote_number, version, parent_id, status, is_negotiating,
        quote_date, fee_amount, tax_included, created_at,
        clients(company_name),
        contact_persons(name)
      `)
      .order('created_at', { ascending: false })

    if (!showArchived) q = q.neq('status', '已封存')

    const { data, error: err } = await q
    if (err) { error('載入失敗：' + err.message); setLoading(false); return }

    // Only show latest version of each chain
    const latestMap = {}
    ;(data || []).forEach(qt => {
      const root = getRootId(qt, data)
      if (!latestMap[root] || qt.version > latestMap[root].version) {
        latestMap[root] = qt
      }
    })
    setQuotations(Object.values(latestMap))
    setLoading(false)
  }

  const getRootId = (qt, all) => {
    if (!qt.parent_id) return qt.id
    const parent = all.find(q => q.id === qt.parent_id)
    return parent ? getRootId(parent, all) : qt.id
  }

  useEffect(() => { fetchQuotations() }, [showArchived]) // eslint-disable-line

  const archive = async (id) => {
    if (!window.confirm('封存此報價單？封存後將從列表隱藏，但資料不會刪除。')) return
    await supabase.from('quotations').update({ status: '已封存' }).eq('id', id)
    success('已封存')
    fetchQuotations()
  }

  const filtered = quotations.filter(q => {
    const matchSearch =
      (q.quote_number || '').includes(search) ||
      (q.clients?.company_name || '').includes(search)
    const matchStatus = statusFilter === '全部' || q.status === statusFilter
    const matchNeg = !showNegotiating || q.is_negotiating
    return matchSearch && matchStatus && matchNeg
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Top bar */}
      <header style={hdr.bar}>
        <div style={hdr.left}>
          <div style={hdr.logo} aria-hidden="true">報</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <h1 style={hdr.title}>報價管理系統</h1>
              <p style={hdr.subtitle}> v{packageJson.version} </p>
            </div>
            <p style={hdr.subtitle}>{user?.email}</p>
          </div>
        </div>
        <div style={hdr.right}>
          {/* Accessibility controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              aria-label="縮小字體"
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--color-text-inverse)', minWidth: 'var(--tap-min)' }}
              onClick={() => setFontSize(baseFontSize - 1)}
            >A-</button>
            <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.7)', minWidth: 32, textAlign: 'center' }}>
              {baseFontSize}px
            </span>
            <button
              aria-label="放大字體"
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--color-text-inverse)', minWidth: 'var(--tap-min)' }}
              onClick={() => setFontSize(baseFontSize + 1)}
            >A+</button>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--color-text-inverse)', minWidth: 'var(--tap-min)' }}
            onClick={toggleContrast}
            aria-label={contrast === 'high' ? '關閉高對比' : '開啟高對比'}
          >
            {contrast === 'high' ? '標準' : '高對比'}
          </button>
          <button className="btn btn-ghost btn-sm"
            style={{ color: 'var(--color-text-inverse)' }}
            onClick={() => navigate('/admin/clients')}>管理</button>
          <button className="btn btn-ghost btn-sm"
            style={{ color: 'var(--color-text-inverse)' }}
            onClick={signOut}>登出</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--space-6) var(--space-5)' }}>
        {/* Toolbar */}
        <div style={tb.row}>
          <input
            type="search"
            className="field-input"
            style={{ flex: 1, maxWidth: 360 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋報價編號、客戶名稱…"
            aria-label="搜尋報價單"
          />
          <button
            className="btn btn-primary"
            onClick={() => navigate('/quotation/new')}
            aria-label="新增報價單"
          >
            + 新增報價單
          </button>
        </div>

        {/* Filter pills */}
        <div style={tb.filters}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              className="filter-pill"
              onClick={() => setStatusFilter(f)}
              aria-pressed={statusFilter === f}
            >{f}</button>
          ))}
          {/* <button
            className="filter-pill"
            onClick={() => setShowNegotiating(v => !v)}
            aria-pressed={showNegotiating}
            style={showNegotiating ? {
              background: 'var(--status-negotiating-bg)',
              color: 'var(--status-negotiating-text)',
              borderColor: 'var(--status-negotiating-border)',
            } : undefined}
          >議價中</button> */}
          <div style={{ marginLeft: 'auto' }}>
            <Switch
              checked={showArchived}
              onChange={setShowArchived}
              label="顯示已封存"
              id="archiveToggle"
              size="md"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
            載入中…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>📋</div>
            <p>尚無報價單</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}
              onClick={() => navigate('/quotation/new')}>
              建立第一份報價單
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {/* Mobile: cards */}
            <div className="hide-desktop">
              {filtered.map(q => (
                <div key={q.id} style={{
                  padding: 'var(--space-4)',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }} onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', background: 'var(--color-bg-subtle)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
                      {q.quote_number}{q.version > 1 ? ` v${q.version}` : ''}
                    </span>
                    <StatusBadge status={q.status} isNegotiating={q.is_negotiating} size="sm" />
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>{q.clients?.company_name || '—'}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {formatRocDate(q.quote_date)} ／ {fmt(q.fee_amount)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hide-mobile" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>報價編號</th>
                    <th>客戶名稱</th>
                    <th>報價日期</th>
                    <th>金額</th>
                    <th>狀態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(q => (
                    <tr key={q.id} style={{ cursor: 'pointer' }}
                      onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', background: 'var(--color-bg-subtle)', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
                          {q.quote_number}{q.version > 1 ? ` v${q.version}` : ''}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{q.clients?.company_name || '—'}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{formatRocDate(q.quote_date)}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(q.fee_amount)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <StatusBadge status={q.status} isNegotiating={q.is_negotiating} size="sm" />
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-sm btn-secondary"
                            onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}>
                            {q.status === '草稿' ? '編輯' : '檢視'}
                          </button>
                          {q.status !== '已封存' && (
                            <button className="btn btn-sm btn-secondary"
                              onClick={() => archive(q.id)}>
                              封存
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const hdr = {
  bar: {
    background: 'var(--color-text)',
    color: 'var(--color-text-inverse)',
    padding: 'var(--space-4) var(--space-6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    flexWrap: 'wrap',
    position: 'sticky', top: 0, zIndex: 100,
  },
  left: { display: 'flex', alignItems: 'center', gap: 'var(--space-4)' },
  logo: {
    width: 44, height: 44,
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text)',
    borderRadius: 'var(--radius-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 'var(--text-lg)', fontWeight: 700, flexShrink: 0,
  },
  title: { margin: 0, fontSize: 'var(--text-md)', fontWeight: 700, letterSpacing: '0.04em' },
  subtitle: { margin: 0, fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  right: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' },
}

const tb = {
  row: {
    display: 'flex', gap: 'var(--space-3)', alignItems: 'center',
    marginBottom: 'var(--space-4)', flexWrap: 'wrap',
  },
  filters: {
    display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap',
    marginBottom: 'var(--space-5)',
  },
}
