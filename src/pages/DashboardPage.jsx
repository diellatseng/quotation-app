// src/pages/DashboardPage.jsx
import { React, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../context/NotificationContext'
import { formatRocDate } from '../lib/rocDate'
import StatusBadge from '../components/StatusBadge'
import Switch from '../components/Switch'
import Button from '../components/Button'
import FilterPill from '../components/FilterPill'
import packageJson from '../../package.json';

const STATUS_FILTERS = ['全部', '草稿', '已報價', '已確認']
const fmt = (n) => n ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—'

export default function DashboardPage() {
  const [quotations, setQuotations]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [showArchived, setShowArchived] = useState(false)
  const [showNegotiating] = useState(false)
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
    <div className="dashboard-page">
      {/* Top bar */}
      <header className="dashboard-header">
        <div className="dashboard-header__left">
          <div className="dashboard-header__logo" aria-hidden="true">報</div>
          <div>
            <div className="dashboard-header__title-row">
              <h1 className="dashboard-header__title">報價管理系統</h1>
              <p className="dashboard-header__subtitle"> v{packageJson.version} </p>
            </div>
            <p className="dashboard-header__subtitle">{user?.email}</p>
          </div>
        </div>
        <div className="dashboard-header__right">
          {/* Accessibility controls */}
          <div className="dashboard-accessibility">
            <Button
              variant="ghost"
              size="sm"
              className="btn-ghost-inverse dashboard-header__button"
              onClick={() => setFontSize(baseFontSize - 1)}
              aria-label="縮小字體"
            >
              A-
            </Button>
            <span className="dashboard-accessibility__value">
              {baseFontSize}px
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="btn-ghost-inverse dashboard-header__button"
              onClick={() => setFontSize(baseFontSize + 1)}
              aria-label="放大字體"
            >
              A+
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="btn-ghost-inverse dashboard-header__button"
            onClick={toggleContrast}
            aria-label={contrast === 'high' ? '關閉高對比' : '開啟高對比'}
          >
            {contrast === 'high' ? '標準' : '高對比'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="btn-ghost-inverse"
            onClick={() => navigate('/admin/clients')}
          >
            管理
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="btn-ghost-inverse"
            onClick={signOut}
          >
            登出
          </Button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Toolbar */}
        <div className="dashboard-toolbar">
          <input
            type="search"
            className="field-input dashboard-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋報價編號、客戶名稱…"
            aria-label="搜尋報價單"
          />
          <Button
            variant="primary"
            onClick={() => navigate('/quotation/new')}
            aria-label="新增報價單"
          >
            + 新增報價單
          </Button>
        </div>

        {/* Filter pills */}
        <div className="dashboard-filters">
          {STATUS_FILTERS.map(f => (
            <FilterPill
              key={f}
              pressed={statusFilter === f}
              onChange={() => setStatusFilter(f)}
            >
              {f}
            </FilterPill>
          ))}
          <div className="dashboard-filters__spacer">
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
          <div className="empty-state">
            載入中…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <p>尚無報價單</p>
            <Button
              variant="primary"
              className="empty-state__action"
              onClick={() => navigate('/quotation/new')}
            >
              建立第一份報價單
            </Button>
          </div>
        ) : (
          <div className="dashboard-results">
            {/* Mobile: cards */}
            <div className="hide-desktop">
              {filtered.map(q => (
                <div
                  key={q.id}
                  className="dashboard-mobile-card"
                  onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}
                >
                  <div className="dashboard-mobile-card__header">
                    <span className="dashboard-quote-pill">
                      {q.quote_number}{q.version > 1 ? ` v${q.version}` : ''}
                    </span>
                    <StatusBadge status={q.status} isNegotiating={q.is_negotiating} size="sm" />
                  </div>
                  <div className="dashboard-mobile-card__client">{q.clients?.company_name || '—'}</div>
                  <div className="dashboard-mobile-card__meta">
                    {formatRocDate(q.quote_date)} ／ {fmt(q.fee_amount)}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hide-mobile dashboard-table-scroll">
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
                    <tr key={q.id} className="dashboard-table-row"
                      onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}>
                      <td>
                        <span className="dashboard-quote-pill">
                          {q.quote_number}{q.version > 1 ? ` v${q.version}` : ''}
                        </span>
                      </td>
                      <td className="dashboard-cell-strong">{q.clients?.company_name || '—'}</td>
                      <td className="dashboard-cell-secondary">{formatRocDate(q.quote_date)}</td>
                      <td className="dashboard-cell-strong">{fmt(q.fee_amount)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <StatusBadge status={q.status} isNegotiating={q.is_negotiating} size="sm" />
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="dashboard-actions">
                          <Button
                            variant="normal"
                            size="sm"
                            onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}
                          >
                            {q.status === '草稿' ? '編輯' : '檢視'}
                          </Button>
                          {q.status !== '已封存' && (
                            <Button
                              variant="normal"
                              size="sm"
                              onClick={() => archive(q.id)}
                            >
                              封存
                            </Button>
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
      </main>
    </div>
  )
}
