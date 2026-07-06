// src/pages/wizard/Step2Project.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { companyProfileLabel, pickDefaultCompanyProfile } from '../../lib/companyProfile'
import {
  buildingPermitFieldsFromParts,
  buildingPermitPrefixFromLand,
  formatBuildingPermit,
  formatLandSection,
  formatProjectScale,
  landPartsFromData,
  landSectionFieldsFromParts,
  isLandPartsComplete,
  permitPartsFromData,
  projectScaleFieldsFromParts,
  sanitizeParcelInput,
  scalePartsFromData,
  structuredFixedTextClassName,
  structuredInputClassName,
} from '../../lib/projectFields'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const CITY_TYPE_OPTIONS = ['市', '縣']

/** Input width by max character count (CJK + padding). */
const COMPACT_INPUT_WIDTH = {
  2: 'w-[3.25rem]',
  3: 'w-[4rem]',
  4: 'w-[5rem]',
  6: 'w-[6.5rem]',
  8: 'w-[8rem]',
  12: 'w-[10rem]',
}

function compactInputClass(maxChars) {
  return cn(structuredInputClassName, 'shrink-0', COMPACT_INPUT_WIDTH[maxChars] ?? 'w-auto')
}

function StructuredSection({ title, required, preview, children, className }) {
  return (
    <section className={cn('rounded-lg border border-border p-4', className)}>
      <h3 className="mb-3 text-base font-semibold text-foreground">
        {title}
        {required ? (
          <span className="text-destructive" aria-hidden="true"> *</span>
        ) : null}
        ：
        <span className="font-medium">{preview || '—'}</span>
      </h3>
      {children}
    </section>
  )
}

function preventEnterSubmit(e) {
  if (e.key === 'Enter') e.preventDefault()
}

function StructuredFieldRow({ before, after, className, children, ...props }) {
  return (
    <div className={cn('flex min-h-10 items-center gap-2', className)} {...props}>
      {before ? <span className={structuredFixedTextClassName}>{before}</span> : null}
      {children}
      {after ? <span className={structuredFixedTextClassName}>{after}</span> : null}
    </div>
  )
}

