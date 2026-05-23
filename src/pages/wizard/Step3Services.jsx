// src/pages/wizard/Step3Services.jsx
import { useEffect } from 'react'
import ServiceTable from '../../components/ServiceTable'

// Compute diff_status for each service in `current` vs `parent`
function computeDiff(current, parent) {
  if (!parent || parent.length === 0) return current

  const parentMap = new Map(parent.map(p => [p.service_name, p]))

  const result = current.map(svc => {
    const p = parentMap.get(svc.service_name)
    if (!p) return { ...svc, diff_status: 'added' }
    const changed =
      (svc.category    || '') !== (p.category    || '') ||
      (svc.description || '') !== (p.description || '')
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
        _removed: true,
      })
    }
  })

  return result
}

export default function Step3Services({ data, update, parentServices, negContext }) {
  const isVersionEdit = parentServices && parentServices.length > 0

  useEffect(() => {
    if (!isVersionEdit) return
    const withDiff = computeDiff(
      data.services.filter(s => !s._removed),
      parentServices
    )
    const same = withDiff.length === data.services.length &&
      withDiff.every((s, i) => s.diff_status === data.services[i]?.diff_status)
    if (!same) update({ services: withDiff })
  }, [parentServices]) // eslint-disable-line

  const handleChange = (services) => {
    if (!isVersionEdit) { update({ services }); return }
    update({ services: computeDiff(services.filter(s => !s._removed), parentServices) })
  }

  const addedCount    = data.services.filter(s => s.diff_status === 'added').length
  const modifiedCount = data.services.filter(s => s.diff_status === 'modified').length
  const removedCount  = data.services.filter(s => s.diff_status === 'removed').length

  return (
    <div>
      <h2 className="page-heading">步驟 3：服務內容</h2>
      <p className="page-desc">
        {isVersionEdit
          ? '這是議價版本的服務內容。系統已自動標示與上一版的差異，您可以自由新增、修改或刪除項目。'
          : data.project_template_id
            ? '已從工程範本載入服務內容，您可以自由新增、刪除或調整順序。'
            : '請手動新增服務項目。每項服務可設定客戶準備清單。'}
      </p>

      {/* Version diff summary banner */}
      {isVersionEdit && (addedCount + modifiedCount + removedCount > 0) && (
        <div className="info-banner info-banner--diff">
          <span className="info-banner__label">版本差異：</span>
          {addedCount    > 0 && <span className="diff-badge diff-badge--added">▲ 新增 {addedCount}</span>}
          {modifiedCount > 0 && <span className="diff-badge diff-badge--modified">✎ 更改 {modifiedCount}</span>}
          {removedCount  > 0 && <span className="diff-badge diff-badge--removed">✕ 刪除 {removedCount}</span>}
        </div>
      )}

      {/* Negotiation context banner */}
      {negContext && (
        <div className="info-banner info-banner--accent">
          <span className="info-banner__label">💬 議價</span>
          <span className="info-banner__body">
            議價金額：<strong>NT$ {Number(negContext.amount).toLocaleString('zh-TW')}</strong>
            {negContext.notes && <> ／ {negContext.notes}</>}
          </span>
        </div>
      )}

      <div className="card">
        <p className="section-title">
          服務項目
          <span className="section-title__count">
            {data.services.filter(s => !s._removed).length} 項
          </span>
        </p>
        <ServiceTable
          services={data.services}
          onChange={handleChange}
          isVersionEdit={isVersionEdit}
        />
      </div>

      <div className="info-banner info-banner--subtle" style={{ marginTop: 'var(--space-4)' }}>
        <strong>提示：</strong>點擊每列右側的 ☑ 按鈕可展開並編輯該服務的「客戶準備清單」。
        清單內容將列於報價單附件頁。
      </div>
    </div>
  )
}
