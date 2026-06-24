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
  const tax = taxIncluded ? fee * 0.05 : 0
  return fee + tax
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
