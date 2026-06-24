// src/pages/wizard/Step4Confirm.jsx
import { useState } from 'react'
import ROCDateInput from '../../components/ROCDateInput'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import IconTooltip from '@/components/IconTooltip'
import { Plus, X } from 'lucide-react'
import { formatRocDate, formatCeDisplay } from '../../lib/rocDate'

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

export default function Step4Confirm({ data, update, onFinish, saving, title = '步驟 4：報價與付款', description = '確認報價金額、付款階段與備註。' }) {
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
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="gap-0 py-0 shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30 px-6 py-3">
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
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto shrink-0 p-0 font-semibold"
                onClick={() => setEditingMeta(true)}
              >
                編輯
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <Field>
                  <FieldLabel htmlFor="quote_number">報價編號</FieldLabel>
                  <Input
                    id="quote_number"
                    type="text"
                    size="md"
                    className="font-medium"
                    value={data.quote_number}
                    onChange={e => update({ quote_number: e.target.value })}
                    placeholder="QT-2025-00001"
                    required
                  />
                </Field>
                <div className="space-y-2">
                  <ROCDateInput
                    id="quote_date"
                    label="報價日期"
                    value={data.quote_date}
                    onChange={v => update({ quote_date: v })}
                    useRoc={useRoc}
                    required
                  />
                  <Field orientation="horizontal" className="w-auto items-center gap-3">
                    <FieldLabel htmlFor="date_format" className="cursor-pointer">
                      使用民國曆顯示
                    </FieldLabel>
                    <Switch
                      id="date_format"
                      checked={useRoc}
                      onCheckedChange={setUseRoc}
                    />
                  </Field>
                </div>
              </FieldGroup>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-muted-foreground"
                  onClick={() => setEditingMeta(false)}
                >
                  完成
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
            <Field className="w-full sm:max-w-xs">
              <FieldLabel htmlFor="fee_amount">報價金額 (未稅)</FieldLabel>
              <InputGroup className="h-10">
                <InputGroupAddon>
                  <InputGroupText className="font-medium">NT$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="fee_amount"
                  type="number"
                  className="h-10 font-medium"
                  value={data.fee_amount || ''}
                  onChange={e => update({ fee_amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </InputGroup>
            </Field>
            <Field orientation="horizontal" className="w-auto items-center gap-3 sm:pb-1">
              <FieldLabel htmlFor="tax_included" className="cursor-pointer">
                外加 5% 營業稅金
              </FieldLabel>
              <Switch
                id="tax_included"
                checked={data.tax_included}
                onCheckedChange={val => update({ tax_included: val })}
              />
            </Field>
          </div>
        </CardContent>

        <CardFooter className="justify-between text-sm font-semibold">
          <span className="text-muted-foreground">總計應收金額 ({data.tax_included ? '含稅' : '未稅'})</span>
          <span className="text-lg font-bold text-primary">{fmt(grandTotal)}</span>
        </CardFooter>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold">付款階段</CardTitle>
          <CardDescription>付款階段百分比總和必須等於 100%</CardDescription>
          <CardAction>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="self-start font-semibold shadow-sm"
            onClick={handleAddStage}
          >
            <Plus data-icon="inline-start" />
            新增階段
          </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 mb-4">
          {PRESETS.map((p, idx) => (
            <Button
              key={idx}
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full px-3 font-medium"
              onClick={() => handleApplyPreset(p)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="hidden md:block overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                <TableHead className="h-auto w-10 px-3 py-2 text-center text-xs font-semibold text-muted-foreground">#</TableHead>
                <TableHead className="h-auto px-3 py-2 text-xs font-semibold text-muted-foreground">階段名稱</TableHead>
                <TableHead className="h-auto w-32 px-3 py-2 text-right text-xs font-semibold text-muted-foreground">百分比</TableHead>
                <TableHead className="h-auto w-36 px-3 py-2 text-right text-xs font-semibold text-muted-foreground">金額</TableHead>
                <TableHead className="h-auto w-10 px-2 py-2" aria-label="操作" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.payment_stages.map((stage, sIdx) => {
                const stageShare = Math.round(grandTotal * (Number(stage.percentage || 0) / 100))
                return (
                  <TableRow key={stage.id} className="border-border">
                    <TableCell className="px-3 py-2 text-center text-xs font-bold text-muted-foreground">
                      {sIdx + 1}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <Input
                        type="text"
                        placeholder="請輸入階段名稱（例：開工前）"
                        className="w-full"
                        value={stage.stage_name}
                        onChange={e => handleStageChange(stage.id, { stage_name: e.target.value })}
                        required
                      />
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <Input
                          type="number"
                          placeholder="0"
                          className="w-20 text-right font-medium"
                          value={stage.percentage || ''}
                          onChange={e => handleStageChange(stage.id, { percentage: e.target.value })}
                          max="100"
                          required
                        />
                        <span className="text-sm font-medium text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right text-xs font-semibold whitespace-nowrap text-muted-foreground">
                      {fmt(stageShare)}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-center">
                      <IconTooltip label="刪除此階段">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="刪除此階段"
                          onClick={() => handleRemoveStage(stage.id)}
                          disabled={data.payment_stages.length <= 1}
                          className="text-muted-foreground hover:text-rose-600 disabled:opacity-30 disabled:hover:text-muted-foreground"
                        >
                          <X />
                        </Button>
                      </IconTooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden space-y-2">
          {data.payment_stages.map((stage, sIdx) => {
            const stageShare = Math.round(grandTotal * (Number(stage.percentage || 0) / 100))
            return (
              <div key={stage.id} className="flex flex-wrap items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl">
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{sIdx + 1}</span>
                <Input
                  type="text"
                  placeholder="請輸入階段名稱（例：開工前）"
                  className="flex-1 min-w-[160px]"
                  value={stage.stage_name}
                  onChange={e => handleStageChange(stage.id, { stage_name: e.target.value })}
                  required
                />
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-full text-right font-medium"
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
                <IconTooltip label="刪除此階段">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="刪除此階段"
                    onClick={() => handleRemoveStage(stage.id)}
                    disabled={data.payment_stages.length <= 1}
                    className="ml-auto text-muted-foreground hover:text-rose-600 disabled:opacity-30 disabled:hover:text-muted-foreground"
                  >
                    <X />
                  </Button>
                </IconTooltip>
              </div>
            )
          })}
        </div>

        <Alert variant={isBalanced ? 'success' : 'warning'} className="mt-4">
          <AlertDescription className="flex items-center justify-between text-xs font-medium text-current">
            <span>目前設定百分比總和：</span>
            <span className="text-sm font-bold">{totalPercentage} % / 100 %</span>
          </AlertDescription>
        </Alert>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold">報價單備註事項</CardTitle>
        </CardHeader>
        <CardContent>
        <Textarea
          value={data.notes || ''}
          onChange={e => update({ notes: e.target.value })}
          placeholder="此處內容將顯示於印刷報價單底部（例如：本報價有效期限、付款流程細則說明、其他特定條款等…）"
          rows={4}
          className="resize-y"
        />
        </CardContent>
      </Card>
    </div>
  )
}