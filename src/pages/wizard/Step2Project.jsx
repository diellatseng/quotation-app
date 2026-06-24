// src/pages/wizard/Step2Project.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { companyProfileLabel, pickDefaultCompanyProfile } from '../../lib/companyProfile'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

export default function Step2Project({
  data,
  update,
  companyProfileLocked,
  title = '步驟 2：工程資料',
  description = '請選擇公司抬頭並輸入工程基本資料。',
}) {
  const [companyProfiles, setCompanyProfiles] = useState([])

  useEffect(() => {
    supabase
      .from('company_profiles')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true })
      .then(({ data: profiles }) => {
        const list = profiles || []
        setCompanyProfiles(list)
        if (!companyProfileLocked && !data.company_profile_id && list.length > 0) {
          const picked = pickDefaultCompanyProfile(list)
          if (picked) update({ company_profile_id: picked.id })
        }
      })
  }, [companyProfileLocked]) // eslint-disable-line

  const selectedProfile = companyProfiles.find(p => p.id === data.company_profile_id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold">公司抬頭</CardTitle>
          <CardDescription>
            將套用於本案件所有文件，包含報價單、請款單等 PDF 上的公司名稱、地址與聯絡資訊。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companyProfileLocked ? (
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                {selectedProfile ? companyProfileLabel(selectedProfile) : '未設定公司抬頭'}
              </p>
              {selectedProfile && (
                <p className="text-muted-foreground">{selectedProfile.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                沿用案件設定；此抬頭會顯示於報價單、請款單等所有 PDF。如需變更請至案件概覽調整。
              </p>
            </div>
          ) : companyProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              尚無公司抬頭，請先到管理介面 → 公司抬頭 新增。
            </p>
          ) : (
            <Field>
              <FieldLabel htmlFor="company_profile">選擇公司抬頭</FieldLabel>
              <Select
                value={data.company_profile_id || ''}
                onValueChange={value => update({ company_profile_id: value })}
              >
                <SelectTrigger id="company_profile" className="w-full font-medium">
                  {selectedProfile ? companyProfileLabel(selectedProfile) : '請選擇'}
                </SelectTrigger>
                <SelectContent>
                  {companyProfiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {companyProfileLabel(profile)} — {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold">工程基本資料</CardTitle>
        </CardHeader>
        <CardContent>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>工程名稱</FieldLabel>
            <Input
              type="text"
              value={data.project_name || ''}
              onChange={e => update({ project_name: e.target.value })}
              placeholder="可稍後再填，例如：住宅新建工程"
            />
          </Field>
          <Field>
            <FieldLabel>起造人 / 業主</FieldLabel>
            <Input
              type="text"
              value={data.project_owner || ''}
              onChange={e => update({ project_owner: e.target.value })}
              placeholder="例如：王小明"
            />
          </Field>
          <Field>
            <FieldLabel>建造執照字號</FieldLabel>
            <Input
              type="text"
              value={data.building_permit || ''}
              onChange={e => update({ building_permit: e.target.value })}
              placeholder="例如：(112)高市工建築字第XXXXX號"
            />
          </Field>
          <Field>
            <FieldLabel>地號資訊</FieldLabel>
            <Input
              type="text"
              value={data.land_section || ''}
              onChange={e => update({ land_section: e.target.value })}
              placeholder="例如：XX區XX段XX地號"
            />
          </Field>
          <Field className="md:col-span-2">
            <FieldLabel>工程規模 / 備註說明</FieldLabel>
            <Input
              type="text"
              value={data.project_scale || ''}
              onChange={e => update({ project_scale: e.target.value })}
              placeholder="例如：地上5層，地下1層，RC構造，總樓地板面積..."
            />
          </Field>
        </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
