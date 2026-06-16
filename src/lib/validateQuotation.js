function isBlank(value) {
  return value == null || String(value).trim() === ''
}

/**
 * Validate quotation data before sending (status → 已報價).
 * Covers all wizard fields marked `required` in the UI.
 *
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateQuotationForSend({
  clientId,
  projectName,
  quoteNumber,
  quoteDate,
  feeAmount,
  paymentStages = [],
}) {
  const missing = []

  if (!clientId) missing.push('客戶')
  if (isBlank(projectName)) missing.push('工程名稱')
  if (isBlank(quoteNumber)) missing.push('報價編號')
  if (isBlank(quoteDate)) missing.push('報價日期')
  if (isBlank(feeAmount) || Number(feeAmount) <= 0) missing.push('報價金額 (未稅)')

  if (!paymentStages.length) {
    missing.push('付款階段')
  } else {
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
  }

  return { valid: missing.length === 0, missing }
}

export function formatQuotationValidationMessage(missing) {
  return `無法發送報價，請補齊：${missing.join('、')}`
}

/** Map wizard state to validation input. */
export function validateWizardDataForSend(data) {
  return validateQuotationForSend({
    clientId: data.client?.id,
    projectName: data.project_name,
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
    projectName: quotation.project_name,
    quoteNumber: quotation.quote_number,
    quoteDate: quotation.quote_date,
    feeAmount: quotation.fee_amount,
    paymentStages,
  })
}
