import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import IconTooltip from '@/components/IconTooltip'
import { Plus, X } from 'lucide-react'
import {
  PAYMENT_STAGE_PRESETS,
  addPaymentStage,
  applyPaymentStagePreset,
  displayStageAmount,
  removePaymentStage,
  sumStageAmounts,
  sumStagePercentages,
  updatePaymentStage,
} from '@/lib/paymentStagePresets'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

export default function PaymentStagesTable({
  stages,
  onStagesChange,
  grandTotal = 0,
  amountEditable = false,
  showAddButton = true,
  showPercentageAlert = true,
  showAmountMismatchWarning = false,
  presetsDisabled = false,
  namePlaceholder = '請輸入階段名稱（例：開工前）',
}) {
  const totalPercentage = sumStagePercentages(stages)
  const isBalanced = totalPercentage === 100
  const stageTotal = sumStageAmounts(stages)

  const handleStageChange = (stageId, fields) => {
    onStagesChange(updatePaymentStage(stages, stageId, fields, amountEditable ? grandTotal : 0))
  }

  const handleApplyPreset = (preset) => {
    onStagesChange(applyPaymentStagePreset(preset, amountEditable ? grandTotal : 0))
  }

  const handleAddStage = () => {
    onStagesChange(addPaymentStage(stages, amountEditable ? grandTotal : 0))
  }

  const handleRemoveStage = (stageId) => {
    onStagesChange(removePaymentStage(stages, stageId))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {PAYMENT_STAGE_PRESETS.map(preset => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full px-3 font-medium"
            onClick={() => handleApplyPreset(preset)}
            disabled={presetsDisabled}
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
            {stages.map((stage, sIdx) => {
              const stageAmount = displayStageAmount(stage, grandTotal)
              return (
                <TableRow key={stage.id} className="border-border">
                  <TableCell className="px-3 py-2 text-center text-xs font-bold text-muted-foreground">
                    {sIdx + 1}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Input
                      type="text"
                      placeholder={namePlaceholder}
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
                  <TableCell className="px-3 py-2">
                    {amountEditable ? (
                      <Input
                        type="number"
                        className="text-right font-medium"
                        value={stage.amount || ''}
                        onChange={e => handleStageChange(stage.id, { amount: e.target.value })}
                        min="0"
                      />
                    ) : (
                      <span className="block text-right text-xs font-semibold whitespace-nowrap text-muted-foreground">
                        {fmt(stageAmount)}
                      </span>
                    )}
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
                        className="text-muted-foreground hover:text-destructive-muted-text disabled:opacity-30 disabled:hover:text-muted-foreground"
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

      <div className="space-y-2 md:hidden">
        {stages.map((stage, sIdx) => {
          const stageAmount = displayStageAmount(stage, grandTotal)
          return (
            <div
              key={stage.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
            >
              <span className="w-5 text-center text-xs font-bold text-muted-foreground">{sIdx + 1}</span>
              <Input
                type="text"
                placeholder={namePlaceholder}
                className="min-w-[160px] flex-1"
                value={stage.stage_name}
                onChange={e => handleStageChange(stage.id, { stage_name: e.target.value })}
                required
              />
              <div className="flex w-28 shrink-0 items-center gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  className="w-full text-right font-medium"
                  value={stage.percentage || ''}
                  onChange={e => handleStageChange(stage.id, { percentage: e.target.value })}
                  max="100"
                  required
                />
                <span className="text-sm font-medium text-muted-foreground">%</span>
              </div>
              {amountEditable ? (
                <Input
                  type="number"
                  className="w-28 shrink-0 text-right"
                  value={stage.amount || ''}
                  onChange={e => handleStageChange(stage.id, { amount: e.target.value })}
                  min="0"
                />
              ) : (
                <div className="w-28 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                  {fmt(stageAmount)}
                </div>
              )}
              <IconTooltip label="刪除此階段">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="刪除此階段"
                  onClick={() => handleRemoveStage(stage.id)}
                  disabled={stages.length <= 1}
                  className="ml-auto text-muted-foreground hover:text-destructive-muted-text disabled:opacity-30 disabled:hover:text-muted-foreground"
                >
                  <X />
                </Button>
              </IconTooltip>
            </div>
          )
        })}
      </div>

      {showAddButton && (
        <Button type="button" variant="outline" size="sm" className="font-semibold" onClick={handleAddStage}>
          <Plus data-icon="inline-start" />
          新增階段
        </Button>
      )}

      {showPercentageAlert && (
        <Alert variant={isBalanced ? 'success' : 'warning'}>
          <AlertDescription className="flex items-center justify-between text-xs font-medium text-current">
            <span>目前設定百分比總和：</span>
            <span className="text-sm font-bold">{totalPercentage} % / 100 %</span>
          </AlertDescription>
        </Alert>
      )}

      {showAmountMismatchWarning && grandTotal > 0 && Math.abs(stageTotal - grandTotal) > 1 && (
        <p className="text-xs text-status-warning-text">
          階段金額合計 {fmt(stageTotal)}，與總金額 {fmt(grandTotal)} 不一致
        </p>
      )}
    </div>
  )
}

export { addPaymentStage, fmt as formatStageMoney }
