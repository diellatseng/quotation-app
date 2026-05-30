// src/pages/wizard/Step2Project.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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
          .map(ci => ({ id: ci.id, item_text: ci.item_text })),
        is_added: false,
      }))
    update({ project_template_id: tmpl.id, services })
  }

  const field = (key) => ({
    className: 'field-input',
    value: data[key] || '',
    onChange: e => update({ [key]: e.target.value }),
  })

  return (
    <div>
      <h2 className="page-heading">步驟 2：工程資料</h2>
      <p className="page-desc">選擇工程範本後，服務內容將自動載入（可在下一步調整）。</p>

      {/* Project fields */}
      <div className="card">
        <p className="section-title">工程基本資料</p>
        <div className="field-grid">
          <div>
            <label className="field-label" htmlFor="project_owner">起造人</label>
            <input id="project_owner" {...field('project_owner')} placeholder="某某建設股份有限公司" />
          </div>
          <div>
            <label className="field-label" htmlFor="building_permit">建照號碼</label>
            <input id="building_permit" {...field('building_permit')} placeholder="(114)高市工建築字第00123號" />
          </div>
          <div>
            <label className="field-label" htmlFor="land_section">地段</label>
            <input id="land_section" {...field('land_section')} placeholder="高雄市鹽埕區某某段123地號等6筆" required />
          </div>
          <div>
            <label className="field-label" htmlFor="project_scale">工程規模</label>
            <input id="project_scale" {...field('project_scale')} placeholder="地上23層地下5層2棟300戶" />
          </div>
        </div>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <label className="field-label" htmlFor="project_name">工程名稱</label>
          <input id="project_name" {...field('project_name')} placeholder="工程名稱" />
        </div>
      </div>

      {/* Template picker */}
      <div className="card" style={{ marginTop: 'var(--space-6)' }}>
        <p className="section-title">選擇工程範本</p>
        {templates.length === 0 ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            尚無工程範本，請至管理頁面新增，或跳過此步驟手動填寫服務內容。
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* None option */}
            <label className={`tmpl-option${data.project_template_id === null ? ' tmpl-option--selected' : ''}`}>
              <input type="radio" name="template" checked={data.project_template_id === null}
                onChange={() => selectTemplate(null)} style={{ width: 20, height: 20 }} />
              <div>
                <div className="tmpl-option__name">不使用範本</div>
                <div className="tmpl-option__meta">服務內容將手動新增</div>
              </div>
            </label>
            {templates.map(tmpl => (
              <label key={tmpl.id} className={`tmpl-option${data.project_template_id === tmpl.id ? ' tmpl-option--selected' : ''}`}>
                <input type="radio" name="template" checked={data.project_template_id === tmpl.id}
                  onChange={() => selectTemplate(tmpl)} style={{ width: 20, height: 20 }} />
                <div style={{ flex: 1 }}>
                  <div className="tmpl-option__name">{tmpl.name}</div>
                  {tmpl.description && (
                    <div className="tmpl-option__meta">{tmpl.description}</div>
                  )}
                  <div className="tmpl-option__count">
                    {(tmpl.template_services || []).length} 項服務
                  </div>
                </div>
                {tmpl.category && (
                  <span className="category-pill">{tmpl.category}</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
