// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useAppearance } from '../context/AppearanceContext'
import { APP_THEMES, getThemeLabel } from '@/lib/themes'
import { toast } from 'sonner'
import { formatRocDate } from '../lib/rocDate'
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
import { Badge, QuotationStatusBadges } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { AppEmptyState } from '@/components/AppEmptyState'
import { DashboardQuotationsSkeleton } from '@/components/skeletons'
import IconTooltip from '@/components/IconTooltip'
import { AppBrandTitle, AppShellHeader } from '@/components/AppShellHeader'
import { Archive, Eye, FileText, MoreHorizontal, Palette, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { FEATURE_NEGOTIATION, FEATURE_VERSIONING } from '../lib/featureFlags'

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
  const { baseFontSize, setFontSize, theme, setTheme } = useAppearance()
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
      .neq('status', '已刪除')

    const { data, error: err } = await q
    if (err) { toast.error('載入失敗：' + err.message, { duration: 6000 }); setLoading(false); return }

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

  useEffect(() => { fetchQuotations() }, []) // eslint-disable-line

  const archive = async (id) => {
    await supabase.from('quotations').update({ status: '已結案' }).eq('id', id)
    toast.success('已結案')
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
    toast.success('已刪除')
    fetchQuotations()
  }

  const matchesSearch = (q) =>
    (q.quote_number || '').includes(search) ||
    (q.clients?.company_name || '').includes(search)

  const poolQuotations = quotations.filter(q => {
    const matchStatus =
      statusFilter === '全部'
        ? showArchived || q.status !== '已結案'
        : q.status === statusFilter
    const matchNeg = !FEATURE_NEGOTIATION || !showNegotiating || q.is_negotiating
    return matchStatus && matchNeg
  })

  const filtered = poolQuotations.filter(matchesSearch)

  const listSummary = (() => {
    if (loading) return null
    const hasFilters = search.trim() !== '' || statusFilter !== '全部'
    if (filtered.length === 0) {
      return quotations.length === 0
        ? '尚無報價單，建立第一份報價開始吧'
        : '找不到符合條件的報價單'
    }
    const totalSuffix = hasFilters && filtered.length !== poolQuotations.length ? ` / ${poolQuotations.length}` : ''
    return `共 ${filtered.length}${totalSuffix} 筆`
  })()

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <AlertDialog
        open={showExitDialog}
        onOpenChange={open => {
          if (!open) handleDeleteCancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除報價單</AlertDialogTitle>
            <AlertDialogDescription>確定要刪除這份報價單嗎？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppShellHeader>
        <AppBrandTitle subtitle={user?.email} showVersion />

        {/* Action controls / Accessibility items */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
            <IconTooltip label="縮小字體">
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold"
                onClick={() => setFontSize(baseFontSize - 1)}
                aria-label="縮小字體"
              >
                A-
              </Button>
            </IconTooltip>
            <span className="min-w-[36px] px-1.5 text-center font-mono text-foreground">
              {baseFontSize}px
            </span>
            <IconTooltip label="放大字體">
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold"
                onClick={() => setFontSize(baseFontSize + 1)}
                aria-label="放大字體"
              >
                A+
              </Button>
            </IconTooltip>
          </div>
          <div className="flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5">
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger
                size="sm"
                className="h-7 min-w-[11rem] max-w-[12rem] gap-1 border-0 bg-transparent px-1.5 font-semibold shadow-none focus-visible:ring-2"
                aria-label="切換主題色彩"
              >
                <Palette className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{getThemeLabel(theme)}</span>
              </SelectTrigger>
              <SelectContent align="end" side="bottom" alignItemWithTrigger={false}>
                {APP_THEMES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <IconTooltip label="管理介面">
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold"
              onClick={() => navigate('/admin/clients')}
              aria-label="管理介面"
            >
              管理
            </Button>
          </IconTooltip>
          <IconTooltip label="登出">
            <Button
              variant="ghost"
              size="sm"
              className="font-semibold"
              onClick={signOut}
              aria-label="登出"
            >
              登出
            </Button>
          </IconTooltip>
        </div>
      </AppShellHeader>

      {/* ── Main Application Workspace ── */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24 sm:pb-6 md:px-8">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">報價單列表</h1>
          {listSummary && (
            <p className="mt-1 text-sm text-muted-foreground">{listSummary}</p>
          )}
        </div>

        {/* Search + primary action — same row for a natural scan path */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="h-11 flex-1 bg-card sm:max-w-md">
            <InputGroupAddon>
              <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋報價編號、客戶名稱…"
              aria-label="搜尋報價單"
            />
          </InputGroup>
          <Button
            variant="default"
            size="md"
            className="hidden h-11 shrink-0 px-5 font-semibold sm:inline-flex"
            onClick={() => navigate('/quotation/new')}
            aria-label="新增報價單"
          >
            <Plus data-icon="inline-start" />
            新增報價單
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(values) => {
              setStatusFilter(values[0] ?? '全部')
            }}
            variant="outline"
            size="sm"
            className="flex-wrap"
          >
            {STATUS_FILTERS.map(f => (
              <ToggleGroupItem key={f} value={f} className="rounded-full px-4">
                {f}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Field orientation="horizontal" className="w-auto items-center gap-3">
            <FieldLabel htmlFor="archiveToggle" className="cursor-pointer">
              顯示已結案
            </FieldLabel>
            <Switch
              id="archiveToggle"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
          </Field>
        </div>

        {/* Data View States */}
        {loading ? (
          <DashboardQuotationsSkeleton />
        ) : filtered.length === 0 ? (
          <AppEmptyState
            icon={FileText}
            title={quotations.length === 0 ? '尚無報價單' : '找不到符合條件的報價單'}
            description={
              quotations.length === 0
                ? '建立第一份報價開始吧'
                : '試試調整搜尋或篩選條件'
            }
            action={
              quotations.length === 0 ? (
                <Button
                  variant="default"
                  size="md"
                  className="font-semibold"
                  onClick={() => navigate('/quotation/new')}
                >
                  建立第一份報價單
                </Button>
              ) : null
            }
            className="shadow-sm"
          />
        ) : (
          <div className="space-y-4">

            {/* 📱 Mobile: Cards Layout */}
            <div className="block md:hidden space-y-3">
              {filtered.map(q => (
                <Card
                  key={q.id}
                  size="sm"
                  className="cursor-pointer gap-0 py-0 shadow-sm transition-all hover:ring-muted-foreground/30"
                  onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}
                >
                  <CardContent className="space-y-3 py-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="font-mono font-medium">
                        {q.quote_number}{FEATURE_VERSIONING && q.version > 1 ? ` v${q.version}` : ''}
                      </Badge>
                      <QuotationStatusBadges status={q.status} isNegotiating={FEATURE_NEGOTIATION && q.is_negotiating} />
                    </div>
                    <div className="text-sm font-medium text-foreground">{q.clients?.company_name || '—'}</div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{formatRocDate(q.quote_date)}</span>
                      <span className="font-semibold text-foreground">{fmt(q.fee_amount)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 🖥️ Desktop: Table Layout */}
            <Card className="hidden md:block gap-0 py-0 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">報價編號</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">客戶名稱</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">報價日期</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">金額</TableHead>
                    <TableHead className="h-auto p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">狀態</TableHead>
                    <TableHead className="h-auto p-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(q => (
                    <TableRow
                      key={q.id}
                      className="cursor-pointer border-border hover:bg-muted/30"
                      onClick={() => q.status === '草稿' ? navigate(`/quotation/new?edit=${q.id}`) : navigate(`/quotation/${q.id}`)}
                    >
                      <TableCell className="p-4">
                        <Badge variant="secondary" className="font-mono font-medium">
                          {q.quote_number}{FEATURE_VERSIONING && q.version > 1 ? ` v${q.version}` : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4 font-medium text-foreground">{q.clients?.company_name || '—'}</TableCell>
                      <TableCell className="p-4 text-muted-foreground">{formatRocDate(q.quote_date)}</TableCell>
                      <TableCell className="p-4 font-semibold text-foreground">{fmt(q.fee_amount)}</TableCell>
                      <TableCell className="p-4" onClick={e => e.stopPropagation()}>
                        <QuotationStatusBadges status={q.status} isNegotiating={FEATURE_NEGOTIATION && q.is_negotiating} />
                      </TableCell>
                      <TableCell className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu
                          open={actionMenuId === q.id}
                          onOpenChange={open => {
                            if (open) setActionMenuId(q.id)
                            else setActionMenuId(null)
                          }}
                        >
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="操作"
                                title="操作"
                                onClick={e => e.stopPropagation()}
                              >
                                <MoreHorizontal className="size-4 shrink-0" aria-hidden="true" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="min-w-[140px]">
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onClick={e => {
                                  e.stopPropagation()
                                  navigate(`/quotation/${q.id}`)
                                }}
                              >
                                <Eye />
                                檢視
                              </DropdownMenuItem>
                              {q.status === '草稿' && (
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation()
                                    navigate(`/quotation/new?edit=${q.id}`)
                                  }}
                                >
                                  <Pencil />
                                  編輯
                                </DropdownMenuItem>
                              )}
                              {q.status !== '已結案' && (
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation()
                                    archive(q.id)
                                  }}
                                >
                                  <Archive />
                                  結案
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={e => {
                                  e.stopPropagation()
                                  handleDelete(q.id)
                                }}
                              >
                                <Trash2 />
                                刪除
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </main>

      {/* Mobile FAB — thumb-friendly while scrolling the list */}
      {!loading && (
        <div className="fixed bottom-6 right-6 z-40 sm:hidden">
          <IconTooltip label="新增報價單" side="left">
            <Button
              variant="default"
              size="icon-lg"
              className="size-14 rounded-full shadow-lg"
              onClick={() => navigate('/quotation/new')}
              aria-label="新增報價單"
            >
              <Plus className="size-6" aria-hidden="true" />
            </Button>
          </IconTooltip>
        </div>
      )}
    </div>
  )
}