export default function Step2Project({
  data,
  update,
  companyProfileLocked,
  title = '步驟 2：工程資料',
  description = '請選擇公司抬頭並輸入工程基本資料。固定文字已填好，您只需輸入會變動的部分。',
}) {
  const [companyProfiles, setCompanyProfiles] = useState([])

  const landParts = landPartsFromData(data)
  const composedLandSection = formatLandSection(landParts)
  const landComplete = isLandPartsComplete(landParts)

  const permitParts = permitPartsFromData(data)
  const permitCityPrefix = buildingPermitPrefixFromLand(landParts)
  const composedBuildingPermit = formatBuildingPermit({
    ...permitParts,
    cityPrefix: permitCityPrefix,
  })
  const scaleParts = scalePartsFromData(data)
  const composedProjectScale = formatProjectScale(scaleParts)

  useEffect(() => {
    supabase
      .from('company_profiles')
      .select('*')
      .order('name', { ascending: true })
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

  const updateLand = (partial) => {
    const nextLand = { ...landParts, ...partial }
    update({
      ...landSectionFieldsFromParts(nextLand),
      ...buildingPermitFieldsFromParts(permitParts, nextLand),
    })
  }

  const updatePermit = (partial) => {
    update(buildingPermitFieldsFromParts({ ...permitParts, ...partial }, landParts))
  }

  const updateScale = (partial) => {
    update(projectScaleFieldsFromParts({ ...scaleParts, ...partial }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-foreground">{description}</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold text-foreground">公司抬頭</CardTitle>
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
                <p className="text-foreground">{selectedProfile.name}</p>
              )}
            </div>
          ) : companyProfiles.length === 0 ? (
            <p className="text-sm text-foreground">
              尚無公司抬頭，請先到管理介面 → 公司抬頭 新增。
            </p>
          ) : (
            <Field>
              <FieldLabel htmlFor="company_profile" className="text-foreground">選擇公司抬頭</FieldLabel>
              <Select
                value={data.company_profile_id || ''}
                onValueChange={value => update({ company_profile_id: value })}
              >
                <SelectTrigger id="company_profile" className="min-h-10 w-full text-base font-medium">
                  {selectedProfile ? companyProfileLabel(selectedProfile) : '請選擇'}
                </SelectTrigger>
                <SelectContent>
                  {companyProfiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {companyProfileLabel(profile)}
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
          <CardTitle className="font-semibold text-foreground">工程基本資料</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel className="text-base font-semibold text-foreground">工程名稱（選填）</FieldLabel>
                <Input
                  type="text"
                  className={structuredInputClassName}
                  value={data.marketing_name || ''}
                  onChange={e => update({ marketing_name: e.target.value })}
                  onKeyDown={preventEnterSubmit}
                  placeholder="住宅新建工程"
                />
              </Field>

              <Field>
                <FieldLabel className="text-base font-semibold text-foreground">起造人 / 業主</FieldLabel>
                <Input
                  type="text"
                  className={structuredInputClassName}
                  value={data.project_owner || ''}
                  onChange={e => update({ project_owner: e.target.value })}
                  onKeyDown={preventEnterSubmit}
                  placeholder="王小明"
                />
              </Field>
            </div>

            <StructuredSection title="地號" required preview={composedLandSection}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <StructuredFieldRow>
                  <Input
                    type="text"
                    className={compactInputClass(4)}
                    placeholder="高雄"
                    value={landParts.cityName}
                    maxLength={2}
                    onChange={e => updateLand({ cityName: e.target.value })}
                    onKeyDown={preventEnterSubmit}
                    aria-label="縣市名稱"
                    aria-required="true"
                  />
                  <Select
                    value={landParts.cityType}
                    onValueChange={value => updateLand({ cityType: value })}
                  >
                    <SelectTrigger className={cn(structuredInputClassName, 'w-[3.25rem] shrink-0 px-1 py-0 !h-10')}>
                      {landParts.cityType}
                    </SelectTrigger>
                    <SelectContent>
                      {CITY_TYPE_OPTIONS.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </StructuredFieldRow>

                <StructuredFieldRow after="區">
                  <Input
                    type="text"
                    className={compactInputClass(4)}
                    placeholder="鹽埕"
                    value={landParts.district}
                    maxLength={2}
                    onChange={e => updateLand({ district: e.target.value })}
                    onKeyDown={preventEnterSubmit}
                    aria-label="行政區"
                    aria-required="true"
                  />
                </StructuredFieldRow>

                <StructuredFieldRow after="段">
                  <Input
                    type="text"
                    className={compactInputClass(12)}
                    placeholder="一小"
                    value={landParts.section}
                    maxLength={24}
                    onChange={e => updateLand({ section: e.target.value })}
                    onKeyDown={preventEnterSubmit}
                    aria-label="段名"
                    aria-required="true"
                  />
                </StructuredFieldRow>

                <StructuredFieldRow after="號（選填）">
                  <Input
                    type="text"
                    className={compactInputClass(12)}
                    placeholder="100-150"
                    value={landParts.parcel}
                    maxLength={24}
                    onChange={e => updateLand({ parcel: sanitizeParcelInput(e.target.value) })}
                    onKeyDown={preventEnterSubmit}
                    aria-label="地號編號（選填）"
                  />
                </StructuredFieldRow>
              </div>
              {!landComplete && (
                <p className="mt-2 text-sm text-foreground">請填寫地號（縣市、區、段）；號碼為選填。</p>
              )}
            </StructuredSection>

            <StructuredSection title="建造執照字號" preview={composedBuildingPermit}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <StructuredFieldRow before="(" after=")">
                  <Input
                    type="text"
                    inputMode="numeric"
                    className={compactInputClass(3)}
                    placeholder={permitParts.year || '115'}
                    value={permitParts.year}
                    maxLength={3}
                    onChange={e => updatePermit({ year: e.target.value.replace(/\D/g, '') })}
                    onKeyDown={preventEnterSubmit}
                    aria-label="民國年"
                  />
                </StructuredFieldRow>

                <StructuredFieldRow aria-label="縣市簡稱（由地號帶入）">
                  <span className={structuredFixedTextClassName}>{permitCityPrefix}</span>
                </StructuredFieldRow>

                <StructuredFieldRow before="建築字第" after="號">
                  <Input
                    type="text"
                    inputMode="numeric"
                    className={compactInputClass(6)}
                    placeholder="961"
                    value={permitParts.number}
                    maxLength={6}
                    onChange={e => updatePermit({ number: e.target.value.replace(/\D/g, '') })}
                    onKeyDown={preventEnterSubmit}
                    aria-label="執照流水號"
                  />
                </StructuredFieldRow>
              </div>
            </StructuredSection>

            <StructuredSection title="工程規模" preview={composedProjectScale}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <StructuredFieldRow before="地上" after="層">
                  <Input
                    type="text"
                    inputMode="numeric"
                    className={compactInputClass(3)}
                    placeholder="5"
                    value={scaleParts.aboveGround}
                    maxLength={3}
                    onChange={e => updateScale({ aboveGround: e.target.value.replace(/\D/g, '') })}
                    onKeyDown={preventEnterSubmit}
                    aria-label="地上層數"
                  />
                </StructuredFieldRow>
                <StructuredFieldRow before="地下" after="層">
                  <Input
                    type="text"
                    inputMode="numeric"
                    className={compactInputClass(3)}
                    placeholder="1"
                    value={scaleParts.underground}
                    maxLength={3}
                    onChange={e => updateScale({ underground: e.target.value.replace(/\D/g, '') })}
                    onKeyDown={preventEnterSubmit}
                    aria-label="地下層數"
                  />
                </StructuredFieldRow>
              </div>
              <Field className="mt-4 max-w-md">
                <FieldLabel className="text-sm font-medium text-foreground">其他說明（選填）</FieldLabel>
                <Input
                  type="text"
                  className={structuredInputClassName}
                  value={scaleParts.notes}
                  onChange={e => updateScale({ notes: e.target.value })}
                  onKeyDown={preventEnterSubmit}
                  placeholder="RC構造"
                />
              </Field>
            </StructuredSection>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
