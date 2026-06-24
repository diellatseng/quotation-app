import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'
import WizardShell from '../components/WizardShell'
import Step1Client from './wizard/Step1Client'
import Step2Project from './wizard/Step2Project'
import { resolveProjectName } from '../lib/projectDisplay'
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

const SETUP_STEPS = [
  { num: 1, label: '客戶資料' },
  { num: 2, label: '工程資料' },
]

const initState = () => ({
  client: null,
  contacts: [],
  selectedContactId: null,
  company_profile_id: null,
  building_permit: '',
  land_section: '',
  project_scale: '',
  project_owner: '',
  project_name: '',
})

export default function ProjectSetupPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState(initState)
  const [saving, setSaving] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const update = useCallback((fields) => setData(d => ({ ...d, ...fields })), [])

  const projectPayload = () => ({
    name: resolveProjectName({
      project_name: data.project_name,
      land_section: data.land_section,
    }),
    client_id: data.client?.id || null,
    contact_person_id: data.selectedContactId || null,
    building_permit: data.building_permit,
    land_section: data.land_section,
    project_scale: data.project_scale,
    project_owner: data.project_owner,
    company_profile_id: data.company_profile_id || null,
    total_amount: 0,
    tax_included: false,
    status: '未開工',
  })

  const saveProject = async () => {
    if (!data.client) {
      toast.warning('請先選擇或建立客戶')
      return null
    }
    if (!data.company_profile_id) {
      toast.warning('請選擇公司抬頭')
      return null
    }

    setSaving(true)
    try {
      const { data: proj, error } = await supabase
        .from('projects')
        .insert([{
          ...projectPayload(),
          created_by: user?.id || null,
        }])
        .select()
        .single()

      if (error) throw error
      toast.success('案件已建立')
      return proj.id
    } catch (err) {
      const msg = err?.message || '未知錯誤'
      if (msg.includes('projects_status_check')) {
        toast.error(
          '建立案件失敗：資料庫 status 限制尚未更新。請至 Supabase SQL Editor 執行 supabase/migration_project_work_status.sql。',
          { duration: 10000 },
        )
      } else {
        toast.error('建立案件失敗：' + msg, { duration: 6000 })
      }
      return null
    } finally {
      setSaving(false)
    }
  }

  const canGoNext = () => {
    if (step === 1) return !!data.client
    if (step === 2) return !!data.company_profile_id
    return true
  }

  const handleNext = () => {
    if (!canGoNext()) {
      if (step === 1) toast.warning('請先選擇或建立客戶')
      if (step === 2) toast.warning('請選擇公司抬頭')
      return
    }
    setStep(s => s + 1)
  }

  const handleFinish = async () => {
    if (!canGoNext()) {
      toast.warning('請選擇公司抬頭')
      return
    }
    const projectId = await saveProject()
    if (projectId) navigate(`/projects/${projectId}`)
  }

  const stepProps = { data, update, loading: false, companyProfileLocked: false }

  return (
    <>
      <AlertDialog open={showExitDialog} onOpenChange={open => { if (!open) navigate('/dashboard') }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>返回清單</AlertDialogTitle>
            <AlertDialogDescription>尚未儲存，確定要離開嗎？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>繼續編輯</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/dashboard')}>離開</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WizardShell
        steps={SETUP_STEPS}
        currentStep={step}
        onNext={step === SETUP_STEPS.length ? handleFinish : handleNext}
        onBack={() => setStep(s => s - 1)}
        onBackToDashboard={() => setShowExitDialog(true)}
        onStepClick={setStep}
        saving={saving}
        canNext={canGoNext()}
        nextLabel={step === SETUP_STEPS.length ? '建立案件' : undefined}
        headerSubtitle="新增案件"
      >
        {step === 1 && (
          <Step1Client
            {...stepProps}
            title="步驟 1：客戶資料"
            description="請選擇現有客戶，或建立新客戶資料。客戶資料將套用於本案件所有報價與請款。"
          />
        )}
        {step === 2 && (
          <Step2Project
            {...stepProps}
            title="步驟 2：工程資料"
            description="請選擇公司抬頭並輸入工程基本資料。這些設定將沿用於本案件所有文件。"
          />
        )}
      </WizardShell>
    </>
  )
}
