import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

const NO_TEMPLATE = '__none__'

export default function TemplatePicker({ data, update, className }) {
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

  const selectedTemplate = templates.find(t => t.id === data.project_template_id)
  const selectedLabel = data.project_template_id
    ? (selectedTemplate?.name ?? '已選範本')
    : '不使用範本'

  return (
    <Field className={className}>
      <FieldLabel htmlFor="project_template" className="text-xs text-muted-foreground">
        服務範本
      </FieldLabel>
      <Select
        value={data.project_template_id ?? NO_TEMPLATE}
        onValueChange={(v) => {
          if (v === NO_TEMPLATE) selectTemplate(null)
          else selectTemplate(templates.find(t => t.id === v))
        }}
      >
        <SelectTrigger id="project_template" className="h-9 w-full min-w-[12rem] font-medium">
          {selectedLabel}
        </SelectTrigger>
        <SelectContent align="end" className="max-w-[min(24rem,calc(100vw-2rem))]">
          <SelectItem value={NO_TEMPLATE}>不使用範本</SelectItem>
          {templates.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              尚無範本
            </SelectItem>
          ) : (
            templates.map(tmpl => (
              <SelectItem key={tmpl.id} value={tmpl.id}>
                <span className="truncate">{tmpl.name}</span>
                {(tmpl.template_services || []).length > 0 && (
                  <span className="text-muted-foreground">
                    {' '}· {(tmpl.template_services || []).length} 項
                  </span>
                )}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </Field>
  )
}
