import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import PaymentStageEditor, { grandTotalFromFee, initialManualStageState } from './PaymentStageEditor'
import {
  formatManualPaymentValidationMessage,
  importPaymentStagesFromQuotation,
  saveManualPaymentStages,
  validateManualPaymentSetup,
} from '@/lib/paymentStages'
import { stageAmountFromPercentage } from '@/lib/paymentStagePresets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'
import { FileText, PenLine } from 'lucide-react'

const fmt = (n) => (n != null && n !== '' ? `NT$ ${Number(n).toLocaleString('zh-TW')}` : '—')

function quotationLabel(q) {
  const ver = q.version > 1 ? ` v${q.version}` : ''
  return `${q.quote_number}${ver} · ${q.status}`
}

export default function InvoiceSetupDialog({
  open,
  onOpenChange,
  projectId,
  project,
  quotations,
  onSuccess,
}) {
  const [mode, setMode] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedQuotationId, setSelectedQuotationId] = useState('')
  const [previewStages, setPreviewStages] = useState([])
  const [manual, setManual] = useState(() => initialManualStageState(project))

  const usableQuotations = useMemo(
    () => quotations.filter(q => q.status !== '已刪除'),
    [quotations],
  )

  useEffect(() => {
    if (!open) return
    setMode(null)
    setSelectedQuotationId(usableQuotations[0]?.id || '')
    setPreviewStages([])
    setManual(initialManualStageState(project))
  }, [open, project, usableQuotations])

  useEffect(() => {
    if (mode !== 'quotation' || !selectedQuotationId) return

    let cancelled = false

    ;(async () => {
      const quotation = usableQuotations.find(q => q.id === selectedQuotationId)
      if (!quotation) return

      const { data: stages, error } = await supabase
        .from('payment_stages')
        .select('stage_name, percentage, amount, sort_order')
        .eq('quotation_id', selectedQuotationId)
        .order('sort_order', { ascending: true })

      if (cancelled) return
      if (error) {
        toast.error('載入付款階段失敗：' + error.message)
        return
      }

      const grand = grandTotalFromFee(quotation.fee_amount, quotation.tax_included)
      setPreviewStages((stages || []).map(st => ({
        ...st,
        amount: st.amount != null
          ? Number(st.amount)
          : stageAmountFromPercentage(grand, st.percentage),
      })))
    })()

    return () => { cancelled = true }
  }, [mode, selectedQuotationId, usableQuotations])

  const selectedQuotation = usableQuotations.find(q => q.id === selectedQuotationId)

  const manualValidation = useMemo(
    () => validateManualPaymentSetup({
      contractTotal: manual.contractTotal,
      taxIncluded: manual.taxIncluded,
      stages: manual.stages,
    }),
    [manual.contractTotal, manual.taxIncluded, manual.stages],
  )

  const handleSaveQuotation = async () => {
    if (!selectedQuotationId) {
      toast.warning('請選擇報價單')
      return
    }
    if (!previewStages.length) {
      toast.warning('此報價單尚無付款階段，請先完成報價設定')
      return
    }

    setSaving(true)
    try {
      await importPaymentStagesFromQuotation(supabase, projectId, selectedQuotationId)
      toast.success('已從報價單匯入付款階段')
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || '匯入失敗', { duration: 6000 })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveManual = async () => {
    if (!manualValidation.valid) {
      toast.warning(formatManualPaymentValidationMessage(manualValidation.missing))
      return
    }

    setSaving(true)
    try {
      await saveManualPaymentStages(supabase, projectId, manual.stages, {
        contractTotal: manual.contractTotal,
        taxIncluded: manual.taxIncluded,
      })
      toast.success('付款階段已建立')
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || '儲存失敗', { duration: 6000 })
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    setMode(null)
    setPreviewStages([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>
            {mode === null && '設定請款付款階段'}
            {mode === 'quotation' && '從報價單匯入'}
            {mode === 'manual' && '手動建立付款階段'}
          </DialogTitle>
            <DialogDescription className="text-foreground">
              {mode === null && '選擇從現有報價單匯入，或手動建立以支援進行中案件。'}
            {mode === 'quotation' && '匯入後可為各階段建立請款單；不會因報價修改而刪除。'}
            {mode === 'manual' && '自行設定合約金額與各階段請款金額，適用於系統外已進行中的案件。'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {mode === null && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                className={`cursor-pointer shadow-sm transition-all hover:ring-2 hover:ring-primary/30 ${usableQuotations.length === 0 ? 'opacity-60' : ''}`}
                onClick={() => usableQuotations.length > 0 && setMode('quotation')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="size-4 text-primary" />
                    從報價單建立
                  </CardTitle>
                  <CardDescription className="text-foreground">
                    使用報價單的付款階段與合約金額建立請款。
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-foreground">
                  {usableQuotations.length > 0
                    ? `本案件有 ${usableQuotations.length} 份報價可選`
                    : '尚無報價單，請先建立報價或改用手動建立'}
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer shadow-sm transition-all hover:ring-2 hover:ring-primary/30"
                onClick={() => setMode('manual')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <PenLine className="size-4 text-primary" />
                    從零開始建立
                  </CardTitle>
                  <CardDescription className="text-foreground">
                    手動輸入合約金額與付款階段，不需報價單。
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-foreground">
                  適用於已在進行中、尚未在本系統報價的案件
                </CardContent>
              </Card>
            </div>
          )}

          {mode === 'quotation' && (
            <div className="space-y-4">
              <Field>
                <FieldLabel>選擇報價單</FieldLabel>
                <Select value={selectedQuotationId || ''} onValueChange={setSelectedQuotationId}>
                  <SelectTrigger className="w-full font-medium">
                    {selectedQuotation ? quotationLabel(selectedQuotation) : '請選擇'}
                  </SelectTrigger>
                  <SelectContent>
                    {usableQuotations.map(q => (
                      <SelectItem key={q.id} value={q.id}>
                        {quotationLabel(q)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedQuotation && (
                <p className="text-sm font-medium text-foreground">
                  合約金額 {fmt(grandTotalFromFee(selectedQuotation.fee_amount, selectedQuotation.tax_included))}
                </p>
              )}

              {previewStages.length > 0 ? (
                <div className="rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-foreground">
                        <th className="p-3 font-semibold">階段</th>
                        <th className="p-3 text-right font-semibold">比例</th>
                        <th className="p-3 text-right font-semibold">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewStages.map((st, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium">{st.stage_name}</td>
                          <td className="p-3 text-right text-foreground">{st.percentage}%</td>
                          <td className="p-3 text-right font-medium">{fmt(st.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : selectedQuotationId && (
                <p className="text-sm text-status-warning-text">此報價單尚無付款階段，請先完成報價設定。</p>
              )}
            </div>
          )}

          {mode === 'manual' && (
            <PaymentStageEditor
              contractTotal={manual.contractTotal}
              taxIncluded={manual.taxIncluded}
              onContractTotalChange={value => setManual(m => ({ ...m, contractTotal: value }))}
              onTaxIncludedChange={checked => setManual(m => ({ ...m, taxIncluded: checked }))}
              stages={manual.stages}
              onStagesChange={stages => setManual(m => ({ ...m, stages }))}
            />
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-3">
          {mode === null ? (
            <Button variant="outline" size="sm" className="font-semibold" onClick={() => onOpenChange(false)}>
              取消
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="font-semibold" onClick={handleBack} disabled={saving}>
                返回
              </Button>
              <Button
                variant="default"
                size="sm"
                className="font-semibold"
                disabled={
                  saving
                  || (mode === 'manual' && !manualValidation.valid)
                  || (mode === 'quotation' && (!selectedQuotationId || !previewStages.length))
                }
                onClick={mode === 'quotation' ? handleSaveQuotation : handleSaveManual}
              >
                {saving ? '儲存中…' : (mode === 'quotation' ? '匯入付款階段' : '建立付款階段')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
