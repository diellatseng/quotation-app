// src/pages/wizard/Step3Services.jsx
import { useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { Badge, DiffBadge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ServiceTable from '../../components/ServiceTable'
import TemplatePicker from '../../components/TemplatePicker'
import { FEATURE_NEGOTIATION, FEATURE_VERSIONING } from '../../lib/featureFlags'

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

export default function Step3Services({
  data,
  update,
  parentServices = null,
  negContext = null,
  title = '步驟 3：服務內容',
  description = '選擇範本匯入服務，或直接編輯下方服務項目與查核清單。',
}) {
  const isVersionEdit = FEATURE_VERSIONING && parentServices !== null
  const serviceCount = data.services.filter(s => !s._removed).length

  useEffect(() => {
    if (!isVersionEdit) return
    const merged = computeDiff(data.services, parentServices)
    const hasDiff = merged.some(s => s.diff_status !== null)
    if (hasDiff || merged.length !== data.services.length) {
      update({ services: merged })
    }
  }, [isVersionEdit, parentServices]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (newServices) => {
    if (isVersionEdit) {
      update({ services: computeDiff(newServices, parentServices) })
    } else {
      update({ services: newServices })
    }
  }

  const addedCount = data.services.filter(s => s.diff_status === 'added').length
  const modifiedCount = data.services.filter(s => s.diff_status === 'modified').length
  const removedCount = data.services.filter(s => s.diff_status === 'removed').length
  const showDiffBanner = isVersionEdit && (addedCount > 0 || modifiedCount > 0 || removedCount > 0)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {showDiffBanner && (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">版本差異比較：</span>
            {addedCount > 0 && <DiffBadge type="added" count={addedCount} />}
            {modifiedCount > 0 && <DiffBadge type="modified" count={modifiedCount} />}
            {removedCount > 0 && <DiffBadge type="removed" count={removedCount} />}
          </AlertDescription>
        </Alert>
      )}

      {FEATURE_NEGOTIATION && negContext && (
        <Alert className="border-primary/20 bg-primary/[0.02]">
          <MessageSquare className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <AlertDescription className="text-foreground">
            議價歷史記錄金額：<strong className="font-bold text-primary">NT$ {Number(negContext.amount).toLocaleString('zh-TW')}</strong>
            {negContext.notes && <span className="text-muted-foreground"> ／ {negContext.notes}</span>}
          </AlertDescription>
        </Alert>
      )}

      <Card className="gap-0 py-0 shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-x-4 gap-y-3">
              <TemplatePicker data={data} update={update} className="w-full sm:w-auto sm:min-w-[14rem]" />
              <Badge variant="secondary" className="mb-0.5 rounded-full">
                已加入 {serviceCount} 項
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-4 sm:px-6">
          <CardTitle className="sr-only">服務項目列表</CardTitle>
          <ServiceTable
            services={data.services}
            onChange={handleChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
