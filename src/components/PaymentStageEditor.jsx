import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
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
import {
  PAYMENT_STAGE_PRESETS,
  grandTotalFromFee,
  newStageRow,
  stageAmountFromPercentage,
  stagesFromPreset,
} from '@/lib/paymentStagePresets'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

export default function PaymentStageEditor({
  contractTotal,
  taxIncluded,
  onContractTotalChange,
  onTaxIncludedChange,
  stages,
  onStagesChange,
  showContractFields = true,
}) {
  const grandTotal = Number(contractTotal) || 0

  const handleStageChange = (stageId, fields) => {
    onStagesChange(stages.map(s => {
      if (s.id !== stageId) return s
      const next = { ...s, ...fields }
      if ('percentage' in fields && grandTotal > 0) {
        next.amount = stageAmountFromPercentage(grandTotal, next.percentage)
      }
      if ('amount' in fields && grandTotal > 0) {
        next.percentage = Math.round((Number(next.amount) / grandTotal) * 10000) / 100
      }
      return next
    }))
  }

  const handleApplyPreset = (preset) => {
    onStagesChange(stagesFromPreset(preset, grandTotal))
  }

  const handleAddStage = () => {
    onStagesChange([...stages, newStageRow()])
  }

  const handleRemoveStage = (stageId) => {
    onStagesChange(stages.filter(s => s.id !== stageId))
  }

  const stageTotal = stages.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)

  return (
    <div className="space-y-4">
      {showContractFields && (
        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="invoice_contract_total">合約總金額（含稅）</FieldLabel>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText>NT$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="invoice_contract_total"
                type="number"
                min="0"
                value={contractTotal || ''}
                onChange={e => {
                  const nextTotal = e.target.value
                  onContractTotalChange(nextTotal)
                  if (Number(nextTotal) > 0) {
                    onStagesChange(stages.map(s => ({
                      ...s,
                      amount: stageAmountFromPercentage(nextTotal, s.percentage),
                    })))
                  }
                }}
                placeholder="0"
              />
            </InputGroup>
          </Field>
          <Field className="flex flex-row items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <div>
              <FieldLabel className="mb-0">報價含稅</FieldLabel>
              <p className="text-xs text-muted-foreground">影響合約總額計算方式</p>
            </div>
            <Switch
              checked={!!taxIncluded}
              onCheckedChange={onTaxIncludedChange}
            />
          </Field>
        </FieldGroup>
      )}

      <div className="flex flex-wrap gap-2">
        {PAYMENT_STAGE_PRESETS.map(preset => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full px-3 font-medium"
            onClick={() => handleApplyPreset(preset)}
            disabled={!(grandTotal > 0)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
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
            {stages.map((stage, sIdx) => (
              <TableRow key={stage.id} className="border-border">
                <TableCell className="px-3 py-2 text-center text-xs font-bold text-muted-foreground">
                  {sIdx + 1}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <Input
                    type="text"
                    placeholder="例：開工前"
                    value={stage.stage_name}
                    onChange={e => handleStageChange(stage.id, { stage_name: e.target.value })}
                  />
                </TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1.5">
                    <Input
                      type="number"
                      className="w-20 text-right font-medium"
                      value={stage.percentage || ''}
                      onChange={e => handleStageChange(stage.id, { percentage: e.target.value })}
                      max="100"
                    />
                    <span className="text-sm font-medium text-muted-foreground">%</span>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <Input
                    type="number"
                    className="text-right font-medium"
                    value={stage.amount || ''}
                    onChange={e => handleStageChange(stage.id, { amount: e.target.value })}
                    min="0"
                  />
                </TableCell>
                <TableCell className="px-2 py-2 text-center">
                  <IconTooltip label="刪除此階段">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="刪除此階段"
                      onClick={() => handleRemoveStage(stage.id)}
                      disabled={stages.length <= 1}
                      className="text-muted-foreground hover:text-rose-600 disabled:opacity-30"
                    >
                      <X />
                    </Button>
                  </IconTooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {stages.map((stage, sIdx) => (
          <div key={stage.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
            <span className="w-5 text-center text-xs font-bold text-muted-foreground">{sIdx + 1}</span>
            <Input
              type="text"
              placeholder="階段名稱"
              className="min-w-[160px] flex-1"
              value={stage.stage_name}
              onChange={e => handleStageChange(stage.id, { stage_name: e.target.value })}
            />
            <Input
              type="number"
              className="w-24 text-right"
              value={stage.amount || ''}
              onChange={e => handleStageChange(stage.id, { amount: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveStage(stage.id)}
              disabled={stages.length <= 1}
            >
              <X />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" className="font-semibold" onClick={handleAddStage}>
          <Plus data-icon="inline-start" />
          新增階段
        </Button>
        {grandTotal > 0 && (
          <p className="text-xs text-muted-foreground">
            階段合計 {fmt(stageTotal)}
            {Math.abs(stageTotal - grandTotal) > 1 && (
              <span className="ml-1 text-amber-600">（與合約總額 {fmt(grandTotal)} 不一致）</span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

export function initialManualStageState(project) {
  const grand = Number(project?.total_amount) || 0
  return {
    contractTotal: grand || '',
    taxIncluded: !!project?.tax_included,
    stages: [
      newStageRow({
        stage_name: '請款',
        percentage: 100,
        amount: grand || 0,
      }),
    ],
  }
}

export { grandTotalFromFee }
