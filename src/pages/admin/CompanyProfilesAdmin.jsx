import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AppEmptyState } from '@/components/AppEmptyState'
import { AdminDefaultBadge } from '@/components/admin/AdminDefaultBadge'
import { AdminListSkeleton } from '@/components/skeletons'
import {
  PROFILE_TYPE_COMPANY,
  PROFILE_TYPE_INDIVIDUAL,
  buildIssuerProfilePayload,
  companyProfileLabel,
  companyProfileTypeLabel,
  validateIssuerProfileForm,
} from '@/lib/companyProfile'
import { Building2, Plus, UserRound } from 'lucide-react'

function emptyProfile(profileType = PROFILE_TYPE_COMPANY) {
  return {
    profile_type: profileType,
    name: '',
    honorific: '先生',
    national_id: '',
    address: '',
    phone: '',
    fax: '',
    email: '',
    is_default: false,
  }
}

function profileDialogTitle(selected, createType) {
  const type = selected?.profile_type || createType
  const action = selected ? '編輯' : '新增'
  return type === PROFILE_TYPE_INDIVIDUAL ? `${action}個人抬頭` : `${action}公司抬頭`
}

export default function CompanyProfilesAdmin() {
  const [profiles, setProfiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [createType, setCreateType] = useState(PROFILE_TYPE_COMPANY)
  const [form, setForm] = useState(emptyProfile())
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const dialogProfileType = selected?.profile_type || createType
  const isIndividual = dialogProfileType === PROFILE_TYPE_INDIVIDUAL

  const load = async () => {
    setFetchLoading(true)
    const { data } = await supabase
      .from('company_profiles')
      .select('*')
      .order('profile_type', { ascending: true })
      .order('name', { ascending: true })
    setProfiles(data || [])
    setFetchLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = (profileType) => {
    setSelected(null)
    setCreateType(profileType)
    setForm(emptyProfile(profileType))
    setDialogOpen(true)
  }

  const openEdit = (profile) => {
    setSelected(profile)
    setCreateType(profile.profile_type || PROFILE_TYPE_COMPANY)
    setForm({
      profile_type: profile.profile_type || PROFILE_TYPE_COMPANY,
      name: profile.name || '',
      honorific: profile.honorific || '先生',
      national_id: profile.national_id || '',
      address: profile.address || '',
      phone: profile.phone || '',
      fax: profile.fax || '',
      email: profile.email || '',
      is_default: !!profile.is_default,
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
    setForm(emptyProfile())
    setCreateType(PROFILE_TYPE_COMPANY)
  }

  const clearDefaultOthers = async (keepId, profileType) => {
    const others = profiles.filter(
      p => p.is_default && p.id !== keepId && (p.profile_type || PROFILE_TYPE_COMPANY) === profileType,
    )
    await Promise.all(
      others.map(p => supabase.from('company_profiles').update({ is_default: false }).eq('id', p.id)),
    )
  }

  const saveProfile = async () => {
    const profileType = selected?.profile_type || createType
    const validationError = validateIssuerProfileForm(form, profileType)
    if (validationError) {
      toast.warning(validationError)
      return
    }

    setLoading(true)
    const payload = buildIssuerProfilePayload(form, profileType)

    if (selected) {
      const { error } = await supabase.from('company_profiles').update(payload).eq('id', selected.id)
      if (error) {
        toast.error('儲存失敗：' + error.message, { duration: 6000 })
        setLoading(false)
        return
      }
      if (payload.is_default) await clearDefaultOthers(selected.id, profileType)
      toast.success(isIndividual ? '個人抬頭已更新' : '公司抬頭已更新')
    } else {
      const { data, error } = await supabase.from('company_profiles').insert([payload]).select().single()
      if (error) {
        toast.error('新增失敗：' + error.message, { duration: 6000 })
        setLoading(false)
        return
      }
      if (payload.is_default && data) await clearDefaultOthers(data.id, profileType)
      toast.success(isIndividual ? '個人抬頭已新增' : '公司抬頭已新增')
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
            <AlertDialogTitle>刪除開立抬頭</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{companyProfileLabel(selected)}」嗎？已使用此抬頭的案件將失去關聯。
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
            <DialogTitle>{profileDialogTitle(selected, createType)}</DialogTitle>
            <DialogDescription className="text-foreground">
              {selected
                ? companyProfileLabel(selected)
                : (isIndividual
                    ? '填寫個人資訊後，建立案件時可選擇以此名義開立報價。'
                    : '填寫公司資訊後，建立案件時可選擇此抬頭。')}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {isIndividual ? (
                <>
                  <Field className="sm:col-span-2">
                    <FieldLabel className="text-base font-semibold text-foreground">姓名</FieldLabel>
                    <Input
                      className="min-h-10 text-base font-medium"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="王小明"
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel className="text-base font-semibold text-foreground">稱謂</FieldLabel>
                    <RadioGroup
                      value={form.honorific}
                      onValueChange={value => setForm(f => ({ ...f, honorific: value }))}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="先生" id="honorific-mr" />
                        <Label htmlFor="honorific-mr" className="cursor-pointer text-base font-medium text-foreground">
                          先生
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="小姐" id="honorific-ms" />
                        <Label htmlFor="honorific-ms" className="cursor-pointer text-base font-medium text-foreground">
                          小姐
                        </Label>
                      </div>
                    </RadioGroup>
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel className="text-base font-semibold text-foreground">地址</FieldLabel>
                    <Input
                      className="min-h-10 text-base font-medium"
                      value={form.address ?? ''}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel className="text-base font-semibold text-foreground">身分證字號</FieldLabel>
                    <Input
                      className="min-h-10 max-w-xs text-base font-medium uppercase"
                      value={form.national_id ?? ''}
                      onChange={e => setForm(f => ({ ...f, national_id: e.target.value.toUpperCase() }))}
                      placeholder="A123456789"
                      autoComplete="off"
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field className="sm:col-span-2">
                    <FieldLabel className="text-base font-semibold text-foreground">公司名稱</FieldLabel>
                    <Input
                      className="min-h-10 text-base font-medium"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <FieldLabel className="text-base font-semibold text-foreground">地址</FieldLabel>
                    <Input
                      className="min-h-10 text-base font-medium"
                      value={form.address ?? ''}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    />
                  </Field>
                </>
              )}
              <Field>
                <FieldLabel className="text-base font-semibold text-foreground">電話</FieldLabel>
                <Input
                  className="min-h-10 text-base font-medium"
                  value={form.phone ?? ''}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel className="text-base font-semibold text-foreground">傳真</FieldLabel>
                <Input
                  className="min-h-10 text-base font-medium"
                  value={form.fax ?? ''}
                  onChange={e => setForm(f => ({ ...f, fax: e.target.value }))}
                />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel className="text-base font-semibold text-foreground">Email</FieldLabel>
                <Input
                  className="min-h-10 text-base font-medium"
                  type="email"
                  value={form.email ?? ''}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </Field>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="issuer_default"
                  checked={form.is_default}
                  onCheckedChange={checked => setForm(f => ({ ...f, is_default: checked === true }))}
                />
                <Label htmlFor="issuer_default" className="cursor-pointer text-base font-medium text-foreground">
                  設為預設{isIndividual ? '個人' : '公司'}抬頭
                </Label>
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
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-semibold">開立抬頭</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="font-semibold" onClick={() => openCreate(PROFILE_TYPE_COMPANY)}>
              <Plus data-icon="inline-start" />
              公司
            </Button>
            <Button variant="outline" size="sm" className="font-semibold" onClick={() => openCreate(PROFILE_TYPE_INDIVIDUAL)}>
              <UserRound data-icon="inline-start" />
              個人
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {fetchLoading ? (
            <AdminListSkeleton />
          ) : profiles.length === 0 ? (
            <AppEmptyState icon={Building2} title="尚無開立抬頭" description="新增公司或個人抬頭後，可在建立案件時選擇" />
          ) : (
            profiles.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => openEdit(p)}
                className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{companyProfileLabel(p)}</span>
                  <Badge variant="outline" className="rounded-full text-xs">
                    {companyProfileTypeLabel(p.profile_type)}
                  </Badge>
                  {p.is_default && <AdminDefaultBadge />}
                </div>
                {p.phone && (
                  <div className="text-sm text-foreground">{p.phone}</div>
                )}
                {p.address && (
                  <div className="text-sm text-foreground">{p.address}</div>
                )}
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}
