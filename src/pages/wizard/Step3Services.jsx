// src/pages/wizard/Step3Services.jsx
import { useEffect } from 'react'
import ServiceTable from '../../components/ServiceTable'

// Compute diff_status for each service in `current` vs `parent`
function computeDiff(current, parent) {
  if (!parent || parent.length === 0) return current

  const parentMap = new Map(parent.map(p => [p.service_name, p]))

  // Mark current services
  const result = current.map(svc => {
    const p = parentMap.get(svc.service_name)
    if (!p) return { ...svc, diff_status: 'added' }
    const changed =
      (svc.category   || '') !== (p.category    || '') ||
      (svc.description|| '') !== (p.description || '')
    return { ...svc, diff_status: changed ? 'modified' : null }
  })

  // Append removed services (in parent but not in current)
  const currentNames = new Set(current.map(s => s.service_name))
  parent.forEach(p => {
    if (!currentNames.has(p.service_name)) {
      result.push({
        id: `removed-${p.service_name}`,
        service_name: p.service_name,
        category: p.category || '',
        description: p.description || '',
        checklist_items: [],
        is_added: false,
        diff_status: 'removed',
        _removed: true, // flag: not editable, just display
      })
    }
  })

  return result
}

export default function Step3Services({ data, update, parentServices, negContext }) {
  const isVersionEdit = parentServices && parentServices.length > 0

  // Auto-compute diff whenever services or parentServices change
  useEffect(() => {
    if (!isVersionEdit) return
    const withDiff = computeDiff(
      // Only pass non-removed services as "current" — removed ones are re-added by computeDiff
      data.services.filter(s => !s._removed),
      parentServices
    )
    // Only update if diff actually changed (avoid infinite loop)
    const same = withDiff.length === data.services.length &&
      withDiff.every((s, i) => s.diff_status === data.services[i]?.diff_status)
    if (!same) update({ services: withDiff })
  }, [parentServices]) // eslint-disable-line

  const handleChange = (services) => {
    if (!isVersionEdit) { update({ services }); return }
    // Re-run diff on every user edit, excluding _removed stubs from "current"
    update({ services: computeDiff(services.filter(s => !s._removed), parentServices) })
  }

  const addedCount    = data.services.filter(s => s.diff_status === 'added').length
  const modifiedCount = data.services.filter(s => s.diff_status === 'modified').length
  const removedCount  = data.services.filter(s => s.diff_status === 'removed').length

  return (
    <div>
      <h2 style={s.heading}>步驟 3：服務內容</h2>
      <p style={s.desc}>
        {isVersionEdit
          ? '這是議價版本的服務內容。系統已自動標示與上一版的差異，您可以自由新增、修改或刪除項目。'
          : data.project_template_id
            ? '已從工程範本載入服務內容，您可以自由新增、刪除或調整順序。'
            : '請手動新增服務項目。每項服務可設定客戶準備清單。'}
      </p>

      {/* Version diff summary banner */}
      {isVersionEdit && (addedCount + modifiedCount + removedCount > 0) && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: '#fffbeb',
          border: '1px solid #f59e0b',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-5)',
          fontSize: 'var(--text-sm)',
        }}>
          <span style={{ fontWeight: 700, color: '#92400e' }}>版本差異：</span>
          {addedCount > 0    && <DiffPill type="added"    count={addedCount} />}
          {modifiedCount > 0 && <DiffPill type="modified" count={modifiedCount} />}
          {removedCount > 0  && <DiffPill type="removed"  count={removedCount} />}
        </div>
      )}

      {negContext && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-accent-subtle)',
          border: '1px solid var(--color-accent)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-5)',
          fontSize: 'var(--text-sm)',
        }}>
          <span style={{ fontWeight: 700, color: 'var(--color-accent)', flexShrink: 0 }}>💬 議價</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            議價金額：<strong>NT$ {Number(negContext.amount).toLocaleString('zh-TW')}</strong>
            {negContext.notes && <> ／ {negContext.notes}</>}
          </span>
        </div>
      )}

      <div className="card">
        <p className="section-title">
          服務項目
          <span style={{ marginLeft: 'var(--space-3)', fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--color-text-muted)' }}>
            {data.services.filter(s => !s._removed).length} 項
          </span>
        </p>
        <ServiceTable
          services={data.services}
          onChange={handleChange}
          isVersionEdit={isVersionEdit}
        />
      </div>

      <div style={{
        marginTop: 'var(--space-4)', padding: 'var(--space-4)',
        background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
      }}>
        <strong>提示：</strong>點擊每列右側的 ☑ 按鈕可展開並編輯該服務的「客戶準備清單」。
        清單內容將列於報價單附件頁。
      </div>
    </div>
  )
}

function DiffPill({ type, count }) {
  const cfg = {
    added:    { label: '▲ 新增', bg: '#dcfce7', color: '#166534', border: '#86efac' },
    modified: { label: '✎ 更改', bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
    removed:  { label: '✕ 刪除', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  }[type]
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-full)',
      padding: '1px 10px', fontWeight: 600, fontSize: 12,
    }}>
      {cfg.label} {count}
    </span>
  )
}

const s = {
  heading: { fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' },
  desc: { fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' },
}
