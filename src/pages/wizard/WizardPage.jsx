// src/pages/wizard/WizardPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { toast } from 'sonner'
import { todayCe } from '../../lib/rocDate'
import { FEATURE_NEGOTIATION, FEATURE_VERSIONING } from '../../lib/featureFlags'
import WizardShell from '../../components/WizardShell'
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
import { resolveProjectName } from '../../lib/projectDisplay'
import Step3Services from './Step3Services'
import Step4Confirm from './Step4Confirm'

const QUOTATION_STEPS = [
  { num: 1, label: '服務內容' },
  { num: 2, label: '報價與付款' },
]

const initState = () => ({
  // Step 1
  client: null,
  contacts: [],
  selectedContactId: null,

  // Step 2
  project_template_id: null,
  building_permit: '',
  land_section: '',
  project_scale: '',
  project_owner: '',
  project_name: '',

  // 案件公司抬頭（步驟 2）
  company_profile_id: null,

  // Step 3
  services: [],

  // Step 4
  quote_number: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
  quote_date: todayCe(),
  fee_amount: '',
  tax_included: false,
  notes: '',
  payment_stages: [
    { id: crypto.randomUUID(), stage_name: '開工前', percentage: 30 },
    { id: crypto.randomUUID(), stage_name: '施工中', percentage: 40 },
    { id: crypto.randomUUID(), stage_name: '完工後', percentage: 30 },
  ],
  version: 1,
})

