// src/pages/wizard/Step1Client.jsx
import ClientPicker from '../../components/ClientPicker'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function Step1Client({ data, update, loading = false }) {
  const handleClientChange = (value) => {
    if (value === null) {
      // Clear selection
      update({
        client: null,
        contacts: [],
        selectedContactId: null,
      })
      return
    }

    const { client, contacts } = value
    const primary = contacts.find(c => c.is_primary) || contacts[0] || null
    update({
      client,
      contacts,
      selectedContactId: primary?.id || null,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">步驟 1：客戶資料</h2>
        <p className="text-sm text-muted-foreground">請選擇現有客戶，或建立新客戶資料。</p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm relative">
        <p className="text-base font-semibold text-foreground mb-4">選擇客戶</p>
        {loading && !data.client ? (
          <div className="text-center py-8 space-y-3">
            <div className="text-sm font-medium text-muted-foreground animate-pulse">載入中…</div>
            <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <ClientPicker
            value={data.client?.id}
            onChange={handleClientChange}
          />
        )}
      </div>

      {data.client && (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <p className="text-base font-semibold text-foreground mb-4">客戶詳細資料</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <InfoRow label="公司名稱" value={data.client.company_name} />
                <InfoRow label="統一編號" value={data.client.tax_id || '—'} />
                <InfoRow label="電話" value={data.client.phone || '—'} />
              </div>
              <div className="space-y-2">
                <InfoRow label="地址" value={data.client.address || '—'} />
                <InfoRow label="電子郵件" value={data.client.email || '—'} />
              </div>
            </div>
          </div>

          {data.contacts && data.contacts.length > 0 && (
            <div className="border-t border-border pt-5">
              <p className="text-base font-semibold text-foreground mb-3">聯絡人選擇</p>
              <RadioGroup
                value={data.selectedContactId ?? undefined}
                onValueChange={(id) => update({ selectedContactId: id })}
                className="flex flex-col gap-2.5"
              >
                {data.contacts.map(c => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted/40 select-none ${data.selectedContactId === c.id
                      ? 'border-primary bg-primary/[0.02] ring-1 ring-primary'
                      : 'border-border bg-background'
                      }`}
                  >
                    <RadioGroupItem value={c.id} id={`contact-${c.id}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm">
                        {c.name} {c.title && <span className="text-muted-foreground font-normal text-xs">({c.title})</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {[c.mobile, c.email].filter(Boolean).join(' ／ ')}
                      </div>
                    </div>
                    {c.is_primary && (
                      <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full tracking-wider">
                        主要
                      </span>
                    )}
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-3 text-sm leading-relaxed">
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-foreground font-medium break-all">{value}</span>
    </div>
  )
}