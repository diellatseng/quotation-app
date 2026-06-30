import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import PaymentStagesTable, { formatStageMoney } from '@/components/PaymentStagesTable'
import {
  baseFeeFromGrand,
  defaultPaymentStages,
  grandTotalFromFee,
  recalcStageAmountsFromGrandTotal,
} from '@/lib/paymentStagePresets'

export default function PaymentStageEditor({
  contractTotal,
  taxIncluded,
  onContractTotalChange,
  onTaxIncludedChange,
  stages,
  onStagesChange,
  showContractFields = true,
}) {
  const effectiveGrandTotal = grandTotalFromFee(contractTotal, taxIncluded)

  const recalcStageAmounts = (nextBaseTotal, nextTaxIncluded) => {
    const nextGrand = grandTotalFromFee(nextBaseTotal, nextTaxIncluded)
    onStagesChange(recalcStageAmountsFromGrandTotal(stages, nextGrand))
  }

  return (
    <div className="space-y-4">
      {showContractFields && (
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="py-4">
            <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="invoice_contract_total">合約金額（未稅）</FieldLabel>
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
                      recalcStageAmounts(nextTotal, taxIncluded)
                    }}
                    placeholder="0"
                  />
                </InputGroup>
              </Field>
              <Field orientation="horizontal" className="items-center gap-3 sm:pt-7">
                <div className="flex-1">
                  <FieldLabel htmlFor="invoice_tax_included" className="mb-0 cursor-pointer">
                    報價含稅
                  </FieldLabel>
                  <p className="text-xs text-muted-foreground">外加 5% 營業稅計入合約總額</p>
                </div>
                <Switch
                  id="invoice_tax_included"
                  checked={!!taxIncluded}
                  onCheckedChange={checked => {
                    onTaxIncludedChange(checked)
                    recalcStageAmounts(contractTotal, checked)
                  }}
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-between border-t border-border text-sm font-semibold">
            <span className="text-muted-foreground">
              總計應收金額 ({taxIncluded ? '含稅' : '未稅'})
            </span>
            <span className="text-lg font-bold text-primary">{formatStageMoney(effectiveGrandTotal)}</span>
          </CardFooter>
        </Card>
      )}

      <PaymentStagesTable
        stages={stages}
        onStagesChange={onStagesChange}
        grandTotal={effectiveGrandTotal}
        amountEditable
        showAmountMismatchWarning
        presetsDisabled={!(effectiveGrandTotal > 0)}
        namePlaceholder="例：開工前"
      />
    </div>
  )
}

export function initialManualStageState(project) {
  const taxIncluded = !!project?.tax_included
  const base = baseFeeFromGrand(project?.total_amount, taxIncluded)
  const effectiveGrand = grandTotalFromFee(base, taxIncluded)
  return {
    contractTotal: base || '',
    taxIncluded,
    stages: defaultPaymentStages(effectiveGrand),
  }
}

export { grandTotalFromFee }