export default function WizardPage() {
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const projectParam = searchParams.get('project')
  // inactive: negotiation — query params from 議價 flow
  // const negAmount = searchParams.get('negAmount')
  // const negNotes = searchParams.get('negNotes') ? decodeURIComponent(searchParams.get('negNotes')) : ''

  const initStep = Math.min(Math.max(parseInt(searchParams.get('step') || '1', 10) || 1, 1), QUOTATION_STEPS.length)

  // inactive: versioning — parent quote services for diff
  const [parentServices, setParentServices] = useState([])
  // inactive: negotiation — amount/notes carried into wizard
  const [negContext] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quotationId, setQuotationId] = useState(null)
  const [linkedProjectId, setLinkedProjectId] = useState(null)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()



  const update = useCallback((fields) => setData(d => ({ ...d, ...fields })), [])

  const [step, setStep] = useState(initStep)
  const [data, setData] = useState(initState)

  useEffect(() => {
    if (!editId && !projectParam) {
      navigate('/projects/new', { replace: true })
    }
  }, [editId, projectParam, navigate])

  // Load existing quotation if editing
  useEffect(() => {
    if (!editId) return
    const loadQuotation = async () => {
      setLoading(true)
      // Load quotation
      const { data: q, error: qErr } = await supabase
        .from('quotations')
        .select(`
          *,
          clients(*)
        `)
        .eq('id', editId)
        .single()
      if (qErr || !q) {
        toast.error('載入報價單失敗', { duration: 6000 })
        setLoading(false)
        return
      }

      // Load services
      const { data: services, error: sErr } = await supabase
        .from('quotation_services')
        .select('*')
        .eq('quotation_id', editId)
        .order('sort_order')

      // Load payment stages
      const { data: stages, error: pErr } = await supabase
        .from('payment_stages')
        .select('*')
        .eq('quotation_id', editId)
        .order('sort_order')

      if (sErr || pErr) {
        toast.error('載入資料失敗', { duration: 6000 })
        setLoading(false)
        return
      }

      let contacts = []
      if (q.client_id) {
        const { data: contactList, error: cErr } = await supabase
          .from('contact_persons')
          .select('*')
          .eq('client_id', q.client_id)
          .order('is_primary', { ascending: false })
        if (cErr) {
          toast.error('載入聯絡人失敗', { duration: 6000 })
          setLoading(false)
          return
        }
        contacts = contactList || []
      }

      // Set data
      setData({
        client: q.clients,
        contacts,
        selectedContactId: q.contact_person_id,
        project_template_id: q.project_template_id,
        building_permit: q.building_permit || '',
        land_section: q.land_section || '',
        project_scale: q.project_scale || '',
        project_owner: q.project_owner || '',
        project_name: q.project_name || '',
        company_profile_id: null,
        payment_stages: stages.map(st => ({ id: crypto.randomUUID(), stage_name: st.stage_name, percentage: st.percentage })),
        services: services.map(s => ({
          service_id: s.service_id,
          service_name: s.service_name,
          category: s.category,
          description: s.description || '',
          checklist_items: s.checklist_items || [],
          is_added: s.is_added,
          diff_status: s.diff_status || null,
        })),
        quote_number: q.quote_number,
        quote_date: q.quote_date,
        fee_amount: q.fee_amount?.toString() || '',
        tax_included: q.tax_included,
        notes: q.notes || '',
        version: q.version || 1,
      })
      setQuotationId(q.id)
      if (q.project_id) {
        setLinkedProjectId(q.project_id)
        const { data: proj } = await supabase
          .from('projects')
          .select('company_profile_id')
          .eq('id', q.project_id)
          .single()
        if (proj?.company_profile_id) {
          setData(d => ({ ...d, company_profile_id: proj.company_profile_id }))
        }
      }

      // inactive: versioning — load parent quote services for diff
      if (FEATURE_VERSIONING) {
        const parentId = q.parent_id
        if (parentId) {
          const { data: pSvcs } = await supabase
            .from('quotation_services')
            .select('service_name, category, description')
            .eq('quotation_id', parentId)
            .order('sort_order')
          setParentServices(pSvcs || [])
        }
      }

      setLoading(false)
    }
    loadQuotation()
  }, [editId])

  // Prefill from existing project when adding a quotation to a project
  useEffect(() => {
    if (editId || !projectParam) return
    const loadProject = async () => {
      setLoading(true)
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .select(`
          *,
          clients(*)
        `)
        .eq('id', projectParam)
        .single()

      if (projErr || !proj) {
        toast.error('載入案件失敗', { duration: 6000 })
        setLoading(false)
        navigate('/dashboard')
        return
      }

      let contacts = []
      if (proj.client_id) {
        const { data: contactList, error: cErr } = await supabase
          .from('contact_persons')
          .select('*')
          .eq('client_id', proj.client_id)
          .order('is_primary', { ascending: false })
        if (cErr) {
          toast.error('載入聯絡人失敗', { duration: 6000 })
          setLoading(false)
          return
        }
        contacts = contactList || []
      }

      setLinkedProjectId(proj.id)
      setData(d => ({
        ...d,
        client: proj.clients,
        contacts,
        selectedContactId: proj.contact_person_id,
        building_permit: proj.building_permit || '',
        land_section: proj.land_section || '',
        project_scale: proj.project_scale || '',
        project_owner: proj.project_owner || '',
        project_name: proj.name || '',
        company_profile_id: proj.company_profile_id || null,
        fee_amount: proj.total_amount?.toString() || '',
        tax_included: proj.tax_included ?? false,
      }))
      setLoading(false)
    }
    loadProject()
  }, [editId, projectParam, navigate])

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
    total_amount: Number(data.fee_amount) || 0,
    tax_included: data.tax_included,
    company_profile_id: data.company_profile_id || null,
  })

  const syncProject = async (projectId) => {
    if (!projectId) return
    await supabase.from('projects').update(projectPayload()).eq('id', projectId)
  }

  const saveDraft = async () => {
    setSaving(true)
    // Use a local variable so services/stages always have the correct id,
    // even on the very first save when quotationId state is still null.
    let qid = quotationId
    let projectId = linkedProjectId

    if (!qid) {
      if (!projectId) {
        toast.error('請先建立案件，再新增報價', { duration: 6000 })
        setSaving(false)
        return null
      }

      // Insert new draft quotation for existing project
      const { data: q, error: err } = await supabase
        .from('quotations')
        .insert([{
          quote_number: data.quote_number,
          status: '草稿',
          created_by: user.id,
          quote_date: data.quote_date,
          project_id: projectId,
          client_id: data.client?.id || null,
          contact_person_id: data.selectedContactId || null,
          project_template_id: data.project_template_id || null,
          building_permit: data.building_permit,
          land_section: data.land_section,
          project_scale: data.project_scale,
          project_owner: data.project_owner,
          project_name: data.project_name,
          fee_amount: Number(data.fee_amount) || 0,
          tax_included: data.tax_included,
          notes: data.notes,
        }])
        .select()
        .single()
      if (!err && q) {
        qid = q.id           // local var available immediately
        setQuotationId(q.id) // also update React state for future calls
        await syncProject(projectId)
        toast.success('草稿已儲存')
      } else {
        toast.error('儲存草稿失敗：' + (err?.message || '未知錯誤'), { duration: 6000 })
        setSaving(false)
        return null
      }
    } else {
      // Update existing
      const { error: err } = await supabase.from('quotations').update({
        quote_number: data.quote_number,
        quote_date: data.quote_date,
        client_id: data.client?.id || null,
        contact_person_id: data.selectedContactId || null,
        project_template_id: data.project_template_id || null,
        building_permit: data.building_permit,
        land_section: data.land_section,
        project_scale: data.project_scale,
        project_owner: data.project_owner,
        project_name: data.project_name,
        fee_amount: Number(data.fee_amount) || 0,
        tax_included: data.tax_included,
        notes: data.notes,
      }).eq('id', qid)
      if (!err) {
        let syncId = projectId || linkedProjectId
        if (!syncId) {
          const { data: existingQuotation } = await supabase
            .from('quotations')
            .select('project_id')
            .eq('id', qid)
            .single()
          syncId = existingQuotation?.project_id || null
          if (syncId) setLinkedProjectId(syncId)
        }
        await syncProject(syncId)
        toast.success('草稿已儲存')
      } else {
        toast.error('儲存草稿失敗：' + err.message, { duration: 6000 })
        setSaving(false)
        return null
      }
    }

    // Save services
    await supabase.from('quotation_services').delete().eq('quotation_id', qid)
    if (data.services.length) {
      await supabase.from('quotation_services').insert(
        data.services.map((s, i) => ({
          quotation_id: qid,
          service_id: s.service_id || null,
          service_name: s.service_name,
          category: s.category || null,
          description: s.description || null,
          checklist_items: s.checklist_items || [],
          sort_order: i,
          is_added: s.is_added || false,
          diff_status: s.diff_status || null,
        }))
      )
    }

    // Save payment stages
    let stageProjectId = projectId
    if (!stageProjectId) {
      const { data: existingQuotation } = await supabase
        .from('quotations')
        .select('project_id')
        .eq('id', qid)
        .single()
      stageProjectId = existingQuotation?.project_id || null
    }
    await supabase.from('payment_stages').delete().eq('quotation_id', qid)
    if (data.payment_stages.length && stageProjectId) {
      const fee = Number(data.fee_amount) || 0
      const tax = data.tax_included ? fee * 0.05 : 0
      const grand = fee + tax
      await supabase.from('payment_stages').insert(
        data.payment_stages.map((st, i) => ({
          quotation_id: qid,
          project_id: stageProjectId,
          stage_name: st.stage_name,
          percentage: Number(st.percentage),
          amount: Number(st.percentage) / 100 * grand,
          sort_order: i,
        }))
      )
    }
    setSaving(false)
    return qid
  }

  const canGoNext = () => {
    if (step === 2) {
      return !!data.fee_amount && !!data.quote_number && Math.abs((data.payment_stages || []).reduce((s, st) => s + Number(st.percentage || 0), 0) - 100) < 0.01
    }
    return true
  }

  const handleNext = async () => {
    if (!canGoNext()) {
      if (step === 2) toast.warning('請填寫報價編號、金額，且付款階段百分比需合計100%')
      return
    }
    setStep(s => s + 1)
  }

  const handleBack = () => setStep(s => s - 1)

  const handleStepClick = (clickedStep) => {
    if (clickedStep === step) return
    setStep(clickedStep)
  }

  const handleBackToDashboard = () => {
    setShowExitDialog(true)
  }

  const handleExitConfirm = async () => {
    setShowExitDialog(false)
    await saveDraft()
    navigate('/dashboard')
  }

  const handleExitCancel = () => {
    setShowExitDialog(false)
    navigate('/dashboard')
  }

  const handleFinish = async () => {
    const qid = await saveDraft()
    if (!qid) return
    navigate(`/quotation/${qid}`)
  }

  const stepProps = {
    data,
    update,
    loading,
    companyProfileLocked: !!(projectParam || linkedProjectId),
    ...(FEATURE_VERSIONING ? { parentServices } : {}),
    ...(FEATURE_NEGOTIATION ? { negContext } : {}),
  }

  return (
    <>
      <AlertDialog
        open={showExitDialog}
        onOpenChange={open => {
          if (!open) handleExitCancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>返回清單</AlertDialogTitle>
            <AlertDialogDescription>是否儲存目前的草稿？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>不儲存</AlertDialogCancel>
            <AlertDialogAction onClick={handleExitConfirm}>儲存</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <WizardShell
        steps={QUOTATION_STEPS}
        currentStep={step}
        onNext={step === QUOTATION_STEPS.length ? handleFinish : handleNext}
        onBack={handleBack}
        onSaveDraft={step === QUOTATION_STEPS.length ? null : saveDraft}
        onBackToDashboard={handleBackToDashboard}
        onStepClick={handleStepClick}
        saving={saving}
        canNext={canGoNext()}
        nextLabel={step === QUOTATION_STEPS.length ? '完成並儲存' : undefined}
        headerSubtitle={editId ? '編輯草稿' : '新增報價'}
      >
        {step === 1 && (
          <Step3Services
            {...stepProps}
            title="步驟 1：服務內容"
            description="選擇服務範本，並配置、調整各項服務及查核清單細節項目。"
          />
        )}
        {step === 2 && (
          <Step4Confirm
            {...stepProps}
            onFinish={handleFinish}
            saving={saving}
            title="步驟 2：報價與付款"
            description="填寫報價費用總額，並設定各階段付款收款條件比率。"
          />
        )}
      </WizardShell>
    </>
  )
}
