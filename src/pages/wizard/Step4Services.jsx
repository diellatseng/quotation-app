// src/pages/wizard/Step4Services.jsx
import ServiceTable from '../../components/ServiceTable'

export default function Step4Services({ data, update }) {
  return (
    <div>
      <h2 style={s.heading}>步驟 4：服務內容</h2>
      <p style={s.desc}>
        {data.project_template_id
          ? '已從工程範本載入服務內容，您可以自由新增、刪除或調整順序。以藍色標記的項目為新增項目。'
          : '請手動新增服務項目。每項服務可設定客戶準備清單。'}
      </p>

      {data.project_template_id && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-accent-subtle)',
          border: '1px solid var(--color-accent)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-5)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-accent)',
        }}>
          <span style={{ fontWeight: 700 }}>ℹ</span>
          已從範本載入 {data.services.length} 項服務。新增的項目將以藍色標示（差異追蹤）。
        </div>
      )}

      <div className="card">
        <p className="section-title">
          服務項目
          <span style={{
            marginLeft: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            fontWeight: 400,
            color: 'var(--color-text-muted)',
          }}>
            {data.services.length} 項
          </span>
        </p>
        <ServiceTable
          services={data.services}
          onChange={services => update({ services })}
        />
      </div>

      <div style={{
        marginTop: 'var(--space-4)',
        padding: 'var(--space-4)',
        background: 'var(--color-bg-subtle)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
      }}>
        <strong>提示：</strong>點擊每列右側的 ☑ 按鈕可展開並編輯該服務的「客戶準備清單」。
        清單內容將列於報價單附件頁。
      </div>
    </div>
  )
}

const s = {
  heading: { fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' },
  desc: { fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' },
}
