// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useAppearance } from '../context/AppearanceContext'
import { useNotification } from '../context/NotificationContext'
import { formatRocDate } from '../lib/rocDate'
import Dialog from '../components/Dialog'
import StatusBadge from '../components/StatusBadge'
import Switch from '../components/Switch'
import Button from '../components/Button'
import IconButton from '../components/IconButton'
import Icon from '../components/Icon'
import FilterPill from '../components/FilterPill'
import ActionMenu, { ActionMenuItem } from '../components/ActionMenu'
import { FEATURE_NEGOTIATION, FEATURE_VERSIONING } from '../lib/featureFlags'
import packageJson from '../../package.json'

const STATUS_FILTERS = ['全部', '草稿', '已報價', '已確認', '已結案']
const fmt = (n) => n ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—'

export default function DashboardPage() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('全部')
  const [showArchived, setShowArchived] = useState(false)
  const [showNegotiating] = useState(false)
  const [quotationId, setQuotationId] = useState(null)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [actionMenuId, setActionMenuId] = useState(null)
  const { user, signOut } = useAuth()
  const { baseFontSize, setFontSize, contrast, toggleContrast } = useAppearance()
  const { success, error } = useNotification()
  const navigate = useNavigate()

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

    if (!showArchived) q = q.neq('status', '已結案')

    const { data, error: err } = await q
    if (err) { error('載入失敗：' + err.message); setLoading(false); return }

    if (FEATURE_VERSIONING) {
      const latestMap = {}
        ; (data || []).forEach(qt => {
          const root = getRootId(qt, data)
          if (!latestMap[root] || qt.version > latestMap[root].version) {
            latestMap[root] = qt
          }
        })
      setQuotations(Object.values(latestMap))
    } else {
      setQuotations(data || [])
    }
    setLoading(false)
  }

  /* inactive: versioning — resolve quote chain root for latest-version dedup */
  const getRootId = (qt, all) => {
    if (!qt.parent_id) return qt.id
    const parent = all.find(q => q.id === qt.parent_id)
    return parent ? getRootId(parent, all) : qt.id
  }

  useEffect(() => { fetchQuotations() }, [showArchived]) // eslint-disable-line

  const archive = async (id) => {
    await supabase.from('quotations').update({ status: '已結案' }).eq('id', id)
    success('已結案')
    fetchQuotations()
  }

  const handleDelete = (id) => {
    setQuotationId(id)
    setShowExitDialog(true)
  }

  const handleDeleteConfirm = async () => {
    setShowExitDialog(false)
    await deleteQuotation()
  }

  const handleDeleteCancel = () => {
    setShowExitDialog(false)
  }

  const deleteQuotation = async () => {
    await supabase.from('quotations').update({ status: '已刪除' }).eq('id', quotationId)
    success('已刪除')
    fetchQuotations()
  }

  const filtered = quotations.filter(q => {
    const matchSearch =
      (q.quote_number || '').includes(search) ||
      (q.clients?.company_name || '').includes(search)
    const matchStatus = statusFilter === '全部' || q.status === statusFilter
    const matchNeg = !FEATURE_NEGOTIATION || !showNegotiating || q.is_negotiating
    const matchDelete = q.status !== '已刪除'
    return matchSearch && matchStatus && matchNeg && matchDelete
  })

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <Dialog
        isOpen={showExitDialog}
        title="刪除報價單"
        message="確定要刪除這份報價單嗎？"
        confirmText="刪除"
        cancelText="取消"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* ── Top Bar / Navigation ── */}
      <header className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-4 py-4 md:px-8 text-zinc-50 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-lg font-bold text-zinc-950" aria-hidden="true">
            報
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-bold tracking-tight">報價管理系統</h1>
              <p className="text-xs text-zinc-400 font-mono">v{packageJson.version}</p>
            </div>
            <p className="text-xs text-zinc-400">{user?.email}</p>
          </div>
        </div>

        {/* Action controls / Accessibility items */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-xs">
            <Button
              variant="ghost-inverse"
              size="sm"
              onClick={() => setFontSize(baseFontSize - 1)}
              aria-label="縮小字體"
            >
              A-
            </Button>
            <span className="px-1.5 font-mono min-w-[36px] text-center text-zinc-200">
              {baseFontSize}px
            </span>
            <Button
              variant="ghost-inverse"
              size="sm"
              onClick={() => setFontSize(baseFontSize + 1)}
              aria-label="放大字體"
            >
              A+
            </Button>
          </div>
          <Button
            variant="ghost-inverse"
            size="sm"
            onClick={toggleContrast}
            aria-label={contrast === 'high' ? '關閉高對比' : '開啟高對比'}
          >
            {contrast === 'high' ? '標準' : '高對比'}
          </Button>
          <Button
            variant="ghost-inverse"
            size="sm"
            onClick={() => navigate('/admin/clients')}
          >
            管理
          </Button>
          <Button
            variant="ghost-inverse"
            size="sm"
            onClick={signOut}
          >
            登出
          </Button>
        </div>
      </header>

      {/* ── Main Application Workspace ── */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-6">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <input
            type="search"
            className="w-full sm:max-w-xs rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋報價編號、客戶名稱…"
            aria-label="搜尋報價單"
          />
          <IconButton
            icon="add"
            label="新增報價單"
            variant="primary"
            onClick={() => navigate('/quotation/new')}
            aria-label="新增報價單"
          />
        </div>

        {/* Filter Area */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(f => (
              <FilterPill
                key={f}
                pressed={statusFilter === f}
                onChange={() => {
                  setStatusFilter(f)
                  setShowArchived(f === '已結案')
                }}
              >
                {f}
              </FilterPill>
            ))}
          </div>
          <div className="flex items-center">
            <Switch
              checked={showArchived}
              onChange={setShowArchived}
              label="顯示已結案"
              id="archiveToggle"
              size="md"
            />
          </div>
        </div>

        {/* Data View States */}
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            載入中…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center text-card-foreground shadow-sm">
            <div className="mb-3 text-muted-foreground/60" aria-hidden="true">
              <Icon name="description" className="text-5xl" title="" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">尚無報價單</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate('/quotation/new')}
            >
              建立第一份報價單
            </Button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* 📱 Mobile: Cards Layout */}
            <div className="block md:hidden space-y-3">
              {filtered.map(q => (
                <div
                  key={q.id}
                  className="p-4 bg-card text-card-foreground border border-border rounded-xl shadow-sm hover:border-muted-foreground/30 transition-all cursor-pointer space-y-3"
                  onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground border border-border">
                      {q.quote_number}{FEATURE_VERSIONING && q.version > 1 ? ` v${q.version}` : ''}
                    </span>
                    <StatusBadge status={q.status} isNegotiating={FEATURE_NEGOTIATION && q.is_negotiating} size="sm" />
                  </div>
                  <div className="text-sm font-medium text-foreground">{q.clients?.company_name || '—'}</div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{formatRocDate(q.quote_date)}</span>
                    <span className="font-semibold text-foreground">{fmt(q.fee_amount)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 🖥️ Desktop: Table Layout */}
            <div className="hidden md:block overflow-x-auto border border-border rounded-xl bg-card shadow-sm">
              <table className="w-full text-left border-collapse text-sm text-card-foreground">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4">報價編號</th>
                    <th className="p-4">客戶名稱</th>
                    <th className="p-4">報價日期</th>
                    <th className="p-4">金額</th>
                    <th className="p-4">狀態</th>
                    <th className="p-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(q => (
                    <tr
                      key={q.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}
                    >
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground border border-border">
                          {q.quote_number}{FEATURE_VERSIONING && q.version > 1 ? ` v${q.version}` : ''}
                        </span>
                      </td>
                      <td className="p-4 align-middle font-medium text-foreground">{q.clients?.company_name || '—'}</td>
                      <td className="p-4 align-middle text-muted-foreground">{formatRocDate(q.quote_date)}</td>
                      <td className="p-4 align-middle font-semibold text-foreground">{fmt(q.fee_amount)}</td>
                      <td className="p-4 align-middle" onClick={e => e.stopPropagation()}>
                        <StatusBadge status={q.status} isNegotiating={FEATURE_NEGOTIATION && q.is_negotiating} size="sm" />
                      </td>
                      <td className="p-4 align-middle text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="normal"
                            size="sm"
                            onClick={() => navigate(`/quotation/${q.id}`)}
                          >
                            檢視
                          </Button>
                          {q.status === '草稿' && (
                            <Button
                              variant="normal"
                              size="sm"
                              onClick={() => navigate(`/quotation/new?edit=${q.id}`)}
                            >
                              編輯
                            </Button>
                          )}
                          <ActionMenu
                            id={q.id}
                            openId={actionMenuId}
                            onOpen={setActionMenuId}
                            onClose={() => setActionMenuId(null)}
                          >
                            {q.status !== '已結案' && (
                              <ActionMenuItem
                                icon="done_outline"
                                label="結案"
                                onClick={() => archive(q.id)}
                              />
                            )}
                            <ActionMenuItem
                              icon="delete"
                              label="刪除"
                              danger
                              onClick={() => handleDelete(q.id)}
                            />
                          </ActionMenu>
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