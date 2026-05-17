// src/components/ServiceTable.jsx
import { useState, useRef } from 'react'
import RichEditor from './RichEditor'

export default function ServiceTable({ services, onChange, readOnly = false }) {
  const [expandedChecklist, setExpandedChecklist] = useState(null)
  const [editingDesc,       setEditingDesc]       = useState(null)
  const [draftDesc,         setDraftDesc]         = useState('')
  const [collapsedDescs, setCollapsedDescs] = useState({}) // idx -> bool (true = collapsed)

  // ── Drag state ────────────────────────────────────────────────────────────
  const dragIdx     = useRef(null)
  const dragOverIdx = useRef(null)
  const [draggingIdx,     setDraggingIdx]     = useState(null)
  const [dragOverIdxState,setDragOverIdxState]= useState(null)

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
    id: crypto.randomUUID(), service_name: '', category: '', description: '', checklist_items: [], is_added: true,
  }])

  // ── Description edit/save ─────────────────────────────────────────────────
  const startEdit = (idx) => { setEditingDesc(idx); setDraftDesc(services[idx].description || '') }
  const cancelEdit = () => { setEditingDesc(null); setDraftDesc('') }
  const commitEdit = (idx) => { updateService(idx, 'description', draftDesc); setEditingDesc(null); setDraftDesc('') }

  // ── Description collapse ──────────────────────────────────────────────────
  const isDescCollapsed = (idx) => collapsedDescs[idx] ?? false
  const toggleDesc = (idx) => setCollapsedDescs(p => ({ ...p, [idx]: !p[idx] }))

  const descServiceIndices = services.reduce((acc, s, i) => {
    if (!s._removed && (s.description || '').trim()) acc.push(i)
    return acc
  }, [])
  const hasDescServices = descServiceIndices.length > 0
  const allCollapsed = hasDescServices && descServiceIndices.every(i => collapsedDescs[i])
  const collapseAll = () => {
    const next = {}
    descServiceIndices.forEach(i => { next[i] = true })
    setCollapsedDescs(next)
  }
  const expandAll = () => setCollapsedDescs({})

  // ── Checklist CRUD ────────────────────────────────────────────────────────
  const addChecklistItem = (idx) => {
    const items = [...(services[idx].checklist_items || []), { id: crypto.randomUUID(), item_text: '' }]
    updateService(idx, 'checklist_items', items)
  }
  const updateChecklistItem = (svcIdx, itemIdx, val) => {
    const items = [...(services[svcIdx].checklist_items || [])]
    items[itemIdx] = { ...items[itemIdx], item_text: val }
    updateService(svcIdx, 'checklist_items', items)
  }
  const removeChecklistItem = (svcIdx, itemIdx) => {
    updateService(svcIdx, 'checklist_items',
      (services[svcIdx].checklist_items || []).filter((_, i) => i !== itemIdx))
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!services.length) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
      尚無服務項目。請從工程範本載入或手動新增。
      {!readOnly && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <button type="button" className="btn btn-secondary" onClick={addService}>+ 新增服務項目</button>
        </div>
      )}
    </div>
  )

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)',
      }}>
        {/* Drag hint */}
        {!readOnly && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14 }}>⠿</span>拖曳左側可調整順序
          </span>
        )}

        {/* Collapse / Expand all — only show when any card has description */}
        {hasDescServices && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'auto' }}>
            <button type="button" onClick={expandAll}
              style={{ ...tinyBtn, opacity: allCollapsed ? 1 : 0.45 }}
              title="展開所有說明">
              ▾ 全部展開
            </button>
            <button type="button" onClick={collapseAll}
              style={{ ...tinyBtn, opacity: !allCollapsed ? 1 : 0.45 }}
              title="折疊所有說明">
              ▸ 全部折疊
            </button>
          </div>
        )}
      </div>

      {/* ── Cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {services.map((svc, idx) => {
          const isDragging = draggingIdx === idx
          const isOver     = dragOverIdxState === idx && draggingIdx !== idx
          const isEditing  = editingDesc === idx
          const hasDesc    = (svc.description || '').trim().length > 0
          const collapsed  = isDescCollapsed(idx)
          const diff       = svc.diff_status
          const isRemoved  = diff === 'removed'

          const cardBorder = isOver
            ? '2px dashed var(--color-accent)'
            : diff === 'added'    ? '1.5px solid #86efac'
            : diff === 'modified' ? '1.5px solid #fde047'
            : diff === 'removed'  ? '1.5px solid #fca5a5'
            : svc.is_added        ? '1.5px solid var(--color-accent)'
            : '1px solid var(--color-border)'

          const cardBg = isDragging
            ? 'var(--color-bg-subtle)'
            : diff === 'added'    ? '#f0fdf4'
            : diff === 'modified' ? '#fefce8'
            : diff === 'removed'  ? '#fef2f2'
            : svc.is_added        ? 'var(--color-accent-subtle)'
            : 'var(--color-bg-surface)'

          return (
            <div
              key={svc.id || idx}
              draggable={!readOnly && !isRemoved}
              onDragStart={() => !isRemoved && handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragOver={e => e.preventDefault()}
              onDragEnd={handleDragEnd}
              style={{
                border: cardBorder, borderRadius: 'var(--radius-md)',
                background: cardBg, overflow: 'hidden',
                opacity: isDragging ? 0.4 : isRemoved ? 0.7 : 1,
                transition: 'opacity 0.15s, border-color 0.15s',
                cursor: isDragging ? 'grabbing' : 'default',
              }}
            >
              {/* ── Header row ─────────────────────────────────────────── */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                minHeight: 52,
              }}>
                {/* Drag handle */}
                {!readOnly && (
                  <div title="拖曳調整順序" style={{
                    cursor: 'grab', flexShrink: 0, userSelect: 'none',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, padding: '4px 3px',
                  }}>
                    {[0,1,2,3,4,5].map(i => (
                      <span key={i} style={{ display: 'block', width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-muted)' }} />
                    ))}
                  </div>
                )}

                {/* Number badge */}
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-full)',
                  background: isRemoved ? '#fca5a5' : svc.is_added ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                  color: isRemoved ? '#991b1b' : svc.is_added ? '#fff' : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {isRemoved ? '✕' : idx + 1}
                </div>

                {/* Diff badge */}
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
                    className="field-input"
                    style={{ flex: 2, minWidth: 0, fontSize: 'var(--text-base)', fontWeight: 600, height: 36 }}
                    value={svc.service_name}
                    onChange={e => updateService(idx, 'service_name', e.target.value)}
                    placeholder="服務項目名稱"
                    aria-label="服務名稱"
                  />
                )}

                {/* Category */}
                {readOnly ? (
                  svc.category && (
                    <span style={{
                      fontSize: 'var(--text-xs)', padding: '3px 10px',
                      background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-full)',
                      color: 'var(--color-text-muted)', flexShrink: 0,
                    }}>{svc.category}</span>
                  )
                ) : (
                  <input
                    className="field-input"
                    style={{ width: 110, minWidth: 0, fontSize: 'var(--text-sm)', height: 36 }}
                    value={svc.category || ''}
                    onChange={e => updateService(idx, 'category', e.target.value)}
                    placeholder="類別"
                    aria-label="服務類別"
                  />
                )}

                {/* 新增 badge */}
                {svc.is_added && (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--color-accent)', flexShrink: 0,
                    background: 'var(--color-accent-subtle)',
                    border: '1px solid var(--color-accent)',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px 8px',
                  }}>新增</span>
                )}

                {/* Right-side action cluster */}
                {!isRemoved && (
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexShrink: 0, alignItems: 'center' }}>

                    {/* Description collapse toggle — only show if has description */}
                    {hasDesc && (
                      <button
                        type="button"
                        onClick={() => toggleDesc(idx)}
                        title={collapsed ? '展開說明' : '折疊說明'}
                        aria-label={collapsed ? '展開說明' : '折疊說明'}
                        style={{
                          ...iconBtn,
                          fontSize: 11,
                          padding: '4px 10px',
                          color: 'var(--color-text-muted)',
                          minHeight: 30,
                          gap: 4,
                        }}
                      >
                        {collapsed ? '▸' : '▾'} 說明
                      </button>
                    )}

                    {/* Checklist button */}
                    <button
                      type="button"
                      onClick={() => setExpandedChecklist(expandedChecklist === idx ? null : idx)}
                      aria-expanded={expandedChecklist === idx}
                      title="客戶準備清單"
                      style={{
                        ...iconBtn,
                        padding: '4px 10px',
                        fontSize: 11,
                        minHeight: 30,
                        background: expandedChecklist === idx ? 'var(--color-accent-subtle)' : undefined,
                        color: expandedChecklist === idx ? 'var(--color-accent)' : undefined,
                        borderColor: expandedChecklist === idx ? 'var(--color-accent)' : undefined,
                      }}
                    >
                      ☑ {(svc.checklist_items || []).filter(i => i.item_text?.trim()).length || ''}
                    </button>

                    {/* Delete */}
                    {!readOnly && (
                      <button type="button" onClick={() => removeService(idx)}
                        aria-label="刪除此服務項目"
                        title="刪除"
                        style={{ ...iconBtn, padding: '4px 8px', color: 'var(--color-danger)', minHeight: 30 }}>
                        ✕
                      </button>
                    )}
                  </div>
                )}
                {isRemoved && <div style={{ marginLeft: 'auto' }} />}
              </div>

              {/* ── Description section ─────────────────────────────────── */}
              {!isRemoved && !collapsed && (
                <div style={{
                  borderTop: '1px solid var(--color-border)',
                  padding: 'var(--space-3) var(--space-3)',
                }}>
                  {/* Label + edit buttons row */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: (isEditing || hasDesc) ? 'var(--space-2)' : 0,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                      textTransform: 'uppercase', color: 'var(--color-text-muted)',
                    }}>說明</span>

                    {!readOnly && !isEditing && (
                      <button type="button" onClick={() => startEdit(idx)}
                        style={{ ...iconBtn, fontSize: 11, padding: '3px 10px', minHeight: 28 }}>
                        ✎ {hasDesc ? '編輯' : '新增說明'}
                      </button>
                    )}

                    {!readOnly && isEditing && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={cancelEdit}
                          style={{ ...iconBtn, fontSize: 11, padding: '3px 10px', minHeight: 28 }}>
                          取消
                        </button>
                        <button type="button" onClick={() => commitEdit(idx)}
                          style={{
                            ...iconBtn, fontSize: 11, padding: '3px 14px', minHeight: 28,
                            background: 'var(--color-accent)', color: '#fff',
                            border: '1px solid var(--color-accent)', fontWeight: 700,
                          }}>
                          ✓ 完成
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Display */}
                  {!isEditing && hasDesc && (
                    <div
                      style={{
                        fontSize: 'var(--text-sm)', lineHeight: 1.8,
                        color: 'var(--color-text-secondary)',
                        padding: '10px 14px',
                        background: 'var(--color-bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid var(--color-accent)',
                        wordBreak: 'break-word',
                      }}
                      dangerouslySetInnerHTML={{ __html: svc.description.replace(/\n/g, '<br>') }}
                    />
                  )}

                  {/* Empty hint */}
                  {!isEditing && !hasDesc && !readOnly && (
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      尚未填寫說明
                    </div>
                  )}

                  {/* RichEditor */}
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

              {/* Collapsed description stub */}
              {!isRemoved && collapsed && hasDesc && (
                <div
                  onClick={() => toggleDesc(idx)}
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    padding: '6px var(--space-3)',
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    background: 'var(--color-bg-subtle)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span>▸</span>
                  <span style={{ fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}
                    dangerouslySetInnerHTML={{ __html: (svc.description || '').replace(/<[^>]*>/g, ' ').trim().slice(0, 80) + '…' }}
                  />
                </div>
              )}

              {/* ── Checklist panel ──────────────────────────────────────── */}
              {!isRemoved && expandedChecklist === idx && (
                <div style={{
                  borderTop: '1px solid var(--color-border)',
                  padding: 'var(--space-4)',
                  background: 'var(--color-bg-subtle)',
                }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                    textTransform: 'uppercase', color: 'var(--color-text-muted)',
                    marginBottom: 'var(--space-3)',
                  }}>客戶準備清單</p>

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
                            className="field-input"
                            style={{ flex: 1, fontSize: 'var(--text-sm)' }}
                            value={item.item_text}
                            onChange={e => updateChecklistItem(idx, iIdx, e.target.value)}
                            placeholder="準備項目說明"
                            aria-label={`清單項目 ${iIdx + 1}`}
                          />
                        )}
                        {!readOnly && (
                          <button type="button" onClick={() => removeChecklistItem(idx, iIdx)}
                            aria-label="刪除此清單項目"
                            style={{ ...iconBtn, color: 'var(--color-danger)', flexShrink: 0, minHeight: 28, padding: '4px 8px' }}>
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {!readOnly && (
                    <button type="button" className="btn btn-ghost btn-sm"
                      style={{ marginTop: 'var(--space-3)' }}
                      onClick={() => addChecklistItem(idx)}>
                      + 新增清單項目
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <button type="button" className="btn btn-secondary"
          style={{ marginTop: 'var(--space-4)', width: '100%' }}
          onClick={addService}>
          + 新增服務項目
        </button>
      )}
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const iconBtn = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--text-sm)',
  padding: '4px 8px',
  color: 'var(--color-text-secondary)',
  minHeight: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const tinyBtn = {
  ...iconBtn,
  fontSize: 11,
  padding: '3px 10px',
  minHeight: 28,
}

// ── DiffBadge ──────────────────────────────────────────────────────────────────
function DiffBadge({ type }) {
  const cfg = {
    added:    { label: '▲ 新增', bg: '#dcfce7', color: '#166534', border: '#86efac' },
    modified: { label: '✎ 更改', bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
    removed:  { label: '✕ 刪除', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  }[type]
  if (!cfg) return null
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-full)',
      padding: '2px 8px', flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  )
}
