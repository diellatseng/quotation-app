// src/pages/wizard/WizardPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNotification } from '../../context/NotificationContext.jsx'
import { todayCe } from '../../lib/rocDate'
import WizardShell from '../../components/WizardShell'
import Step1Client  from './Step1Client'
import Step2Project from './Step2Project'
import Step3Payment from './Step3Payment'
import Step4Services from './Step4Services'
import Step5Confirm from './Step5Confirm'
import Step6Preview from './Step6Preview'

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
  payment_stages: [{ id: crypto.randomUUID(), stage_name: '', percentage: 0 }],

  // Step 4
  services: [],

  // Step 5
  quote_number: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
  quote_date: todayCe(),
  fee_amount: '',
  tax_included: false,
  notes: '',
})

export default function WizardPage() {
  const [step, setStep]   = useState(1)
  const [data, setData]   = useState(initState)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quotationId, setQuotationId] = useState(null)
  const { user }          = useAuth()
  const { success, error, warning } = useNotification()
  const navigate          = useNavigate()

  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const update = useCallback((fields) => setData(d => ({ ...d, ...fields })), [])

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
          checklist_items: s.checklist_items || [],
          is_added: s.is_added,
        })),
        quote_number: q.quote_number,
        quote_date: q.quote_date,
        fee_amount: q.fee_amount?.toString() || '',
        tax_included: q.tax_included,
        notes: q.notes || '',
      })
      setQuotationId(q.id)
      setLoading(false)
    }
    loadQuotation()
  }, [editId, error])

  const saveDraft = async () => {
    setSaving(true)
    if (!quotationId) {
      // Insert new draft
      const { data: q, error: err } = await supabase
        .from('quotations')
        .insert([{
          quote_number:         data.quote_number,
          status:               '草稿',
          created_by:           user.id,
          quote_date:           data.quote_date,
          client_id:            data.client?.id || null,
          contact_person_id:    data.selectedContactId || null,
          project_template_id:  data.project_template_id || null,
          building_permit:      data.building_permit,
          land_section:         data.land_section,
          project_scale:        data.project_scale,
          project_owner:        data.project_owner,
        project_name:         data.project_name,
          fee_amount:           Number(data.fee_amount) || 0,
          tax_included:         data.tax_included,
          notes:                data.notes,
        }])
        .select()
        .single()
      if (!err && q) {
        setQuotationId(q.id)
        success('草稿已儲存')
      } else {
        error('儲存草稿失敗：' + (err?.message || '未知錯誤'))
      }
    } else {
      // Update existing
      const { error: err } = await supabase.from('quotations').update({
        quote_number:         data.quote_number,
        quote_date:           data.quote_date,
        client_id:            data.client?.id || null,
        contact_person_id:    data.selectedContactId || null,
        project_template_id:  data.project_template_id || null,
        building_permit:      data.building_permit,
        land_section:         data.land_section,
        project_scale:        data.project_scale,
        project_owner:        data.project_owner,
        project_name:         data.project_name,
        fee_amount:           Number(data.fee_amount) || 0,
        tax_included:         data.tax_included,
        notes:                data.notes,
      }).eq('id', quotationId)
      if (!err) {
        success('草稿已儲存')
      } else {
        error('儲存草稿失敗：' + err.message)
      }
    }
    setSaving(false)
  }

  const canGoNext = () => {
    if (step === 1) return !!data.client
    if (step === 5) return !!data.fee_amount && !!data.quote_number
    return true
  }

  const handleNext = async () => {
    if (!canGoNext()) {
      if (step === 1) warning('請先選擇或建立客戶')
      if (step === 5) warning('請填寫報價編號與金額')
      return
    }
    await saveDraft()
    setStep(s => s + 1)
  }

  const handleBack = () => setStep(s => s - 1)

  const handleBackToDashboard = async () => {
    await saveDraft()
    navigate('/dashboard')
  }

  const handleFinish = async () => {
    if (!quotationId) return
    setSaving(true)
    // Save all remaining data
    await saveDraft()

    // Save services
    await supabase.from('quotation_services').delete().eq('quotation_id', quotationId)
    if (data.services.length) {
      await supabase.from('quotation_services').insert(
        data.services.map((s, i) => ({
          quotation_id: quotationId,
          service_id:   s.service_id || null,
          service_name: s.service_name,
          category:     s.category || null,
          checklist_items: s.checklist_items || [],
          sort_order:   i,
          is_added:     s.is_added || false,
        }))
      )
    }

    // Save payment stages
    await supabase.from('payment_stages').delete().eq('quotation_id', quotationId)
    if (data.payment_stages.length) {
      const fee = Number(data.fee_amount) || 0
      const tax = data.tax_included ? fee * 0.05 : 0
      const grand = fee + tax
      await supabase.from('payment_stages').insert(
        data.payment_stages.map((st, i) => ({
          quotation_id: quotationId,
          stage_name:   st.stage_name,
          percentage:   Number(st.percentage),
          amount:       Number(st.percentage) / 100 * grand,
          sort_order:   i,
        }))
      )
    }

    // Update status to finalized
    await supabase.from('quotations').update({ status: '已報價' }).eq('id', quotationId)

    success('報價單已建立！')
    navigate(`/quotation/${quotationId}`)
    setSaving(false)
  }

  const stepProps = { data, update, quotationId }

  return (
    <WizardShell
      currentStep={step}
      onNext={step === 6 ? handleFinish : handleNext}
      onBack={handleBack}
      onSaveDraft={step < 6 ? saveDraft : null}
      onBackToDashboard={handleBackToDashboard}
      saving={saving}
      canNext={canGoNext()}
      nextLabel={step === 6 ? '完成並儲存' : undefined}
    >
      {step === 1 && <Step1Client  {...stepProps} />}
      {step === 2 && <Step2Project {...stepProps} />}
      {step === 3 && <Step3Payment {...stepProps} />}
      {step === 4 && <Step4Services {...stepProps} />}
      {step === 5 && <Step5Confirm {...stepProps} />}
      {step === 6 && <Step6Preview {...stepProps} onFinish={handleFinish} saving={saving} />}
    </WizardShell>
  )
}
