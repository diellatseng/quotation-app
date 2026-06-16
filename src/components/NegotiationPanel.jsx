// src/components/NegotiationPanel.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getIcon } from '@/lib/icons'

const PlusIcon = getIcon('add')

const fmt = (n) => `NT$ ${Number(n || 0).toLocaleString('zh-TW')}`

export default function NegotiationPanel({ quotationId, currentAmount, logs = [], onLogged }) {
  const [open, setOpen] = useState(false)
  const [newAmount, setNewAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newAmount) { toast.error('請輸入新報價金額', { duration: 6000 }); return }
    setSaving(true)
    const { error: err } = await supabase.from('negotiation_log').insert([{
      quotation_id: quotationId,
      old_amount: currentAmount,
      new_amount: Number(newAmount),
      notes,
      logged_by: user.id,
    }])
    if (err) { toast.error('記錄失敗：' + err.message, { duration: 6000 }); setSaving(false); return }

    // Update quotation amount + tag as negotiating
    await supabase.from('quotations').update({
      fee_amount: Number(newAmount),
      is_negotiating: true,
    }).eq('id', quotationId)

    toast.success('議價記錄已儲存')
    const savedAmount = Number(newAmount)
    const savedNotes = notes
    setNewAmount('')
    setNotes('')
    setOpen(false)
    setSaving(false)
    onLogged?.({ amount: savedAmount, notes: savedNotes })
  }

  return (
    <div>
      {/* Timeline */}
      {logs.length > 0 && (
        <div className="mb-5">
          <p className="text-base font-semibold text-foreground mb-3">議價歷程</p>
          <div className="flex flex-col gap-3">
            {logs.map((log, idx) => (
              <div key={log.id} className="flex gap-4 pl-4 border-l-2 border-border relative">
                <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-card ${idx === 0 ? 'bg-accent' : 'bg-border'}`} />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">
                    {new Date(log.logged_at).toLocaleString('zh-TW')}
                  </div>
                  <div className="flex gap-4 flex-wrap mb-1">
                    <span className="text-sm text-muted-foreground">
                      原報價：<s>{fmt(log.old_amount)}</s>
                    </span>
                    <span className="text-sm font-bold text-foreground inline-flex items-center gap-1">
                      <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
                      議價後：{fmt(log.new_amount)}
                    </span>
                  </div>
                  {log.notes && (
                    <p className="text-sm text-muted-foreground italic">
                      {log.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add entry */}
      <div className="border-t border-border pt-4 mt-2">
        {open ? (
          <Button type="button" variant="ghost" size="sm" className="font-semibold" onClick={() => setOpen(false)}>
            取消
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-semibold"
            onClick={() => setOpen(true)}
            aria-expanded={false}
          >
            {PlusIcon && <PlusIcon data-icon="inline-start" />}
            新增議價記錄
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 p-5 bg-muted rounded-md border border-border">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>目前報價</FieldLabel>
              <p className="text-lg font-bold text-foreground">{fmt(currentAmount)}</p>
            </Field>
            <Field>
              <FieldLabel htmlFor="neg-new-amount">議價後金額（未稅）</FieldLabel>
              <Input
                id="neg-new-amount"
                type="number"
                min="0"
                size="md"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                placeholder="輸入新金額"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="neg-notes">議價備註</FieldLabel>
              <Textarea
                id="neg-notes"
                className="resize-y"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="例如：業主要求減10%，同意調整"
                rows={3}
              />
            </Field>
          </FieldGroup>
          <div className="flex gap-3 mt-4">
            <Button type="submit" variant="default" size="md" className="font-semibold" disabled={saving}>
              {saving ? '儲存中…' : '確認議價'}
            </Button>
            <Button type="button" variant="ghost" size="md" className="font-semibold" onClick={() => setOpen(false)}>取消</Button>
          </div>
        </form>
      )}
    </div>
  )
}
