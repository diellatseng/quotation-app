// src/pages/wizard/WizardPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNotification } from '../../context/NotificationContext.jsx'
import { todayCe } from '../../lib/rocDate'
import WizardShell from '../../components/WizardShell'
import Dialog from '../../components/Dialog'
import Step1Client from './Step1Client'
import Step2Project from './Step2Project'
import Step3Services from './Step3Services'
import Step4Confirm from './Step4Confirm'

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
  const negAmount = searchParams.get('negAmount')
  const negNotes = searchParams.get('negNotes') ? decodeURIComponent(searchParams.get('negNotes')) : ''

  const initStep = parseInt(searchParams.get('step') || '1', 10)

  const [parentServices, setParentServices] = useState([]) // v(n-1) services for diff
  const [negContext, setNegContext] = useState(           // carried from negotiation
    negAmount ? { amount: Number(negAmount), notes: negNotes } : null
  )
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quotationId, setQuotationId] = useState(null)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const { user } = useAuth()
  const { success, error, warning } = useNotification()
  const navigate = useNavigate()



  const update = useCallback((fields) => setData(d => ({ ...d, ...fields })), [])

  const [step, setStep] = useState(initStep)
  const [data, setData] = useState(initState)

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
          clients(id, company_name),
          contact_persons(id, name)
        `)
        .eq('id', editId)
        .single()
      if (qErr || !q) {
        error('載入報價單失敗')
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
        error('載入資料失敗')
        setLoading(false)
        return
      }

      // Set data
      setData({
        client: q.clients,
        contacts: [], // TODO: load contacts if needed
        selectedContactId: q.contact_person_id,
        project_template_id: q.project_template_id,
        building_permit: q.building_permit || '',
        land_section: q.land_section || '',
        project_scale: q.project_scale || '',
        project_owner: q.project_owner || '',
        project_name: q.project_name || '',
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
        fee_amount: negAmount ? negAmount : (q.fee_amount?.toString() || ''),
        tax_included: q.tax_included,
        notes: q.notes || '',
        version: q.version || 1,
      })
      setQuotationId(q.id)

      // Load parent version's services for diff computation
      const parentId = q.parent_id
      if (parentId) {
        const { data: pSvcs } = await supabase
          .from('quotation_services')
          .select('service_name, category, description')
          .eq('quotation_id', parentId)
          .order('sort_order')
        setParentServices(pSvcs || [])
      }

      setLoading(false)
    }
    loadQuotation()
  }, [editId, error])

  const saveDraft = async () => {
    setSaving(true)
    // Use a local variable so services/stages always have the correct id,
    // even on the very first save when quotationId state is still null.
    let qid = quotationId
    let projectId = null

    if (!qid) {
      // 1. Create project first
      console.log('📦 Creating project with user:', user?.id, 'project_name:', data.project_name)
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .insert([{
          name: data.project_name || `Project-${Date.now()}`,
          client_id: data.client?.id || null,
          contact_person_id: data.selectedContactId || null,
          building_permit: data.building_permit,
          land_section: data.land_section,
          project_scale: data.project_scale,
          project_owner: data.project_owner,
          total_amount: Number(data.fee_amount) || 0,
          tax_included: data.tax_included,
          status: '已報價',
          created_by: user.id,
        }])
        .select()
        .single()
      console.log('📦 Project result:', { proj, projErr })
      if (projErr || !proj) {
        error('建立專案失敗：' + (projErr?.message || '未知錯誤'))
        setSaving(false)
        return null
      }
      projectId = proj.id
      console.log('✅ Project created:', projectId)

      // 2. Insert new draft quotation with project_id
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
        success('草稿已儲存')
      } else {
        error('儲存草稿失敗：' + (err?.message || '未知錯誤'))
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
        success('草稿已儲存')
      } else {
        error('儲存草稿失敗：' + err.message)
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
    if (step === 1) return !!data.client
    if (step === 4) return !!data.fee_amount && !!data.quote_number && Math.abs((data.payment_stages || []).reduce((s, st) => s + Number(st.percentage || 0), 0) - 100) < 0.01
    return true
  }

  const handleNext = async () => {
    if (!canGoNext()) {
      if (step === 1) warning('請先選擇或建立客戶')
      if (step === 4) warning('請填寫報價編號、金額，且付款階段百分比需合計100%')
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
    if (qid) {
      navigate(`/quotation/${qid}`)
    }
  }

  const stepProps = { data, update, loading, parentServices, negContext }

  return (
    <>
      <Dialog
        isOpen={showExitDialog}
        title="返回清單"
        message="是否儲存目前的草稿？"
        confirmText="儲存"
        cancelText="不儲存"
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
      <WizardShell
        currentStep={step}
        onNext={step === 4 ? handleFinish : handleNext}
        onBack={handleBack}
        onSaveDraft={step === 4 ? null : saveDraft}
        onBackToDashboard={handleBackToDashboard}
        onStepClick={handleStepClick}
        saving={saving}
        canNext={canGoNext()}
        nextLabel={step === 4 ? '完成並儲存' : undefined}
      >
        {step === 1 && <Step1Client  {...stepProps} />}
        {step === 2 && <Step2Project {...stepProps} />}
        {step === 3 && <Step3Services {...stepProps} />}
        {step === 4 && <Step4Confirm {...stepProps} onFinish={handleFinish} saving={saving} />}
      </WizardShell>
    </>
  )
}
