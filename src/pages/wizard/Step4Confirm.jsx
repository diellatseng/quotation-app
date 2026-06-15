// src/pages/wizard/Step4Confirm.jsx
import { useState } from 'react'
import ROCDateInput from '../../components/ROCDateInput'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { getIcon } from '@/lib/icons'
import { formatRocDate, formatCeDisplay } from '../../lib/rocDate'

const PlusIcon = getIcon('add')
const CloseIcon = getIcon('close')

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

const PRESETS = [
  {
    label: '兩階段（開工/完工）',
    stages: [
      { stage_name: '開工前', percentage: 50 },
      { stage_name: '完工後', percentage: 50 },
    ],
  },
  {
    label: '三階段（開工/施工/完工）',
    stages: [
      { stage_name: '開工前', percentage: 30 },
      { stage_name: '施工中', percentage: 40 },
      { stage_name: '完工後', percentage: 30 },
    ],
  },
  {
    label: '四階段分配',
    stages: [
      { stage_name: '開工完成', percentage: 20 },
      { stage_name: '結構體完成', percentage: 20 },
      { stage_name: '裝修完成', percentage: 20 },
      { stage_name: '取得使用執照', percentage: 40 },
    ],
  },
]

export default function Step4Confirm({ data, update }) {
  const [useRoc, setUseRoc] = useState(true)
  const [editingMeta, setEditingMeta] = useState(false)

  const dateDisplay = data.quote_date
    ? (useRoc ? formatRocDate(data.quote_date) : formatCeDisplay(data.quote_date))
    : '—'

  const handleApplyPreset = (preset) => {
    const updated = preset.stages.map(s => ({
      id: crypto.randomUUID(),
      stage_name: s.stage_name,
      percentage: s.percentage,
    }))
    update({ payment_stages: updated })
  }

  const handleStageChange = (id, fields) => {
    const next = data.payment_stages.map(s => (s.id === id ? { ...s, ...fields } : s))
    update({ payment_stages: next })
  }

  const handleAddStage = () => {
    update({
      payment_stages: [
        ...data.payment_stages,
        { id: crypto.randomUUID(), stage_name: '', percentage: 0 },
      ],
    })
  }

  const handleRemoveStage = (id) => {
    update({ payment_stages: data.payment_stages.filter(s => s.id !== id) })
  }

  const totalPercentage = data.payment_stages.reduce((sum, s) => sum + Number(s.percentage || 0), 0)
  const isBalanced = totalPercentage === 100

  const totalAmount = Number(data.fee_amount || 0)
  const taxAmount = data.tax_included ? Math.round(totalAmount * 0.05) : 0
  const grandTotal = totalAmount + taxAmount

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">步驟 4：報價與付款</h2>
        <p className="text-sm text-muted-foreground">填寫報價費用總額，並設定各階段付款收款條件比率。</p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Document meta — card header band */}
        <div className="bg-muted/30 border-b border-border px-6 py-3">
          {!editingMeta ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm min-w-0">
                <span>
                  <span className="text-muted-foreground">編號 </span>
                  <span className="font-medium text-foreground">{data.quote_number || '—'}</span>
                </span>
                <span className="hidden sm:inline text-muted-foreground/40" aria-hidden="true">·</span>
                <span>
                  <span className="text-muted-foreground">日期 </span>
                  <span className="font-medium text-foreground">{dateDisplay}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingMeta(true)}
                className="shrink-0 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                編輯
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-1.5">
                  <label htmlFor="quote_number" className="block text-xs font-semibold text-foreground">報價編號 *</label>
                  <input
                    id="quote_number"
                    type="text"
                    className="w-full h-10 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    value={data.quote_number}
                    onChange={e => update({ quote_number: e.target.value })}
                    placeholder="QT-2025-00001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <ROCDateInput
                    id="quote_date"
                    label="報價日期 *"
                    value={data.quote_date}
                    onChange={v => update({ quote_date: v })}
                    useRoc={useRoc}
                    required
                  />
                  <div className="inline-flex items-center gap-3">
                    <label
                      htmlFor="date_format"
                      className="text-sm font-medium text-foreground select-none cursor-pointer"
                    >
                      使用民國曆顯示
                    </label>
                    <Switch
                      id="date_format"
                      checked={useRoc}
                      onCheckedChange={setUseRoc}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingMeta(false)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  完成
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
            <div className="space-y-1.5 w-full sm:max-w-xs">
              <label htmlFor="fee_amount" className="block text-xs font-semibold text-foreground">報價金額 (未稅) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-medium">NT$</span>
                <input
                  id="fee_amount"
                  type="number"
                  className="w-full h-10 pl-11 pr-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={data.fee_amount || ''}
                  onChange={e => update({ fee_amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-3 sm:pb-1">
              <label
                htmlFor="tax_included"
                className="text-sm font-medium text-foreground select-none cursor-pointer"
              >
                外加 5% 營業稅金
              </label>
              <Switch
                id="tax_included"
                checked={data.tax_included}
                onCheckedChange={val => update({ tax_included: val })}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border bg-muted/10 flex justify-between items-center text-sm font-semibold">
          <span className="text-muted-foreground">總計應收金額 ({data.tax_included ? '含稅' : '未稅'})</span>
          <span className="text-lg font-bold text-primary">{fmt(grandTotal)}</span>
        </div>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-base font-semibold text-foreground">付款階段</p>
            <p className="text-xs text-muted-foreground mt-0.5">付款階段百分比總和必須等於 100%</p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="self-start font-semibold shadow-sm"
            onClick={handleAddStage}
          >
            {PlusIcon && <PlusIcon data-icon="inline-start" />}
            新增階段
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 text-xs font-medium border border-border bg-background text-foreground rounded-full hover:bg-muted transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-10 px-3 py-2 text-xs font-semibold text-muted-foreground text-center">#</th>
                <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">階段名稱</th>
                <th className="w-32 px-3 py-2 text-xs font-semibold text-muted-foreground text-right">百分比</th>
                <th className="w-36 px-3 py-2 text-xs font-semibold text-muted-foreground text-right">金額</th>
                <th className="w-10 px-2 py-2" aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {data.payment_stages.map((stage, sIdx) => {
                const stageShare = Math.round(grandTotal * (Number(stage.percentage || 0) / 100))
                return (
                  <tr key={stage.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2 text-xs font-bold text-muted-foreground text-center align-middle">
                      {sIdx + 1}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="text"
                        placeholder="請輸入階段名稱（例：開工前）"
                        className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        value={stage.stage_name}
                        onChange={e => handleStageChange(stage.id, { stage_name: e.target.value })}
                        required
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          placeholder="0"
                          className="w-20 h-9 px-2 text-right text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
                          value={stage.percentage || ''}
                          onChange={e => handleStageChange(stage.id, { percentage: e.target.value })}
                          max="100"
                          required
                        />
                        <span className="text-sm text-muted-foreground font-medium">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-muted-foreground text-right align-middle whitespace-nowrap">
                      {fmt(stageShare)}
                    </td>
                    <td className="px-2 py-2 text-center align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="刪除此階段"
                        aria-label="刪除此階段"
                        onClick={() => handleRemoveStage(stage.id)}
                        disabled={data.payment_stages.length <= 1}
                        className="text-muted-foreground hover:text-rose-600 disabled:opacity-30 disabled:hover:text-muted-foreground"
                      >
                        {CloseIcon && <CloseIcon />}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-2">
          {data.payment_stages.map((stage, sIdx) => {
            const stageShare = Math.round(grandTotal * (Number(stage.percentage || 0) / 100))
            return (
              <div key={stage.id} className="flex flex-wrap items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl">
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{sIdx + 1}</span>
                <input
                  type="text"
                  placeholder="請輸入階段名稱（例：開工前）"
                  className="flex-1 min-w-[160px] h-9 px-3 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  value={stage.stage_name}
                  onChange={e => handleStageChange(stage.id, { stage_name: e.target.value })}
                  required
                />
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full h-9 px-2 text-right text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
                    value={stage.percentage || ''}
                    onChange={e => handleStageChange(stage.id, { percentage: e.target.value })}
                    max="100"
                    required
                  />
                  <span className="text-sm text-muted-foreground font-medium">%</span>
                </div>
                <div className="text-xs font-semibold text-muted-foreground w-28 text-right shrink-0">
                  {fmt(stageShare)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="刪除此階段"
                  aria-label="刪除此階段"
                  onClick={() => handleRemoveStage(stage.id)}
                  disabled={data.payment_stages.length <= 1}
                  className="ml-auto text-muted-foreground hover:text-rose-600 disabled:opacity-30 disabled:hover:text-muted-foreground"
                >
                  {CloseIcon && <CloseIcon />}
                </Button>
              </div>
            )
          })}
        </div>

        <div className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${isBalanced
            ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10'
            : 'bg-amber-500/5 text-amber-600 border-amber-500/10'
          }`}>
          <span>目前設定百分比總和：</span>
          <span className="text-sm font-bold">{totalPercentage} % / 100 %</span>
        </div>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        <p className="text-base font-semibold text-foreground mb-3">報價單備註事項</p>
        <textarea
          className="w-full p-3 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
          value={data.notes || ''}
          onChange={e => update({ notes: e.target.value })}
          placeholder="此處內容將顯示於印刷報價單底部（例如：本報價有效期限、付款流程細則說明、其他特定條款等…）"
          rows={4}
        />
      </div>
    </div>
  )
}