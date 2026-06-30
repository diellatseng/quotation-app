// src/pages/wizard/Step4Confirm.jsx
import { useState } from 'react'
import ROCDateInput from '../../components/ROCDateInput'
import PaymentStagesTable, { addPaymentStage } from '../../components/PaymentStagesTable'
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
import { Plus } from 'lucide-react'
import { grandTotalFromFee } from '@/lib/paymentStagePresets'
import { formatRocDate, formatCeDisplay } from '../../lib/rocDate'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

export default function Step4Confirm({ data, update, onFinish, saving, title = '步驟 4：報價與付款', description = '確認報價金額、付款階段與備註。' }) {
  const [useRoc, setUseRoc] = useState(true)
  const [editingMeta, setEditingMeta] = useState(false)

  const dateDisplay = data.quote_date
    ? (useRoc ? formatRocDate(data.quote_date) : formatCeDisplay(data.quote_date))
    : '—'

  const handleAddStage = () => {
    update({ payment_stages: addPaymentStage(data.payment_stages, 0) })
  }

  const grandTotal = grandTotalFromFee(data.fee_amount, data.tax_included)

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
          <PaymentStagesTable
            stages={data.payment_stages}
            onStagesChange={payment_stages => update({ payment_stages })}
            grandTotal={grandTotal}
            showAddButton={false}
          />
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