export const PAYMENT_STAGE_PRESETS = [
  {
    label: '兩階段（開工/完工）',
    stages: [
      { stage_name: '開工前', percentage: 50 },
      { stage_name: '完工後', percentage: 50 },
    ],
  },
  {
    label: '三階段（開工/施工/完工）',
    stages: [
      { stage_name: '開工前', percentage: 30 },
      { stage_name: '施工中', percentage: 40 },
      { stage_name: '完工後', percentage: 30 },
    ],
  },
  {
    label: '四階段分配',
    stages: [
      { stage_name: '開工完成', percentage: 20 },
      { stage_name: '結構體完成', percentage: 20 },
      { stage_name: '裝修完成', percentage: 20 },
      { stage_name: '取得使用執照', percentage: 40 },
    ],
  },
]

export const DEFAULT_PAYMENT_STAGE_PRESET = PAYMENT_STAGE_PRESETS[1]

/** Default 三階段（開工前 30% / 施工中 40% / 完工後 30%） */
export function defaultPaymentStages(grandTotal = 0) {
  return applyPaymentStagePreset(DEFAULT_PAYMENT_STAGE_PRESET, grandTotal)
}

export function newStageRow(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    stage_name: '',
    percentage: 0,
    amount: 0,
    ...overrides,
  }
}

export function grandTotalFromFee(feeAmount, taxIncluded) {
  const fee = Number(feeAmount) || 0
  const tax = taxIncluded ? Math.round(fee * 0.05) : 0
  return fee + tax
}

/** Reverse of grandTotalFromFee when reloading project total_amount for manual edit. */
export function baseFeeFromGrand(totalAmount, taxIncluded) {
  const total = Number(totalAmount) || 0
  if (!taxIncluded || !total) return total
  return Math.round(total / 1.05)
}

export function stageAmountFromPercentage(grandTotal, percentage) {
  return Math.round(grandTotal * (Number(percentage) || 0) / 100)
}

export function stagesFromPreset(preset, grandTotal) {
  return preset.stages.map(s => ({
    ...newStageRow(),
    stage_name: s.stage_name,
    percentage: s.percentage,
    amount: stageAmountFromPercentage(grandTotal, s.percentage),
  }))
}

export function sumStagePercentages(stages) {
  return stages.reduce((sum, s) => sum + Number(s.percentage || 0), 0)
}

export function remainingStagePercentage(stages) {
  const total = sumStagePercentages(stages)
  return total < 100 ? 100 - total : 0
}

export function sumStageAmounts(stages) {
  return stages.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
}

/** Add stage with auto-filled remainder percentage (and amount when grandTotal > 0). */
export function addPaymentStage(stages, grandTotal = 0) {
  const percentage = remainingStagePercentage(stages)
  return [
    ...stages,
    newStageRow({
      stage_name: '',
      percentage,
      amount: grandTotal > 0 ? stageAmountFromPercentage(grandTotal, percentage) : 0,
    }),
  ]
}

export function updatePaymentStage(stages, stageId, fields, grandTotal = 0) {
  return stages.map(s => {
    if (s.id !== stageId) return s
    const next = { ...s, ...fields }
    if (grandTotal > 0) {
      if ('percentage' in fields && !('amount' in fields)) {
        next.amount = stageAmountFromPercentage(grandTotal, next.percentage)
      }
      if ('amount' in fields) {
        next.percentage = Math.round((Number(next.amount) / grandTotal) * 10000) / 100
      }
    }
    return next
  })
}

export function removePaymentStage(stages, stageId) {
  return stages.filter(s => s.id !== stageId)
}

export function applyPaymentStagePreset(preset, grandTotal = 0) {
  if (grandTotal > 0) return stagesFromPreset(preset, grandTotal)
  return preset.stages.map(s => ({
    id: crypto.randomUUID(),
    stage_name: s.stage_name,
    percentage: s.percentage,
  }))
}

export function recalcStageAmountsFromGrandTotal(stages, grandTotal) {
  if (!(grandTotal > 0)) return stages
  return stages.map(s => ({
    ...s,
    amount: stageAmountFromPercentage(grandTotal, s.percentage),
  }))
}

export function displayStageAmount(stage, grandTotal) {
  if (stage.amount != null && stage.amount !== '') {
    return Number(stage.amount) || 0
  }
  return stageAmountFromPercentage(grandTotal, stage.percentage)
}
