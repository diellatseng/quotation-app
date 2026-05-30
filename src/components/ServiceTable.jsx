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
    <div className="empty-state">
      <p className="empty-state__message">尚無服務項目。請從工程範本載入或手動新增。</p>
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
      <div className="toolbar">
        {!readOnly && (
          <span className="drag-hint">
            <span>⠿</span>拖曳左側可調整順序
          </span>
        )}
        {hasAnyDesc && allCollapsed && (
          <div className="toolbar__right">
            <button type="button" onClick={expandAll}
              className="btn-xxs"
              title="展開所有說明"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="keyboard_arrow_left" title="展開所有說明" /> 全部展開
            </button>

          </div>
        )}
        {hasAnyDesc && !allCollapsed && (
          <div className="toolbar__right">
            <button type="button" onClick={collapseAll}
              className="btn-xxs"
              title="折疊所有說明"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="keyboard_arrow_down" title="折疊所有說明" /> 全部折疊
            </button>
          </div>
        )}
      </div>

      {/* ── Cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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

          // Dynamic border/bg depend on runtime state — kept as inline (legitimate dynamic values)
          const cardBorder = isOver ? '2px dashed var(--color-accent)'
            : diff === 'added' ? '1.5px solid #86efac'
              : diff === 'modified' ? '1.5px solid #fde047'
                : diff === 'removed' ? '1.5px solid #fca5a5'
                  : svc.is_added ? '1.5px solid var(--color-accent)'
                    : '1px solid var(--color-border)'

          const cardBg = isDragging ? 'var(--color-bg-subtle)'
            : diff === 'added' ? '#f0fdf4'
              : diff === 'modified' ? '#fefce8'
                : diff === 'removed' ? '#fef2f2'
                  : svc.is_added ? 'var(--color-accent-subtle)'
                    : 'var(--color-bg-surface)'

          return (
            <div
              key={svc.service_id || idx}
              draggable={!readOnly && !isRemoved && !isEditing}
              onDragStart={() => !isRemoved && handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragOver={e => e.preventDefault()}
              onDragEnd={handleDragEnd}
              style={{
                border: cardBorder,
                borderRadius: 'var(--radius-md)',
                background: cardBg,
                overflow: actionMenuId === svc.service_id ? 'visible' : 'hidden',
                opacity: isDragging ? 0.4 : isRemoved ? 0.7 : 1,
                transition: 'opacity 0.15s, border-color 0.15s',
                cursor: isDragging ? 'grabbing' : 'default',
              }}
            >
              {/* ── Header row ─────────────────────────────────────────── */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
                minHeight: 52,
              }}>

                {/* Drag handle */}
                {!readOnly && (
                  <div title="拖曳調整順序" style={{
                    cursor: 'grab', flexShrink: 0, userSelect: 'none',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, padding: '4px 3px',
                  }}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <span key={i} style={{ display: 'block', width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-muted)' }} />
                    ))}
                  </div>
                )}

                {/* Number badge — dynamic colours are legitimate inline */}
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-full)',
                  background: isRemoved ? '#fca5a5' : svc.is_added ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: isRemoved ? '#991b1b' : svc.is_added ? '#fff' : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0,
                }}>
                  {isRemoved ? '✕' : idx + 1}
                </div>

                {diff && <DiffBadge type={diff} />}

                {/* Service name */}
                {readOnly || isRemoved ? (
                  <span style={{
                    flex: 2, fontWeight: 600, fontSize: 'var(--text-base)',
                    textDecoration: isRemoved ? 'line-through' : 'none',
                    color: isRemoved ? 'var(--color-text-muted)' : 'var(--color-text)',
                  }}>
                    {svc.service_name}
                  </span>
                ) : (
                  <input
                    className="field-input field-input--sm"
                    style={{ flex: 2, minWidth: 0, fontWeight: 600 }}
                    value={svc.service_name}
                    onChange={e => updateService(idx, 'service_name', e.target.value)}
                    placeholder="服務項目名稱"
                    aria-label="服務名稱"
                  />
                )}

                {/* Category */}
                {readOnly ? (
                  svc.category && (
                    <span className="category-pill">{svc.category}</span>
                  )
                ) : (
                  <input
                    className="field-input field-input--sm"
                    style={{ width: 110, minWidth: 0 }}
                    value={svc.category || ''}
                    onChange={e => updateService(idx, 'category', e.target.value)}
                    placeholder="類別"
                    aria-label="服務類別"
                  />
                )}

                {svc.is_added && !diff && (
                  <span className="new-badge">新增</span>
                )}

                {/* Right action cluster */}
                {!isRemoved && (
                  <div style={{ display: 'flex', gap: 5, marginLeft: 'auto', flexShrink: 0, alignItems: 'center' }}>

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
                {isRemoved && <div style={{ marginLeft: 'auto' }} />}
              </div>

              {/* ── Description section (expanded) ───────────────────────── */}
              {!isRemoved && !collapsed && (
                <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-3)' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: (isEditing || hasDesc) ? 'var(--space-2)' : 0,
                  }}>
                    <span className="subsection-label">說明</span>

                    {!readOnly && isEditing && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button
                          size="sm"
                          style={{ display: 'flex', gap: 6 }}
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
                      className="desc-block"
                      dangerouslySetInnerHTML={{ __html: svc.description }}
                    />
                  )}

                  {!isEditing && !hasDesc && !readOnly && (
                    <div className="desc-empty">
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
                <div className="desc-stub" onClick={() => toggleCollapse(idx)}>
                  <span
                    className="desc-stub__text"
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
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    padding: 'var(--space-4)', background: 'var(--color-bg-subtle)',
                    scrollMarginTop: 'var(--space-6)',
                    outline: 'none',
                  }}
                >
                  <p className="subsection-label" style={{ marginBottom: 'var(--space-3)' }}>
                    客戶準備清單
                  </p>

                  {(svc.checklist_items || []).length === 0 && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                      尚無清單項目
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {(svc.checklist_items || []).map((item, iIdx) => (
                      <div key={item.id || iIdx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', width: 24, textAlign: 'right', flexShrink: 0 }}>
                          {iIdx + 1}.
                        </span>
                        {readOnly ? (
                          <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{item.item_text}</span>
                        ) : (
                          <input
                            className="field-input field-input--sm"
                            style={{ flex: 1 }}
                            value={item.item_text}
                            onChange={e => updateChecklistItem(idx, iIdx, e.target.value)}
                            placeholder="準備項目說明"
                            aria-label={`清單項目 ${iIdx + 1}`}
                          />
                        )}
                        {!readOnly && (
                          <button type="button" onClick={() => removeChecklistItem(idx, iIdx)}
                            aria-label="刪除此清單項目"
                            className="btn-xxs btn-xxs--danger"
                            style={{ padding: '0 var(--space-2)', flexShrink: 0 }}>
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
                      style={{ marginTop: 'var(--space-3)' }}
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
          style={{ marginTop: 'var(--space-4)', width: '100%' }}
          onClick={addService}
        >
          + 新增服務項目
        </Button>
      )}
    </div>
  )
}

// ── DiffBadge — pill shape (唯讀標籤) ─────────────────────────────────────────
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

function DepActionMenuButton({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        width: '100%',
        padding: 'var(--space-2) var(--space-3)',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        color: danger ? 'var(--color-danger)' : 'var(--color-text)',
        cursor: 'pointer',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        textAlign: 'left',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon name={icon} title={label} />
      {label}
    </button>
  )
}
