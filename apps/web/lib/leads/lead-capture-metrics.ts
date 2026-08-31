export type LeadCaptureCounts = {
  new: number
  contacted: number
  qualified: number
  converted: number
}

export type LeadCaptureMetrics = {
  total: number
  insurance: number
  realEstate: number
  converted: number
  pipeline: number
  pipelineInsurance: number
  pipelineRealEstate: number
  customersInsurance: number
  customersRealEstate: number
  conversionRate: number | null
}

export function pipelineFromCounts(
  counts?: Partial<LeadCaptureCounts> | null,
) {
  return (
    (counts?.new ?? 0) + (counts?.contacted ?? 0) + (counts?.qualified ?? 0)
  )
}

export function computeLeadCaptureMetrics(input: {
  total: number
  insurance: number
  realEstate: number
  customersInsurance?: number
  customersRealEstate?: number
  counts?: Partial<LeadCaptureCounts> | null
  insuranceCounts?: Partial<LeadCaptureCounts> | null
  realEstateCounts?: Partial<LeadCaptureCounts> | null
}): LeadCaptureMetrics {
  const total = input.insurance + input.realEstate || input.total
  const convertedFromUnits =
    (input.insuranceCounts?.converted ?? 0) +
    (input.realEstateCounts?.converted ?? 0)
  const converted =
    convertedFromUnits > 0
      ? convertedFromUnits
      : (input.counts?.converted ?? 0)
  const pipelineInsurance = pipelineFromCounts(input.insuranceCounts)
  const pipelineRealEstate = pipelineFromCounts(input.realEstateCounts)
  const pipeline =
    pipelineInsurance + pipelineRealEstate || pipelineFromCounts(input.counts)

  return {
    total,
    insurance: input.insurance,
    realEstate: input.realEstate,
    converted,
    pipeline,
    pipelineInsurance,
    pipelineRealEstate,
    customersInsurance: input.customersInsurance ?? 0,
    customersRealEstate: input.customersRealEstate ?? 0,
    conversionRate: total > 0 ? Math.round((converted / total) * 100) : null,
  }
}

export function formatLeadConversionRate(rate: number | null) {
  if (rate == null) return "—"
  return `${rate}%`
}
