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
  noContact: number
  followUps: number
  /** Funil operacional (UX 3.1) — derivado dos counts já existentes. */
  novos: number
  emAtendimento: number
  cotacaoEnviada: number
  fechados: number
  perdidos: number
}

export function pipelineFromCounts(
  counts?: Partial<LeadCaptureCounts> | null,
) {
  return (
    (counts?.new ?? 0) + (counts?.contacted ?? 0) + (counts?.qualified ?? 0)
  )
}

function sumCount(
  key: keyof LeadCaptureCounts,
  insuranceCounts?: Partial<LeadCaptureCounts> | null,
  realEstateCounts?: Partial<LeadCaptureCounts> | null,
  counts?: Partial<LeadCaptureCounts> | null,
) {
  const fromUnits =
    (insuranceCounts?.[key] ?? 0) + (realEstateCounts?.[key] ?? 0)
  return fromUnits > 0 ? fromUnits : (counts?.[key] ?? 0)
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
  const novos = sumCount(
    "new",
    input.insuranceCounts,
    input.realEstateCounts,
    input.counts,
  )
  const emAtendimento = sumCount(
    "contacted",
    input.insuranceCounts,
    input.realEstateCounts,
    input.counts,
  )
  const cotacaoEnviada = sumCount(
    "qualified",
    input.insuranceCounts,
    input.realEstateCounts,
    input.counts,
  )
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
  const noContact = novos
  const accounted = novos + emAtendimento + cotacaoEnviada + converted
  const perdidos = Math.max(0, total - accounted)

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
    noContact,
    followUps: 0,
    novos,
    emAtendimento,
    cotacaoEnviada,
    fechados: converted,
    perdidos,
  }
}

export function formatLeadConversionRate(rate: number | null) {
  if (rate == null) return "—"
  return `${rate}%`
}
