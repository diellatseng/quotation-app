function isBlank(value) {
  return value == null || String(value).trim() === ''
}

export function collectPaymentStageMissing(paymentStages = []) {
  const missing = []

  if (!paymentStages.length) {
    missing.push('付款階段')
    return missing
  }

  paymentStages.forEach((stage, idx) => {
    const step = idx + 1
    if (isBlank(stage.stage_name)) missing.push(`付款階段 ${step} 名稱`)
    if (isBlank(stage.percentage)) missing.push(`付款階段 ${step} 百分比`)
  })

  const total = paymentStages.reduce(
    (sum, stage) => sum + Number(stage.percentage || 0),
    0,
  )
  if (Math.abs(total - 100) >= 0.01) {
    missing.push('付款階段百分比總和（需為 100%）')
  }

  return missing
}

/**
 * Validate quotation data before sending (status → 已報價).
 * Covers all wizard fields marked `required` in the UI.
 *
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateQuotationForSend({
  clientId,
  landSection,
  quoteNumber,
  quoteDate,
  feeAmount,
  paymentStages = [],
}) {
  const missing = []

  if (!clientId) missing.push('客戶')
  if (isBlank(landSection)) missing.push('地號')
  if (isBlank(quoteNumber)) missing.push('報價編號')
  if (isBlank(quoteDate)) missing.push('報價日期')
  if (isBlank(feeAmount) || Number(feeAmount) <= 0) missing.push('報價金額 (未稅)')

  missing.push(...collectPaymentStageMissing(paymentStages))

  return { valid: missing.length === 0, missing }
}

/**
 * Validate quotation data before saving a draft.
 * Covers Step 4 required fields, including payment stages.
 *
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateQuotationForDraft({
  clientId,
  quoteNumber,
  quoteDate,
  feeAmount,
  paymentStages = [],
}) {
  const missing = []

  if (!clientId) missing.push('客戶')
  if (isBlank(quoteNumber)) missing.push('報價編號')
  if (isBlank(quoteDate)) missing.push('報價日期')
  if (isBlank(feeAmount) || Number(feeAmount) <= 0) missing.push('報價金額 (未稅)')

  missing.push(...collectPaymentStageMissing(paymentStages))

  return { valid: missing.length === 0, missing }
}
export function formatQuotationValidationMessage(missing) {
  return `無法發送報價，請補齊：${missing.join('、')}`
}

export function formatQuotationDraftValidationMessage(missing) {
  return `無法儲存草稿，請補齊：${missing.join('、')}`
}

/** Map wizard state to validation input. */
export function validateWizardDataForDraft(data) {
  return validateQuotationForDraft({
    clientId: data.client?.id,
    quoteNumber: data.quote_number,
    quoteDate: data.quote_date,
    feeAmount: data.fee_amount,
    paymentStages: data.payment_stages,
  })
}
/** Map wizard state to validation input. */
export function validateWizardDataForSend(data, { projectLandSection } = {}) {
  return validateQuotationForSend({
    clientId: data.client?.id,
    landSection: projectLandSection,
    quoteNumber: data.quote_number,
    quoteDate: data.quote_date,
    feeAmount: data.fee_amount,
    paymentStages: data.payment_stages,
  })
}

/** Map loaded quotation row + payment stages to validation input. */
export function validateQuotationRecordForSend(quotation, paymentStages) {
  return validateQuotationForSend({
    clientId: quotation.client_id,
    landSection: quotation.projects?.land_section,
    quoteNumber: quotation.quote_number,
    quoteDate: quotation.quote_date,
    feeAmount: quotation.fee_amount,
    paymentStages,
  })
}
