// src/pages/wizard/Step3Services.jsx
import { useEffect } from 'react'
import ServiceTable from '../../components/ServiceTable'

function computeDiff(current, parent) {
  if (!parent || parent.length === 0) return current

  const parentMap = new Map(parent.map(p => [p.service_name, p]))

  const result = current.map(svc => {
    const p = parentMap.get(svc.service_name)
    if (!p) return { ...svc, diff_status: 'added' }
    const changed =
      (svc.category || '') !== (p.category || '') ||
      (svc.description || '') !== (p.description || '')
    return { ...svc, diff_status: changed ? 'modified' : null }
  })

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

export default function Step3Services({ data, update, parentServices = null, negContext = null }) {
  const isVersionEdit = parentServices !== null

  useEffect(() => {
    if (isVersionEdit) {
      const merged = computeDiff(data.services, parentServices)
      const hasDiff = merged.some(s => s.diff_status !== null)
      if (hasDiff || merged.length !== data.services.length) {
        update({ services: merged })
      }
    }
  }, [isVersionEdit, parentServices])

  const handleChange = (newServices) => {
    if (isVersionEdit) {
      const merged = computeDiff(newServices, parentServices)
      update({ services: merged })
    } else {
      update({ services: newServices })
    }
  }

  const addedCount = data.services.filter(s => s.diff_status === 'added').length
  const modifiedCount = data.services.filter(s => s.diff_status === 'modified').length
  const removedCount = data.services.filter(s => s.diff_status === 'removed').length
  const showDiffBanner = isVersionEdit && (addedCount > 0 || modifiedCount > 0 || removedCount > 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">步驟 3：服務內容</h2>
        <p className="text-sm text-muted-foreground">配置、調整各項服務及查核清單細節項目。</p>
      </div>

      {showDiffBanner && (
        <div className="p-4 rounded-xl text-sm border bg-muted/40 border-border flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">版本差異比較：</span>
          {addedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              ▲ 新增 {addedCount}
            </span>
          )}
          {modifiedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              ✎ 更改 {modifiedCount}
            </span>
          )}
          {removedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
              ✕ 刪除 {removedCount}
            </span>
          )}
        </div>
      )}

      {negContext && (
        <div className="p-4 rounded-xl text-sm border bg-primary/[0.02] border-primary/20 flex items-center gap-2">
          <span className="text-base">💬</span>
          <span className="text-foreground">
            議價歷史記錄金額：<strong className="font-bold text-primary">NT$ {Number(negContext.amount).toLocaleString('zh-TW')}</strong>
            {negContext.notes && <span className="text-muted-foreground"> ／ {negContext.notes}</span>}
          </span>
        </div>
      )}

      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-semibold text-foreground">服務項目列表</p>
          <span className="text-xs font-medium bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full border border-border">
            已加入 {data.services.filter(s => !s._removed).length} 項
          </span>
        </div>
        <ServiceTable
          services={data.services}
          onChange={handleChange}
          isVersionEdit={isVersionEdit}
        />
      </div>
    </div>
  )
}