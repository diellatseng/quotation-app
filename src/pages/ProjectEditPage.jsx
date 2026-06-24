import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import WizardShell from '../components/WizardShell'
import Step1Client from './wizard/Step1Client'
import Step2Project from './wizard/Step2Project'
import { marketingNameForEdit } from '../lib/projectDisplay'
import { QuotationDetailSkeleton } from '@/components/skeletons'
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

function parseInitialStep(raw) {
  const n = Number(raw)
  if (n >= 1 && n <= SETUP_STEPS.length) return n
  return 1
}

const initState = () => ({
  client: null,
  contacts: [],
  selectedContactId: null,
  company_profile_id: null,
  building_permit: '',
  land_section: '',
  project_scale: '',
  project_owner: '',
  marketing_name: '',
})

function snapshotState(data) {
  return JSON.stringify({
    clientId: data.client?.id || null,
    selectedContactId: data.selectedContactId || null,
    company_profile_id: data.company_profile_id || null,
    building_permit: data.building_permit || '',
    land_section: data.land_section || '',
    project_scale: data.project_scale || '',
    project_owner: data.project_owner || '',
    marketing_name: data.marketing_name || '',
  })
}

function landSectionDuplicateMessage(message) {
  const msg = message || ''
  return msg.includes('projects_land_section_key') || msg.includes('duplicate key value')
}

export default function ProjectEditPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(() => parseInitialStep(searchParams.get('step')))
  const [data, setData] = useState(initState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const initialSnapshot = useRef(null)
  const navigate = useNavigate()

  const update = useCallback((fields) => setData(d => ({ ...d, ...fields })), [])

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      setLoading(true)
      try {
        const { data: proj, error: projErr } = await supabase
          .from('projects')
          .select(`
            *,
            clients(*),
            contact_persons(*)
          `)
          .eq('id', id)
          .single()

        if (projErr) throw projErr

        let contacts = []
        if (proj.client_id) {
          const { data: contactRows, error: contactErr } = await supabase
            .from('contact_persons')
            .select('*')
            .eq('client_id', proj.client_id)
            .order('is_primary', { ascending: false })

          if (contactErr) throw contactErr
          contacts = contactRows || []
        }

        if (cancelled) return

        const loaded = {
          client: proj.clients || null,
          contacts,
          selectedContactId: proj.contact_person_id || null,
          company_profile_id: proj.company_profile_id || null,
          building_permit: proj.building_permit || '',
          land_section: proj.land_section || '',
          project_scale: proj.project_scale || '',
          project_owner: proj.project_owner || '',
          marketing_name: marketingNameForEdit(proj),
        }
        setData(loaded)
        initialSnapshot.current = snapshotState(loaded)
      } catch (err) {
        toast.error('載入案件失敗：' + err.message, { duration: 6000 })
        navigate(`/projects/${id}`, { replace: true })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProject()
    return () => { cancelled = true }
  }, [id, navigate])

  const projectPayload = () => ({
    marketing_name: data.marketing_name?.trim() || null,
    client_id: data.client?.id || null,
    contact_person_id: data.selectedContactId || null,
    building_permit: data.building_permit,
    land_section: data.land_section.trim(),
    project_scale: data.project_scale,
    project_owner: data.project_owner,
    company_profile_id: data.company_profile_id || null,
  })

  const isDirty = () => {
    if (!initialSnapshot.current) return false
    return snapshotState(data) !== initialSnapshot.current
  }

  const saveProject = async () => {
    if (!data.client) {
      toast.warning('請先選擇或建立客戶')
      return false
    }
    if (!data.company_profile_id) {
      toast.warning('請選擇公司抬頭')
      return false
    }
    if (!data.land_section?.trim()) {
      toast.warning('請輸入地號')
      return false
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update(projectPayload())
        .eq('id', id)

      if (error) throw error
      initialSnapshot.current = snapshotState(data)
      toast.success('案件已更新')
      return true
    } catch (err) {
      const msg = err?.message || '未知錯誤'
      if (landSectionDuplicateMessage(msg)) {
        toast.error('此地號已被使用，請輸入不同的地號', { duration: 6000 })
      } else {
        toast.error('更新案件失敗：' + msg, { duration: 6000 })
      }
      return false
    } finally {
      setSaving(false)
    }
  }

  const canGoNext = () => {
    if (step === 1) return !!data.client
    if (step === 2) return !!data.company_profile_id && !!data.land_section?.trim()
    return true
  }

  const handleNext = () => {
    if (!canGoNext()) {
      if (step === 1) toast.warning('請先選擇或建立客戶')
      if (step === 2) {
        if (!data.company_profile_id) toast.warning('請選擇公司抬頭')
        else toast.warning('請輸入地號')
      }
      return
    }
    setStep(s => s + 1)
  }

  const handleStepClick = (clickedStep) => {
    if (clickedStep === step) return
    if (clickedStep === 2 && !data.client) {
      toast.warning('請先選擇或建立客戶')
      return
    }
    setStep(clickedStep)
  }

  const handleFinish = async () => {
    if (!canGoNext()) {
      if (!data.company_profile_id) toast.warning('請選擇公司抬頭')
      else toast.warning('請輸入地號')
      return
    }
    const ok = await saveProject()
    if (ok) navigate(`/projects/${id}`)
  }

  const handleBackToProject = () => {
    if (isDirty()) setShowExitDialog(true)
    else navigate(`/projects/${id}`)
  }

  const stepProps = { data, update, loading, companyProfileLocked: false }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <QuotationDetailSkeleton />
      </div>
    )
  }

  return (
    <>
      <AlertDialog open={showExitDialog} onOpenChange={open => { if (!open) navigate(`/projects/${id}`) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>返回案件</AlertDialogTitle>
            <AlertDialogDescription>尚未儲存，確定要離開嗎？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>繼續編輯</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(`/projects/${id}`)}>離開</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WizardShell
        steps={SETUP_STEPS}
        currentStep={step}
        onNext={step === SETUP_STEPS.length ? handleFinish : handleNext}
        onBack={() => setStep(s => s - 1)}
        onBackToDashboard={handleBackToProject}
        onStepClick={handleStepClick}
        saving={saving}
        canNext={canGoNext()}
        nextLabel={step === SETUP_STEPS.length ? '儲存變更' : undefined}
        headerSubtitle="編輯案件"
        navBackLabel="返回案件"
      >
        {step === 1 && (
          <Step1Client
            {...stepProps}
            title="步驟 1：客戶資料"
            description="可變更客戶或聯絡人。客戶資料將套用於本案件所有報價與請款。"
          />
        )}
        {step === 2 && (
          <Step2Project
            {...stepProps}
            title="步驟 2：工程資料"
            description="可調整公司抬頭與工程基本資料。地號為必填且不可與其他案件重複。"
          />
        )}
      </WizardShell>
    </>
  )
}
