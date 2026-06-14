// src/components/ServiceTable.jsx
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import RichEditor from './RichEditor'
import Icon from './Icon'
import IconButton from './IconButton'
import Button from '../components/Button'

export default function ServiceTable({ services, onChange, readOnly = false }) {
  const [checklistIdx, setChecklistIdx] = useState(null)
  const [editingDesc, setEditingDesc] = useState(null)
  const [draftDesc, setDraftDesc] = useState('')
  const [collapsedDescs, setCollapsedDescs] = useState({})
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(null)
  const confirmTimer = useRef(null)

  // ── Drag state ────────────────────────────────────────────────────────────
  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [dragOverIdxState, setDragOverIdxState] = useState(null)

  const handleDragStart = (idx) => { dragIdx.current = idx; setDraggingIdx(idx); setConfirmDeleteIdx(null) }
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
  // Two-step delete: first click arms confirmation (auto-resets after 3s), second confirms.
  const requestDelete = (idx) => {
    clearTimeout(confirmTimer.current)
    if (confirmDeleteIdx === idx) {
      setConfirmDeleteIdx(null)
      removeService(idx)
      return
    }
    setConfirmDeleteIdx(idx)
    confirmTimer.current = setTimeout(() => setConfirmDeleteIdx(null), 3000)
  }
  useEffect(() => () => clearTimeout(confirmTimer.current), [])
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

  // Close the checklist modal with Escape
  useEffect(() => {
    if (checklistIdx == null) return
    const onKey = (e) => { if (e.key === 'Escape') closeChecklist() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [checklistIdx])

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
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap min-h-[28px]">
        {!readOnly && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>⠿</span>拖曳左側可調整順序
          </span>
        )}
        {hasAnyDesc && (
          <button
            type="button"
            onClick={allCollapsed ? expandAll : collapseAll}
            title={allCollapsed ? '展開所有說明' : '折疊所有說明'}
            aria-label={allCollapsed ? '展開所有說明' : '折疊所有說明'}
            className="ml-auto inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors whitespace-nowrap"
          >
            <Icon name={allCollapsed ? 'unfold_more' : 'unfold_less'} title="" />
            {allCollapsed ? '全部展開' : '全部折疊'}
          </button>
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

                {/* Disclosure chevron (leading) */}
                {!isRemoved && (
                  <IconButton
                    icon={collapsed ? 'keyboard_arrow_right' : 'keyboard_arrow_down'}
                    tooltip={collapsed ? '展開說明' : '摺疊說明'}
                    onClick={() => toggleCollapse(idx)}
                    variant="ghost"
                    size="sm"
                  />
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

                    {/* Checklist indicator + one-click opener */}
                    {(!readOnly || checklistCount > 0) && (
                      <button
                        type="button"
                        onClick={() => openChecklist(idx)}
                        title={checklistCount > 0 ? `客戶準備清單（${checklistCount} 項）` : '新增客戶準備清單'}
                        aria-label={checklistCount > 0 ? `客戶準備清單，${checklistCount} 項` : '新增客戶準備清單'}
                        className={`inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-semibold border cursor-pointer transition-colors ${checklistCount > 0
                          ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
                          : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                          }`}
                      >
                        <Icon name="checklist" title="" />
                        {checklistCount > 0 && <span>{checklistCount}</span>}
                      </button>
                    )}

                    {/* Edit description */}
                    {!readOnly && !isEditing && (
                      <IconButton
                        icon="edit"
                        tooltip={hasDesc ? '編輯說明' : '新增說明'}
                        onClick={() => startEditFromMenu(idx)}
                        variant="ghost"
                        size="sm"
                      />
                    )}

                    {/* Delete service — two-step inline confirm */}
                    {!readOnly && (
                      confirmDeleteIdx === idx ? (
                        <button
                          type="button"
                          onClick={() => requestDelete(idx)}
                          title="再次點擊以確認刪除"
                          aria-label="確認刪除服務項目"
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-semibold border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-colors whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
                        >
                          <Icon name="delete" title="" />
                          確定刪除？
                        </button>
                      ) : (
                        <IconButton
                          icon="delete"
                          tooltip="刪除服務項目"
                          onClick={() => requestDelete(idx)}
                          variant="ghost"
                          size="sm"
                          className="!text-muted-foreground hover:!bg-red-50 hover:!text-red-600"
                        />
                      )
                    )}
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

      {/* ── Checklist modal ─────────────────────────────────────────────── */}
      {checklistIdx != null && services[checklistIdx] && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-150"
          onClick={closeChecklist}
          role="dialog"
          aria-modal="true"
          aria-label="客戶準備清單"
        >
          <div
            className="w-full max-w-lg max-h-[80vh] flex flex-col bg-card text-card-foreground rounded-xl border border-border shadow-xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">客戶準備清單</h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {services[checklistIdx].service_name || '未命名服務'}
                </p>
              </div>
              <IconButton icon="close" tooltip="關閉" variant="ghost" size="sm" onClick={closeChecklist} />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-5 py-4">
              {(services[checklistIdx].checklist_items || []).length === 0 && (
                <p className="text-sm text-muted-foreground mb-3">尚無清單項目</p>
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
                      <input
                        className="flex-1 px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:border-primary"
                        value={item.item_text}
                        onChange={e => updateChecklistItem(checklistIdx, iIdx, e.target.value)}
                        placeholder="準備項目說明"
                        aria-label={`清單項目 ${iIdx + 1}`}
                      />
                    )}
                    {!readOnly && (
                      <button type="button" onClick={() => removeChecklistItem(checklistIdx, iIdx)}
                        aria-label="刪除此清單項目"
                        className="inline-flex items-center justify-center h-7 w-7 text-xs font-medium rounded-sm border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 cursor-pointer transition-all flex-shrink-0">
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
                  onClick={() => addChecklistItem(checklistIdx)}
                >
                  + 新增清單項目
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <Button variant="accent" size="sm" onClick={closeChecklist}>
                完成
              </Button>
            </div>
          </div>
        </div>,
        document.body
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
