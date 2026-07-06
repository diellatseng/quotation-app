import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AppEmptyState } from '@/components/AppEmptyState'
import { AdminListSkeleton } from '@/components/skeletons'
import { Landmark, Plus } from 'lucide-react'

function emptyAccount() {
  return {
    label: '',
    bank_name: '',
    branch_name: '',
    account_name: '',
    account_number: '',
    notes: '',
    is_default: false,
    sort_order: 0,
  }
}

export default function BankAccountsAdmin() {
  const [accounts, setAccounts] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyAccount())
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const load = async () => {
    setFetchLoading(true)
    const { data } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true })
    setAccounts(data || [])
    setFetchLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setSelected(null)
    setForm(emptyAccount())
    setDialogOpen(true)
  }

  const openEdit = (account) => {
    setSelected(account)
    setForm(account)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
    setForm(emptyAccount())
  }

  const clearDefaultOthers = async (keepId) => {
    const others = accounts.filter(a => a.is_default && a.id !== keepId)
    await Promise.all(
      others.map(a => supabase.from('bank_accounts').update({ is_default: false }).eq('id', a.id))
    )
  }

  const saveAccount = async () => {
    if (!(form.label ?? '').trim() || !(form.bank_name ?? '').trim() || !(form.account_name ?? '').trim() || !(form.account_number ?? '').trim()) {
      toast.warning('請填寫識別名稱、銀行、戶名與帳號')
      return
    }
    setLoading(true)
    const payload = {
      label: form.label.trim(),
      bank_name: form.bank_name.trim(),
      branch_name: (form.branch_name ?? '').trim() || null,
      account_name: form.account_name.trim(),
      account_number: form.account_number.trim(),
      notes: (form.notes ?? '').trim() || null,
      is_default: form.is_default,
      sort_order: Number(form.sort_order) || 0,
    }

    if (selected) {
      const { error } = await supabase.from('bank_accounts').update(payload).eq('id', selected.id)
      if (error) {
        toast.error('儲存失敗：' + error.message, { duration: 6000 })
        setLoading(false)
        return
      }
      if (payload.is_default) await clearDefaultOthers(selected.id)
      toast.success('銀行帳戶已更新')
    } else {
      const { data, error } = await supabase.from('bank_accounts').insert([payload]).select().single()
      if (error) {
        toast.error('新增失敗：' + error.message, { duration: 6000 })
        setLoading(false)
        return
      }
      if (payload.is_default && data) await clearDefaultOthers(data.id)
      toast.success('銀行帳戶已新增')
    }

    await load()
    closeDialog()
    setLoading(false)
  }

  const deleteAccount = async () => {
    if (!selected) return
    await supabase.from('bank_accounts').delete().eq('id', selected.id)
    toast.success('已刪除')
    setShowDeleteDialog(false)
    closeDialog()
    load()
  }

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除銀行帳戶</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{selected?.label}」嗎？已使用此帳戶的請款單將失去關聯。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteAccount}>刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
            <DialogTitle>{selected ? '編輯銀行帳戶' : '新增銀行帳戶'}</DialogTitle>
            <DialogDescription>
              {selected
                ? `識別名稱：${selected.label}`
                : '填寫帳戶資訊後，建立請款時可選擇此帳戶。'}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>識別名稱</FieldLabel>
                <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="例：工程收款帳戶" />
              </Field>
              <Field>
                <FieldLabel>銀行名稱</FieldLabel>
                <Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>分行</FieldLabel>
                <Input value={form.branch_name ?? ''} onChange={e => setForm(f => ({ ...f, branch_name: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>戶名</FieldLabel>
                <Input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>帳號</FieldLabel>
                <Input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>備註</FieldLabel>
                <Textarea value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </Field>
              <Field>
                <FieldLabel>排序</FieldLabel>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
              </Field>
              <div className="flex items-center gap-2 pt-6">
                <Checkbox
                  id="bank_default"
                  checked={form.is_default}
                  onCheckedChange={checked => setForm(f => ({ ...f, is_default: checked === true }))}
                />
                <Label htmlFor="bank_default" className="cursor-pointer">設為預設帳戶</Label>
              </div>
            </FieldGroup>
          </div>
          <DialogFooter className="shrink-0 border-t border-border px-5 py-3">
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              {selected ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="font-semibold"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  刪除
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="font-semibold" onClick={closeDialog}>
                  取消
                </Button>
                <Button variant="default" size="sm" className="font-semibold" onClick={saveAccount} disabled={loading}>
                  {loading ? '儲存中…' : '儲存'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="font-semibold">銀行帳戶</CardTitle>
          <Button variant="default" size="sm" className="font-semibold" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            新增
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          {fetchLoading ? (
            <AdminListSkeleton />
          ) : accounts.length === 0 ? (
            <AppEmptyState icon={Landmark} title="尚無銀行帳戶" description="新增後可在建立請款時選擇" />
          ) : (
            accounts.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => openEdit(a)}
                className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover"
              >
                <div className="font-medium text-foreground">{a.label}</div>
                <div className="text-xs text-muted-foreground">
                  {a.bank_name} · {a.account_number}
                </div>
                {a.is_default && (
                  <div className="mt-1 text-xs font-medium text-primary">預設</div>
                )}
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}
