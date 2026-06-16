// src/components/ServiceTable.jsx
import { useState, useRef } from 'react'
import RichEditor from './RichEditor'
import { ChevronsDown, ChevronsUp, ChevronDown, ChevronRight, GripVertical, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react'
import { AppEmptyState } from '@/components/AppEmptyState'
import IconTooltip from '@/components/IconTooltip'
import { Badge, DiffBadge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  getServiceRowIndexBadgeClass,
  getServiceRowState,
  ServiceRowSection,
  ServiceRowShell,
} from './ServiceRowShell'
import { FEATURE_VERSIONING } from '../lib/featureFlags'

export default function ServiceTable({ services, onChange, readOnly = false }) {
  const [checklistIdx, setChecklistIdx] = useState(null)
  const [editingDesc, setEditingDesc] = useState(null)
  const [draftDesc, setDraftDesc] = useState('')
  const [collapsedDescs, setCollapsedDescs] = useState({})
  const [deleteDialogIdx, setDeleteDialogIdx] = useState(null)

  // ── Drag state ────────────────────────────────────────────────────────────
  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [dragOverIdxState, setDragOverIdxState] = useState(null)

  const handleDragStart = (idx) => { dragIdx.current = idx; setDraggingIdx(idx) }
  const handleDragEnter = (idx) => {
    if (idx === dragIdx.current) return
    dragOverIdx.current = idx; setDragOverIdxState(idx)
  }
  const handleDragEnd = () => {
    const from = dragIdx.current, to = dragOverIdx.current
    if (from !== null && to !== null && from !== to) {
      const next = [...services]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      onChange(next)
      if (editingDesc === from) setEditingDesc(to)
      if (checklistIdx === from) setChecklistIdx(to)
    }
    dragIdx.current = null; dragOverIdx.current = null
    setDraggingIdx(null); setDragOverIdxState(null)
  }

  // ── Service CRUD ──────────────────────────────────────────────────────────
  const updateService = (idx, field, val) => {
    const next = [...services]; next[idx] = { ...next[idx], [field]: val }; onChange(next)
  }
  const removeService = (idx) => {
    onChange(services.filter((_, i) => i !== idx))
    if (editingDesc === idx) setEditingDesc(null)
    if (checklistIdx === idx) setChecklistIdx(null)
    const next = { ...collapsedDescs }; delete next[idx]; setCollapsedDescs(next)
  }
  // Two-step delete replaced by AlertDialog — see deleteDialogIdx state.
  const confirmDeleteService = () => {
    if (deleteDialogIdx === null) return
    removeService(deleteDialogIdx)
    setDeleteDialogIdx(null)
  }
  const addService = () => onChange([...services, {
    id: crypto.randomUUID(), service_name: '', category: '',
    description: '', checklist_items: [], is_added: true,
  }])

  // ── Description edit/save ─────────────────────────────────────────────────
  const startEdit = (idx) => { setEditingDesc(idx); setDraftDesc(services[idx].description || '') }
  const cancelEdit = () => { setEditingDesc(null); setDraftDesc('') }
  const commitEdit = (idx) => {
    updateService(idx, 'description', draftDesc)
    setEditingDesc(null); setDraftDesc('')
  }
  const startEditFromMenu = (idx) => {
    setCollapsedDescs(p => ({ ...p, [idx]: false }))
    startEdit(idx)
  }

  // ── Description collapse ──────────────────────────────────────────────────
  const isCollapsed = (idx) => collapsedDescs[idx] ?? false
  const toggleCollapse = (idx) => setCollapsedDescs(p => ({ ...p, [idx]: !p[idx] }))

  // collapse-all / expand-all helpers (toolbar)
  const descIndices = services.reduce((acc, s, i) =>
    (!s._removed && (s.description || '').trim()) ? [...acc, i] : acc, [])
  const hasAnyDesc = descIndices.length > 0
  const allCollapsed = hasAnyDesc && descIndices.every(i => collapsedDescs[i])
  const collapseAll = () => { const n = {}; descIndices.forEach(i => { n[i] = true }); setCollapsedDescs(n) }
  const expandAll = () => setCollapsedDescs({})

  // ── Checklist CRUD ────────────────────────────────────────────────────────
  const addChecklistItem = (idx) => {
    const items = [...(services[idx].checklist_items || []), { id: crypto.randomUUID(), item_text: '' }]
    updateService(idx, 'checklist_items', items)
  }
  const updateChecklistItem = (si, ii, val) => {
    const items = [...(services[si].checklist_items || [])]
    items[ii] = { ...items[ii], item_text: val }
    updateService(si, 'checklist_items', items)
  }
  const removeChecklistItem = (si, ii) =>
    updateService(si, 'checklist_items',
      (services[si].checklist_items || []).filter((_, i) => i !== ii))
  const openChecklist = (idx) => setChecklistIdx(idx)
  const closeChecklist = () => setChecklistIdx(null)

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!services.length) return (
    <AppEmptyState
      icon={ListChecks}
      title="尚無服務項目"
      description="請從工程範本載入或手動新增"
      action={
        !readOnly ? (
          <Button
            variant="accent"
            size="md"
            className="font-semibold"
            onClick={addService}
          >
            <Plus data-icon="inline-start" />
            新增服務項目
          </Button>
        ) : null
      }
    />
  )

  return (
    <div>
      <AlertDialog
        open={deleteDialogIdx !== null}
        onOpenChange={open => {
          if (!open) setDeleteDialogIdx(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除服務項目</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此服務項目嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeleteService}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap min-h-[28px]">
        {!readOnly && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <GripVertical className="size-4 shrink-0" aria-hidden="true" />
            拖曳左側可調整順序
          </span>
        )}
        {hasAnyDesc && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={allCollapsed ? expandAll : collapseAll}
            title={allCollapsed ? '展開所有說明' : '折疊所有說明'}
            aria-label={allCollapsed ? '展開所有說明' : '折疊所有說明'}
            className="ml-auto h-7 px-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap"
          >
            {allCollapsed ? (
              <ChevronsDown className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronsUp className="size-4 shrink-0" aria-hidden="true" />
            )}
            {allCollapsed ? '全部展開' : '全部折疊'}
          </Button>
        )}
      </div>

      {/* ── Cards ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {services.map((svc, idx) => {
          const isDragging = draggingIdx === idx
          const isOver = dragOverIdxState === idx && draggingIdx !== idx
          const isEditing = editingDesc === idx
          const hasDesc = (svc.description || '').trim().length > 0
          const collapsed = isCollapsed(idx)
          const diff = FEATURE_VERSIONING ? svc.diff_status : null
          const isRemoved = diff === 'removed'
          const checklistCount = (svc.checklist_items || []).filter(i => i.item_text?.trim()).length
          const rowState = getServiceRowState({
            isOver,
            diff,
            isAdded: svc.is_added,
            isDragging,
          })

          return (
            <ServiceRowShell
              key={svc.service_id || idx}
              state={rowState}
              isDragging={isDragging}
              isRemoved={isRemoved}
              draggable={!readOnly && !isRemoved && !isEditing}
              onDragStart={() => !isRemoved && handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragOver={e => e.preventDefault()}
              onDragEnd={handleDragEnd}
            >
              {/* ── Header row ─────────────────────────────────────────── */}
              <ServiceRowSection className="flex min-h-[52px] items-center gap-2 py-2">

                {/* Drag handle */}
                {!readOnly && (
                  <IconTooltip label="拖曳調整順序">
                    <div
                      className="grid shrink-0 cursor-grab grid-cols-2 gap-1 user-select-none"
                      tabIndex={0}
                      role="button"
                      aria-label="拖曳調整順序"
                    >
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <span key={i} className="h-1 w-1 rounded-full bg-muted-foreground" />
                      ))}
                    </div>
                  </IconTooltip>
                )}

                {/* Disclosure chevron (leading) */}
                {!isRemoved && (() => {
                  const CollapseIcon = collapsed ? ChevronRight : ChevronDown
                  return (
                    <IconTooltip label={collapsed ? '展開說明' : '摺疊說明'}>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={collapsed ? '展開說明' : '摺疊說明'}
                        onClick={() => toggleCollapse(idx)}
                      >
                        <CollapseIcon />
                      </Button>
                    </IconTooltip>
                  )
                })()}

                {/* Number badge — dynamic colours */}
                <div className={getServiceRowIndexBadgeClass({ isRemoved, isAdded: svc.is_added })}>
                  {isRemoved ? (
                    <X className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    idx + 1
                  )}
                </div>

                {diff && <DiffBadge type={diff} />}

                {/* Service name */}
                {readOnly || isRemoved ? (
                  <span className={`flex-grow-[2] font-semibold text-base min-w-0 ${isRemoved ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {svc.service_name}
                  </span>
                ) : (
                  <Input
                    className="min-w-0 flex-[2] font-semibold"
                    value={svc.service_name}
                    onChange={e => updateService(idx, 'service_name', e.target.value)}
                    placeholder="服務項目名稱"
                    aria-label="服務名稱"
                  />
                )}

                {/* Category */}
                {readOnly ? (
                  svc.category && (
                    <Badge variant="secondary" className="shrink-0 rounded-full whitespace-nowrap">{svc.category}</Badge>
                  )
                ) : (
                  <Input
                    className="w-28 min-w-0"
                    value={svc.category || ''}
                    onChange={e => updateService(idx, 'category', e.target.value)}
                    placeholder="類別"
                    aria-label="服務類別"
                  />
                )}

                {svc.is_added && !diff && (
                  <Badge className="shrink-0 rounded-full border-highlight-border bg-highlight font-bold text-highlight-text whitespace-nowrap">新增</Badge>
                )}

                {/* Right action cluster */}
                {!isRemoved && (
                  <div className="flex gap-1 ml-auto flex-shrink-0 items-center">

                    {/* Checklist indicator + one-click opener */}
                    {(!readOnly || checklistCount > 0) && (
                      <Button
                        type="button"
                        variant={checklistCount > 0 ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => openChecklist(idx)}
                        title={checklistCount > 0 ? `客戶準備清單（${checklistCount} 項）` : '新增客戶準備清單'}
                        aria-label={checklistCount > 0 ? `客戶準備清單，${checklistCount} 項` : '新增客戶準備清單'}
                        className={`h-7 gap-1 px-2 text-xs font-semibold ${checklistCount > 0
                          ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/15'
                          : 'text-muted-foreground'
                          }`}
                      >
                        <ListChecks className="size-4 shrink-0" aria-hidden="true" />
                        {checklistCount > 0 && <span>{checklistCount}</span>}
                      </Button>
                    )}

                    {/* Edit description */}
                    {!readOnly && !isEditing && (
                      <IconTooltip label={hasDesc ? '編輯說明' : '新增說明'}>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={hasDesc ? '編輯說明' : '新增說明'}
                          onClick={() => startEditFromMenu(idx)}
                        >
                          <Pencil />
                        </Button>
                      </IconTooltip>
                    )}

                    {/* Delete service */}
                    {!readOnly && (
                      <IconTooltip label="刪除服務項目">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="刪除服務項目"
                          onClick={() => setDeleteDialogIdx(idx)}
                          className="text-muted-foreground hover:bg-destructive-muted hover:text-destructive-muted-text"
                        >
                          <Trash2 />
                        </Button>
                      </IconTooltip>
                    )}
                  </div>
                )}
                {isRemoved && <div className="ml-auto" />}
              </ServiceRowSection>

              {/* ── Description section (expanded) ───────────────────────── */}
              {!isRemoved && !collapsed && (
                <ServiceRowSection className="border-t border-border py-3">
                  <div className={`
                    flex justify-between items-center
                    ${(isEditing || hasDesc) ? 'mb-2' : ''}
                  `}>
                    <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">說明</span>

                    {!readOnly && isEditing && (
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-semibold"
                          onClick={cancelEdit}
                        >
                          取消
                        </Button>
                        <Button
                          variant="accent"
                          size="sm"
                          className="font-semibold"
                          onClick={() => commitEdit(idx)}
                        >
                          完成
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isEditing && hasDesc && (
                    <div
                      className="prose prose-sm max-w-none break-words text-foreground [--tw-prose-body:var(--color-foreground)] [--tw-prose-headings:var(--color-foreground)] [--tw-prose-bold:var(--color-foreground)]"
                      dangerouslySetInnerHTML={{ __html: svc.description }}
                    />
                  )}

                  {!isEditing && !hasDesc && !readOnly && (
                    <div className="text-sm text-muted-foreground italic px-3 py-2 border border-dashed border-border rounded-sm text-center">
                      尚未填寫說明 — 點擊「新增說明」
                    </div>
                  )}

                  {isEditing && (
                    <RichEditor
                      value={draftDesc}
                      onChange={setDraftDesc}
                      minHeight={120}
                      maxHeight={360}
                      placeholder="輸入服務說明，可使用粗體、顏色等格式…"
                    />
                  )}
                </ServiceRowSection>
              )}

              {/* ── Description stub (collapsed, has content) ────────────── */}
              {!isRemoved && collapsed && hasDesc && (
                <ServiceRowSection
                  className="flex cursor-pointer items-center gap-2 border-t border-border bg-muted py-1.5 text-xs text-muted-foreground"
                  onClick={() => toggleCollapse(idx)}
                >
                  <span
                    className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis italic"
                    dangerouslySetInnerHTML={{
                      __html:
                        (svc.description || '').replace(/<[^>]*>/g, ' ').trim().slice(0, 80) + '…'
                    }}
                  />
                </ServiceRowSection>
              )}

            </ServiceRowShell>
          )
        })}
      </div>

      {!readOnly && (
        <Button
          variant="outline"
          size="md"
          className="mt-4 w-full font-semibold"
          onClick={addService}
        >
          <Plus data-icon="inline-start" />
          新增服務項目
        </Button>
      )}

      {/* ── Checklist dialog ────────────────────────────────────────────── */}
      <Dialog
        open={checklistIdx != null && !!services[checklistIdx]}
        onOpenChange={(open) => { if (!open) closeChecklist() }}
      >
        {checklistIdx != null && services[checklistIdx] && (
          <DialogContent
            className="flex max-h-[80vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
            showCloseButton={false}
          >
            <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0 space-y-1">
                <DialogTitle>客戶準備清單</DialogTitle>
                <DialogDescription className="truncate">
                  {services[checklistIdx].service_name || '未命名服務'}
                </DialogDescription>
              </div>
              <IconTooltip label="關閉">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="關閉"
                  onClick={closeChecklist}
                >
                  <X />
                </Button>
              </IconTooltip>
            </DialogHeader>

            <div className="flex-1 overflow-auto px-5 py-4">
              {(services[checklistIdx].checklist_items || []).length === 0 && (
                <AppEmptyState
                  compact
                  embedded
                  icon={ListChecks}
                  title="尚無清單項目"
                  description={readOnly ? undefined : '點選下方按鈕新增第一項'}
                  className="mb-3"
                />
              )}

              <div className="flex flex-col gap-2">
                {(services[checklistIdx].checklist_items || []).map((item, iIdx) => (
                  <div key={item.id || iIdx} className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm w-6 text-right flex-shrink-0">
                      {iIdx + 1}.
                    </span>
                    {readOnly ? (
                      <span className="flex-1 text-sm text-foreground">{item.item_text}</span>
                    ) : (
                      <Input
                        className="flex-1"
                        value={item.item_text}
                        onChange={e => updateChecklistItem(checklistIdx, iIdx, e.target.value)}
                        placeholder="準備項目說明"
                        aria-label={`清單項目 ${iIdx + 1}`}
                      />
                    )}
                    {!readOnly && (
                      <IconTooltip label="刪除此清單項目">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="刪除此清單項目"
                          onClick={() => removeChecklistItem(checklistIdx, iIdx)}
                          className="shrink-0 text-destructive-muted-text hover:bg-destructive-muted"
                        >
                          <X />
                        </Button>
                      </IconTooltip>
                    )}
                  </div>
                ))}
              </div>

              {!readOnly && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 font-semibold"
                  onClick={() => addChecklistItem(checklistIdx)}
                >
                  <Plus data-icon="inline-start" />
                  新增清單項目
                </Button>
              )}
            </div>

            <DialogFooter className="border-t border-border px-5 py-3">
              <Button variant="accent" size="sm" className="font-semibold" onClick={closeChecklist}>
                完成
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
