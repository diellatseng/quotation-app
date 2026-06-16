// src/pages/wizard/Step2Project.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export default function Step2Project({ data, update }) {
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
          .map(ci => ({ id: ci.id, item_text: ci.item_text }))
      }))
    update({ project_template_id: tmpl.id, services })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">步驟 2：工程資料</h2>
        <p className="text-sm text-muted-foreground">請輸入本工程相關資訊，並選定預設服務項目範本。</p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <p className="text-base font-semibold text-foreground mb-4">工程基本資料</p>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>工程名稱</FieldLabel>
            <Input
              type="text"
              value={data.project_name || ''}
              onChange={e => update({ project_name: e.target.value })}
              placeholder="例如：住宅新建工程"
              required
            />
          </Field>
          <Field>
            <FieldLabel>起造人 / 業主</FieldLabel>
            <Input
              type="text"
              value={data.project_owner || ''}
              onChange={e => update({ project_owner: e.target.value })}
              placeholder="例如：王小明"
            />
          </Field>
          <Field>
            <FieldLabel>建造執照字號</FieldLabel>
            <Input
              type="text"
              value={data.building_permit || ''}
              onChange={e => update({ building_permit: e.target.value })}
              placeholder="例如：(112)高市工建築字第XXXXX號"
            />
          </Field>
          <Field>
            <FieldLabel>地號資訊</FieldLabel>
            <Input
              type="text"
              value={data.land_section || ''}
              onChange={e => update({ land_section: e.target.value })}
              placeholder="例如：XX區XX段XX地號"
            />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>工程規模 / 備註說明</FieldLabel>
            <Input
              type="text"
              value={data.project_scale || ''}
              onChange={e => update({ project_scale: e.target.value })}
              placeholder="例如：地上5層，地下1層，RC構造，總樓地板面積..."
            />
          </Field>
        </FieldGroup>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <p className="text-base font-semibold text-foreground mb-4">選擇服務範本</p>
        <div className="flex flex-col gap-3">
          <label
            className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted/40 select-none ${data.project_template_id === null
                ? 'border-primary bg-primary/[0.02] ring-1 ring-primary'
                : 'border-border bg-background'
              }`}
          >
            <input
              type="radio"
              name="template"
              className="w-4 h-4 text-primary focus:ring-primary border-border mt-0.5"
              checked={data.project_template_id === null}
              onChange={() => selectTemplate(null)}
            />
            <div>
              <div className="text-sm font-semibold text-foreground">不使用範本</div>
              <div className="text-xs text-muted-foreground mt-0.5">服務內容與查核項目將手動新增與編輯</div>
            </div>
          </label>

          {templates.map(tmpl => (
            <label
              key={tmpl.id}
              className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted/40 select-none ${data.project_template_id === tmpl.id
                  ? 'border-primary bg-primary/[0.02] ring-1 ring-primary'
                  : 'border-border bg-background'
                }`}
            >
              <input
                type="radio"
                name="template"
                className="w-4 h-4 text-primary focus:ring-primary border-border mt-0.5"
                checked={data.project_template_id === tmpl.id}
                onChange={() => selectTemplate(tmpl)}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{tmpl.name}</div>
                {tmpl.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{tmpl.description}</div>
                )}
                <div className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded mt-2 border border-primary/10">
                  {(tmpl.template_services || []).length} 項服務
                </div>
              </div>
              {tmpl.category && (
                <span className="shrink-0 text-xs font-medium px-2.5 py-0.5 bg-muted text-muted-foreground border border-border rounded-full">
                  {tmpl.category}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
