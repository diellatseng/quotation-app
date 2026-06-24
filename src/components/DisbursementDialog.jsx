import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { DISBURSEMENT_PRESETS } from '@/lib/disbursementPresets'
import { saveDisbursementsForStage, sumDisbursements } from '@/lib/disbursements'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

const emptyRow = () => ({
  id: crypto.randomUUID(),
  name: '',
  amount: '',
  is_preset: false,
})

export default function DisbursementDialog({ open, stage, onOpenChange, onSaved }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !stage?.id) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('disbursements')
          .select('id, name, amount, is_preset')
          .eq('payment_stage_id', stage.id)
          .order('created_at', { ascending: true })

        if (error) throw error
        if (cancelled) return

        setRows(
          (data || []).map(item => ({
            id: item.id,
            name: item.name,
            amount: item.amount != null ? String(item.amount) : '',
            is_preset: item.is_preset,
          }))
        )
      } catch (err) {
        toast.error('載入代墊明細失敗：' + err.message, { duration: 6000 })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, stage?.id])

  const handleClose = () => {
    onOpenChange(false)
  }

  const addPreset = (preset) => {
    if (rows.some(row => row.name.trim() === preset.name)) {
      toast.warning(`「${preset.name}」已存在`)
      return
    }
    setRows(prev => [...prev, { ...emptyRow(), name: preset.name, is_preset: preset.is_preset }])
  }

  const addCustomRow = () => {
    setRows(prev => [...prev, emptyRow()])
  }

  const updateRow = (rowId, fields) => {
    setRows(prev => prev.map(row => (row.id === rowId ? { ...row, ...fields } : row)))
  }

  const removeRow = (rowId) => {
    setRows(prev => prev.filter(row => row.id !== rowId))
  }

  const handleSave = async () => {
    if (!stage?.id) return
    setSaving(true)
    try {
      await saveDisbursementsForStage(supabase, stage.id, rows)
      toast.success('代墊明細已儲存')
      onSaved?.()
      handleClose()
    } catch (err) {
      toast.error('儲存失敗：' + err.message, { duration: 6000 })
    } finally {
      setSaving(false)
    }
  }

  const total = sumDisbursements(rows.map(row => ({ amount: row.amount })))

  return (
    <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) handleClose() }}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>代墊明細</DialogTitle>
          <DialogDescription>
            {stage?.stage_name} · 請款金額 {fmt(stage?.amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {DISBURSEMENT_PRESETS.map(preset => (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                size="sm"
                className="font-semibold"
                onClick={() => addPreset(preset)}
              >
                <Plus data-icon="inline-start" />
                {preset.name}
              </Button>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="font-semibold"
              onClick={addCustomRow}
            >
              <Plus data-icon="inline-start" />
              自訂項目
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">載入中…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚無代墊項目，可從上方快速新增或加入自訂項目。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="h-auto px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    項目
                  </TableHead>
                  <TableHead className="h-auto w-36 px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    金額
                  </TableHead>
                  <TableHead className="h-auto w-10 px-2 py-2" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id} className="border-border hover:bg-muted/20">
                    <TableCell className="px-2 py-2">
                      <FieldGroup>
                        <Field>
                          <FieldLabel className="sr-only">項目名稱</FieldLabel>
                          <Input
                            value={row.name}
                            onChange={e => updateRow(row.id, { name: e.target.value })}
                            placeholder="項目名稱"
                          />
                        </Field>
                      </FieldGroup>
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <InputGroup>
                        <InputGroupAddon>
                          <InputGroupText>NT$</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          type="number"
                          min="0"
                          step="1"
                          value={row.amount}
                          onChange={e => updateRow(row.id, { amount: e.target.value })}
                          placeholder="0"
                        />
                      </InputGroup>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right">
                      <IconTooltip label="刪除此項">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="刪除此項"
                          onClick={() => removeRow(row.id)}
                        >
                          <X className="size-4" aria-hidden="true" />
                        </Button>
                      </IconTooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <p className="text-sm font-medium text-foreground">
            代墊合計：<span className="font-semibold">{fmt(total)}</span>
          </p>
        </div>

        <DialogFooter className="border-t border-border px-5 py-3">
          <Button variant="outline" size="sm" className="font-semibold" onClick={handleClose}>
            取消
          </Button>
          <Button
            variant="default"
            size="sm"
            className="font-semibold"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? '儲存中…' : '儲存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
