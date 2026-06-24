import { DISBURSEMENT_PRESETS } from '@/lib/disbursementPresets'
import { sumDisbursements } from '@/lib/disbursements'
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
import { toast } from 'sonner'

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

export function emptyDisbursementRow() {
  return {
    id: crypto.randomUUID(),
    name: '',
    amount: '',
    is_preset: false,
  }
}

export function disbursementsToRows(items = []) {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    amount: item.amount != null ? String(item.amount) : '',
    is_preset: item.is_preset,
  }))
}

export default function DisbursementEditor({ rows, onRowsChange, loading = false }) {
  const addPreset = (preset) => {
    if (rows.some(row => row.name.trim() === preset.name)) {
      toast.warning(`「${preset.name}」已存在`)
      return
    }
    onRowsChange([...rows, { ...emptyDisbursementRow(), name: preset.name, is_preset: preset.is_preset }])
  }

  const addCustomRow = () => {
    onRowsChange([...rows, emptyDisbursementRow()])
  }

  const updateRow = (rowId, fields) => {
    onRowsChange(rows.map(row => (row.id === rowId ? { ...row, ...fields } : row)))
  }

  const removeRow = (rowId) => {
    onRowsChange(rows.filter(row => row.id !== rowId))
  }

  const total = sumDisbursements(rows.map(row => ({ amount: row.amount })))

  return (
    <div className="space-y-3">
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
  )
}
