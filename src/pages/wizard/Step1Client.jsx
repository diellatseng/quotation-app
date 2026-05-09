// src/pages/wizard/Step1Client.jsx
import ClientPicker from '../../components/ClientPicker'

export default function Step1Client({ data, update }) {
  const handleClientChange = ({ client, contacts }) => {
    const primary = contacts.find(c => c.is_primary) || contacts[0] || null
    update({
      client,
      contacts,
      selectedContactId: primary?.id || null,
    })
  }

  return (
    <div>
      <h2 style={s.heading}>步驟 1：客戶資料</h2>
      <p style={s.desc}>請選擇現有客戶，或建立新客戶資料。</p>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <p className="section-title">選擇客戶</p>
        <ClientPicker
          value={data.client}
          onChange={handleClientChange}
        />
      </div>

      {/* Selected client summary */}
      {data.client && (
        <div className="card" style={{ borderColor: 'var(--color-accent)', borderWidth: 2 }}>
          <p className="section-title">已選擇客戶</p>
          <div style={s.infoGrid}>
            <InfoRow label="公司名稱" value={data.client.company_name} />
            {data.client.address && <InfoRow label="地址" value={data.client.address} />}
            {data.client.phone && <InfoRow label="電話" value={data.client.phone} />}
            {data.client.email && <InfoRow label="Email" value={data.client.email} />}
          </div>

          {data.contacts.length > 0 && (
            <>
              <p className="section-title" style={{ marginTop: 'var(--space-5)' }}>選擇聯絡人</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {data.contacts.map(c => (
                  <label key={c.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    border: `1.5px solid ${data.selectedContactId === c.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: data.selectedContactId === c.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-input)',
                    minHeight: 'var(--tap-min)',
                  }}>
                    <input
                      type="radio"
                      name="contact"
                      value={c.id}
                      checked={data.selectedContactId === c.id}
                      onChange={() => update({ selectedContactId: c.id })}
                      style={{ width: 20, height: 20 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {[c.mobile, c.office_phone, c.email].filter(Boolean).join(' ／ ')}
                      </div>
                    </div>
                    {c.is_primary && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: 'var(--text-xs)', fontWeight: 700,
                        color: 'var(--color-accent)',
                        background: 'var(--color-accent-subtle)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                      }}>主要</span>
                    )}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', width: 72, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', flex: 1 }}>{value}</span>
    </div>
  )
}

const s = {
  heading: { fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)', color: 'var(--color-text)' },
  desc: { fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' },
}
