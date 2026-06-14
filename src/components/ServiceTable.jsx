// src/components/ServiceTable.jsx
import { useState, useRef } from 'react'
import RichEditor from './RichEditor'
import Icon from './Icon'
import IconButton from './IconButton'
import Button from '../components/Button'
import ActionMenu, { ActionMenuItem, useActionMenuClose } from '../components/ActionMenu'

export default function ServiceTable({ services, onChange, readOnly = false }) {
  const [expandedChecklist, setExpandedChecklist] = useState(null)
  const [editingDesc, setEditingDesc] = useState(null)
  const [draftDesc, setDraftDesc] = useState('')
  const [collapsedDescs, setCollapsedDescs] = useState({})
  const [actionMenuId, setActionMenuId] = useState(null)
  useActionMenuClose(actionMenuId, () => setActionMenuId(null))

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
      if (expandedChecklist === from) setExpandedChecklist(to)
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
    if (expandedChecklist === idx) setExpandedChecklist(null)
    const next = { ...collapsedDescs }; delete next[idx]; setCollapsedDescs(next)
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
  const toggleChecklist = (idx) => {
    const shouldOpen = expandedChecklist !== idx
    setExpandedChecklist(shouldOpen ? idx : null)
    if (!shouldOpen) return

    window.history.replaceState(null, '', '#ExpandedChecklist')
    setTimeout(() => {
      const panel = document.getElementById('ExpandedChecklist')
      panel?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      panel?.focus({ preventScroll: true })
    }, 0)
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!services.length) return (
    <div className="text-center py-12 px-6 text-muted-foreground">
      <p className="text-base mb-4">尚無服務項目。請從工程範本載入或手動新增。</p>
      {!readOnly && (
        <Button
          variant="accent"
          size="normal"
          onClick={addService}
        >
          + 新增服務項目
        </Button>
      )}
    </div>
  )

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        {!readOnly && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>⠿</span>拖曳左側可調整順序
          </span>
        )}
        {hasAnyDesc && allCollapsed && (
          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={expandAll}
              className="inline-flex items-center gap-1 h-7 px-3 text-xs font-medium rounded-sm border border-border bg-muted text-muted-foreground hover:bg-border hover:text-foreground cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              title="展開所有說明">
              <Icon name="keyboard_arrow_left" title="展開所有說明" /> 全部展開
            </button>

          </div>
        )}
        {hasAnyDesc && !allCollapsed && (
          <div className="flex items-center gap-2 ml-auto">
            <button type="button" onClick={collapseAll}
              className="inline-flex items-center gap-1 h-7 px-3 text-xs font-medium rounded-sm border border-border bg-muted text-muted-foreground hover:bg-border hover:text-foreground cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              title="折疊所有說明">
              <Icon name="keyboard_arrow_down" title="折疊所有說明" /> 全部折疊
            </button>
          </div>
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
          const diff = svc.diff_status
          const isRemoved = diff === 'removed'
          const checklistCount = (svc.checklist_items || []).filter(i => i.item_text?.trim()).length
          const checklistOpen = expandedChecklist === idx

          // Dynamic border/bg depend on runtime state
          const cardClasses = `
            ${isOver ? 'border-2 border-dashed border-accent' : ''}
            ${diff === 'added' ? 'border-2 border-green-500' : ''}
            ${diff === 'modified' ? 'border-2 border-yellow-400' : ''}
            ${diff === 'removed' ? 'border-2 border-red-400' : ''}
            ${!isOver && !diff && svc.is_added ? 'border-2 border-accent' : ''}
            ${!isOver && !diff && !svc.is_added ? 'border border-border' : ''}
            rounded-md
            overflow-hidden
            ${isDragging ? 'opacity-40' : isRemoved ? 'opacity-70' : 'opacity-100'}
            transition-opacity
            ${isDragging ? 'cursor-grabbing' : 'cursor-default'}
          `

          const cardBgClasses = `
            ${isDragging ? 'bg-muted' : ''}
            ${diff === 'added' ? 'bg-green-50' : ''}
            ${diff === 'modified' ? 'bg-yellow-50' : ''}
            ${diff === 'removed' ? 'bg-red-50' : ''}
            ${svc.is_added && !diff ? 'bg-accent-subtle' : ''}
            ${!isDragging && !diff && !svc.is_added ? 'bg-card' : ''}
          `

          return (
            <div
              key={svc.service_id || idx}
              draggable={!readOnly && !isRemoved && !isEditing}
              onDragStart={() => !isRemoved && handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragOver={e => e.preventDefault()}
              onDragEnd={handleDragEnd}
              className={cardClasses + ' ' + cardBgClasses}
            >
              {/* ── Header row ─────────────────────────────────────────── */}
              <div className="flex items-center gap-2 px-3 py-2 min-h-[52px]">

                {/* Drag handle */}
                {!readOnly && (
                  <div title="拖曳調整順序" className="cursor-grab flex-shrink-0 user-select-none grid grid-cols-2 gap-1">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <span key={i} className="w-1 h-1 rounded-full bg-muted-foreground" />
                    ))}
                  </div>
                )}

                {/* Number badge — dynamic colours */}
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${isRemoved ? 'bg-red-400 text-red-900' : svc.is_added ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'}
                `}>
                  {isRemoved ? '✕' : idx + 1}
                </div>

                {diff && <DiffBadge type={diff} />}

                {/* Service name */}
                {readOnly || isRemoved ? (
                  <span className={`flex-grow-[2] font-semibold text-base min-w-0 ${isRemoved ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {svc.service_name}
                  </span>
                ) : (
                  <input
                    className="flex-grow-[2] min-w-0 px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm font-semibold focus:outline-none focus:border-primary"
                    value={svc.service_name}
                    onChange={e => updateService(idx, 'service_name', e.target.value)}
                    placeholder="服務項目名稱"
                    aria-label="服務名稱"
                  />
                )}

                {/* Category */}
                {readOnly ? (
                  svc.category && (
                    <span className="inline-flex items-center flex-shrink-0 px-3 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border border-border whitespace-nowrap">{svc.category}</span>
                  )
                ) : (
                  <input
                    className="w-28 px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary min-w-0"
                    value={svc.category || ''}
                    onChange={e => updateService(idx, 'category', e.target.value)}
                    placeholder="類別"
                    aria-label="服務類別"
                  />
                )}

                {svc.is_added && !diff && (
                  <span className="inline-flex items-center flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-accent-subtle text-accent border border-accent whitespace-nowrap">新增</span>
                )}

                {/* Right action cluster */}
                {!isRemoved && (
                  <div className="flex gap-1 ml-auto flex-shrink-0 items-center">

                    {/* Collapse/expand chevron */}
                    <IconButton
                      icon={collapsed ? 'keyboard_arrow_left' : 'keyboard_arrow_down'}
                      tooltip={collapsed ? '展開說明' : '摺疊說明'}
                      onClick={() => {
                        setActionMenuId(null)
                        toggleCollapse(idx)
                      }}
                      variant="ghost"
                      size="sm"
                    />

                    {/* More actions */}
                    <ActionMenu
                      id={svc.service_id}
                      openId={actionMenuId}
                      onOpen={setActionMenuId}
                      onClose={() => setActionMenuId(null)}
                    >
                      {!readOnly && !isEditing && (
                        <ActionMenuItem
                          icon="edit"
                          label={hasDesc ? '編輯說明' : '新增說明'}
                          onClick={() => { setActionMenuId(null); startEditFromMenu(idx) }}
                        />
                      )}
                      {!readOnly && (
                        <ActionMenuItem
                          icon="delete"
                          label="刪除"
                          danger
                          onClick={() => { setActionMenuId(null); removeService(idx) }}
                        />
                      )}
                    </ActionMenu>
                  </div>
                )}
                {isRemoved && <div className="ml-auto" />}
              </div>

              {/* ── Description section (expanded) ───────────────────────── */}
              {!isRemoved && !collapsed && (
                <div className="border-t border-border px-3 py-3">
                  <div className={`
                    flex justify-between items-center
                    ${(isEditing || hasDesc) ? 'mb-2' : ''}
                  `}>
                    <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">說明</span>

                    {!readOnly && isEditing && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          onClick={cancelEdit}
                        >
                          取消
                        </Button>
                        <Button
                          variant="accent"
                          size="sm"
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
                </div>
              )}

              {/* ── Description stub (collapsed, has content) ────────────── */}
              {!isRemoved && collapsed && hasDesc && (
                <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground cursor-pointer bg-muted flex items-center gap-2" onClick={() => toggleCollapse(idx)}>
                  <span
                    className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis italic"
                    dangerouslySetInnerHTML={{
                      __html:
                        (svc.description || '').replace(/<[^>]*>/g, ' ').trim().slice(0, 80) + '…'
                    }}
                  />
                </div>
              )}

              {/* ── Checklist panel ──────────────────────────────────────── */}
              {!isRemoved && checklistOpen && (
                <div
                  id="ExpandedChecklist"
                  tabIndex={-1}
                  className="border-t border-border px-4 py-4 bg-muted focus:outline-none scroll-mt-6"
                >
                  <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">
                    客戶準備清單
                  </p>

                  {(svc.checklist_items || []).length === 0 && (
                    <p className="text-sm text-muted-foreground mb-3">
                      尚無清單項目
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    {(svc.checklist_items || []).map((item, iIdx) => (
                      <div key={item.id || iIdx} className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm w-6 text-right flex-shrink-0">
                          {iIdx + 1}.
                        </span>
                        {readOnly ? (
                          <span className="flex-1 text-sm">{item.item_text}</span>
                        ) : (
                          <input
                            className="flex-1 px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                            value={item.item_text}
                            onChange={e => updateChecklistItem(idx, iIdx, e.target.value)}
                            placeholder="準備項目說明"
                            aria-label={`清單項目 ${iIdx + 1}`}
                          />
                        )}
                        {!readOnly && (
                          <button type="button" onClick={() => removeChecklistItem(idx, iIdx)}
                            aria-label="刪除此清單項目"
                            className="inline-flex items-center gap-1 h-7 px-2 text-xs font-medium rounded-sm border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed transition-all flex-shrink-0 whitespace-nowrap">
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() => addChecklistItem(idx)}
                    >
                      + 新增清單項目
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <Button
          variant="normal"
          className="mt-4 w-full"
          onClick={addService}
        >
          + 新增服務項目
        </Button>
      )}
    </div>
  )
}

function DiffBadge({ type }) {
  const classMap = {
    added: 'diff-badge diff-badge--added',
    modified: 'diff-badge diff-badge--modified',
    removed: 'diff-badge diff-badge--removed',
  }
  const labelMap = {
    added: '▲ 新增', modified: '✎ 更改', removed: '✕ 刪除',
  }
  const cls = classMap[type]
  if (!cls) return null
  return <span className={cls}>{labelMap[type]}</span>
}
