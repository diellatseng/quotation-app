import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const NO_TEMPLATE = '__none__'

export default function TemplatePicker({ data, update }) {
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    supabase
      .from('project_templates')
      .select('id, name, description, category, template_services(service_id, sort_order, services(id, name, category, description, service_checklist_items(*)))')
      .order('name')
      .then(({ data: d }) => setTemplates(d || []))
  }, [])

  const selectTemplate = (tmpl) => {
    if (!tmpl) {
      update({ project_template_id: null, services: [] })
      return
    }
    const services = (tmpl.template_services || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(ts => ({
        id: crypto.randomUUID(),
        service_id: ts.service_id,
        service_name: ts.services?.name || '',
        category: ts.services?.category || '',
        description: ts.services?.description || '',
        checklist_items: (ts.services?.service_checklist_items || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(ci => ({ id: ci.id, item_text: ci.item_text })),
      }))
    update({ project_template_id: tmpl.id, services })
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-semibold">選擇服務範本</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={data.project_template_id ?? NO_TEMPLATE}
          onValueChange={(v) => {
            if (v === NO_TEMPLATE) selectTemplate(null)
            else selectTemplate(templates.find(t => t.id === v))
          }}
          className="flex flex-col gap-3"
        >
          <label
            className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted/40 select-none ${
              data.project_template_id === null
                ? 'border-primary bg-primary/[0.02] ring-1 ring-primary'
                : 'border-border bg-background'
            }`}
          >
            <RadioGroupItem value={NO_TEMPLATE} id="template-none" className="mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">不使用範本</div>
              <div className="text-xs text-muted-foreground mt-0.5">服務內容與查核項目將手動新增與編輯</div>
            </div>
          </label>

          {templates.map(tmpl => (
            <label
              key={tmpl.id}
              className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted/40 select-none ${
                data.project_template_id === tmpl.id
                  ? 'border-primary bg-primary/[0.02] ring-1 ring-primary'
                  : 'border-border bg-background'
              }`}
            >
              <RadioGroupItem value={tmpl.id} id={`template-${tmpl.id}`} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{tmpl.name}</div>
                {tmpl.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{tmpl.description}</div>
                )}
                <Badge variant="outline" className="mt-2 rounded-md border-primary/10 bg-primary/5 font-semibold text-primary">
                  {(tmpl.template_services || []).length} 項服務
                </Badge>
              </div>
              {tmpl.category && (
                <Badge variant="secondary" className="shrink-0 rounded-full">
                  {tmpl.category}
                </Badge>
              )}
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
