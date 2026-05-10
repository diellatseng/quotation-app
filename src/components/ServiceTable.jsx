// src/components/ServiceTable.jsx
import { useState } from 'react'

export default function ServiceTable({ services, onChange, readOnly = false }) {
  const [expandedChecklist, setExpandedChecklist] = useState(null)

  const updateService = (idx, field, val) => {
    const next = [...services]
    next[idx] = { ...next[idx], [field]: val }
    onChange(next)
  }

  const removeService = (idx) => onChange(services.filter((_, i) => i !== idx))

  const addService = () => onChange([...services, {
    id: crypto.randomUUID(),
    service_name: '',
    category: '',
    description: '',
    checklist_items: [],
    is_added: true,
  }])

  const moveUp   = (idx) => { if (idx === 0) return; const n = [...services]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; onChange(n) }
  const moveDown = (idx) => { if (idx === services.length-1) return; const n = [...services]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; onChange(n) }

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
    const items = (services[svcIdx].checklist_items || []).filter((_, i) => i !== itemIdx)
    updateService(svcIdx, 'checklist_items', items)
  }

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {services.map((svc, idx) => (
          <div
            key={svc.id || idx}
            style={{
              border: svc.is_added
                ? '1.5px solid var(--color-accent)'
                : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: svc.is_added ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
              overflow: 'hidden',
            }}
          >
            {/* Service row header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              flexWrap: 'wrap',
            }}>
              {/* Reorder buttons */}
              {!readOnly && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                  <button type="button" onClick={() => moveUp(idx)} aria-label="向上移動"
                    style={arrowBtn} disabled={idx === 0}>▲</button>
                  <button type="button" onClick={() => moveDown(idx)} aria-label="向下移動"
                    style={arrowBtn} disabled={idx === services.length - 1}>▼</button>
                </div>
              )}

              {/* Number */}
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--radius-full)',
                background: svc.is_added ? 'var(--color-accent)' : 'var(--color-bg-subtle)',
                color: svc.is_added ? '#fff' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-xs)', fontWeight: 700, flexShrink: 0,
              }}>
                {idx + 1}
              </div>

              {/* Name */}
              {readOnly ? (
                <span style={{ flex: 2, fontWeight: 600, fontSize: 'var(--text-base)' }}>
                  {svc.service_name}
                </span>
              ) : (
                <input
                  className="field-input"
                  style={{ flex: 2, minWidth: 160 }}
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
                    fontSize: 'var(--text-xs)', padding: '2px 8px',
                    background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-full)',
                    color: 'var(--color-text-muted)',
                  }}>{svc.category}</span>
                )
              ) : (
                <input
                  className="field-input"
                  style={{ width: 130, minWidth: 100 }}
                  value={svc.category || ''}
                  onChange={e => updateService(idx, 'category', e.target.value)}
                  placeholder="類別（選填）"
                  aria-label="服務類別"
                />
              )}

              {svc.is_added && (
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: 700,
                  color: 'var(--color-accent)', flexShrink: 0,
                }}>新增</span>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'auto', flexShrink: 0 }}>
                {/* Checklist toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedChecklist(expandedChecklist === idx ? null : idx)}
                  aria-expanded={expandedChecklist === idx}
                  aria-label="展開客戶準備清單"
                  style={{
                    ...iconBtn,
                    background: expandedChecklist === idx ? 'var(--color-accent-subtle)' : undefined,
                    color: expandedChecklist === idx ? 'var(--color-accent)' : undefined,
                  }}
                  title="客戶準備清單"
                >
                  ☑ {(svc.checklist_items || []).length}
                </button>

                {!readOnly && (
                  <button type="button" onClick={() => removeService(idx)}
                    aria-label="刪除此服務項目" style={{ ...iconBtn, color: 'var(--color-danger)' }}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Checklist panel */}
            {expandedChecklist === idx && (
              <div style={{
                borderTop: '1px solid var(--color-border)',
                padding: 'var(--space-4)',
                background: 'var(--color-bg-subtle)',
              }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
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
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', width: 20, textAlign: 'right' }}>
                        {iIdx + 1}.
                      </span>
                      {readOnly ? (
                        <span style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{item.item_text}</span>
                      ) : (
                        <input
                          className="field-input"
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
                          style={{ ...iconBtn, color: 'var(--color-danger)', flexShrink: 0 }}>
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
        ))}
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

const arrowBtn = {
  background: 'var(--color-bg-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 10,
  width: 22,
  height: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-muted)',
}

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
