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
import { AppEmptyState } from '@/components/AppEmptyState'
import { AdminListSkeleton } from '@/components/skeletons'
import { Building2, Plus } from 'lucide-react'

function emptyProfile() {
  return {
    name: '',
    address: '',
    phone: '',
    fax: '',
    email: '',
    is_default: false,
  }
}

export default function CompanyProfilesAdmin() {
  const [profiles, setProfiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyProfile())
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const load = async () => {
    setFetchLoading(true)
    const { data } = await supabase
      .from('company_profiles')
      .select('*')
      .order('name', { ascending: true })
    setProfiles(data || [])
    setFetchLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setSelected(null)
    setForm(emptyProfile())
    setDialogOpen(true)
  }

  const openEdit = (profile) => {
    setSelected(profile)
    setForm(profile)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
    setForm(emptyProfile())
  }

  const clearDefaultOthers = async (keepId) => {
    const others = profiles.filter(p => p.is_default && p.id !== keepId)
    await Promise.all(
      others.map(p => supabase.from('company_profiles').update({ is_default: false }).eq('id', p.id))
    )
  }

  const saveProfile = async () => {
    if (!(form.name ?? '').trim()) {
      toast.warning('請填寫公司名稱')
      return
    }
    setLoading(true)
    const name = form.name.trim()
    const payload = {
      label: name,
      name,
      address: (form.address ?? '').trim() || null,
      phone: (form.phone ?? '').trim() || null,
      fax: (form.fax ?? '').trim() || null,
      email: (form.email ?? '').trim() || null,
      is_default: form.is_default,
    }

    if (selected) {
      const { error } = await supabase.from('company_profiles').update(payload).eq('id', selected.id)
      if (error) {
        toast.error('儲存失敗：' + error.message, { duration: 6000 })
        setLoading(false)
        return
      }
      if (payload.is_default) await clearDefaultOthers(selected.id)
      toast.success('公司抬頭已更新')
    } else {
      const { data, error } = await supabase.from('company_profiles').insert([payload]).select().single()
      if (error) {
        toast.error('新增失敗：' + error.message, { duration: 6000 })
        setLoading(false)
        return
      }
      if (payload.is_default && data) await clearDefaultOthers(data.id)
      toast.success('公司抬頭已新增')
    }

    await load()
    closeDialog()
    setLoading(false)
  }

  const deleteProfile = async () => {
    if (!selected) return
    await supabase.from('company_profiles').delete().eq('id', selected.id)
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
            <AlertDialogTitle>刪除公司抬頭</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{selected?.name}」嗎？已使用此抬頭的案件將失去關聯。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteProfile}>刪除</AlertDialogAction>
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
            <DialogTitle>{selected ? '編輯公司抬頭' : '新增公司抬頭'}</DialogTitle>
            <DialogDescription>
              {selected
                ? selected.name
                : '填寫公司資訊後，建立案件時可選擇此抬頭。'}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel>公司名稱</FieldLabel>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>地址</FieldLabel>
                <Input value={form.address ?? ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>電話</FieldLabel>
                <Input value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>傳真</FieldLabel>
                <Input value={form.fax ?? ''} onChange={e => setForm(f => ({ ...f, fax: e.target.value }))} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel>Email</FieldLabel>
                <Input value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </Field>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="company_default"
                  checked={form.is_default}
                  onCheckedChange={checked => setForm(f => ({ ...f, is_default: checked === true }))}
                />
                <Label htmlFor="company_default" className="cursor-pointer">設為預設抬頭</Label>
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
                <Button variant="default" size="sm" className="font-semibold" onClick={saveProfile} disabled={loading}>
                  {loading ? '儲存中…' : '儲存'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="font-semibold">公司抬頭</CardTitle>
          <Button variant="default" size="sm" className="font-semibold" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            新增
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          {fetchLoading ? (
            <AdminListSkeleton />
          ) : profiles.length === 0 ? (
            <AppEmptyState icon={Building2} title="尚無公司抬頭" description="新增後可在建立案件時選擇" />
          ) : (
            profiles.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => openEdit(p)}
                className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover"
              >
                <div className="font-medium text-foreground">{p.name}</div>
                {p.phone && (
                  <div className="text-sm text-foreground">{p.phone}</div>
                )}
                {p.address && (
                  <div className="text-xs text-muted-foreground">{p.address}</div>
                )}
                {p.is_default && (
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
