export const pipelineStages: {
  id: import("./types").CrmStageId
  label: string
  accent: string
}[] = [
  { id: "novo", label: "Novo Lead", accent: "sky" },
  { id: "contato", label: "Contato", accent: "violet" },
  { id: "cotacao", label: "Cotação", accent: "primary" },
  { id: "proposta", label: "Proposta", accent: "amber" },
  { id: "fechamento", label: "Fechamento", accent: "emerald" },
]

export const realEstatePipelineStages: typeof pipelineStages = [
  { id: "novo", label: "Novo Lead", accent: "sky" },
  { id: "visita", label: "Visita", accent: "violet" },
  { id: "proposta", label: "Proposta", accent: "amber" },
  { id: "contrato", label: "Contrato", accent: "primary" },
  { id: "fechamento", label: "Fechamento", accent: "emerald" },
]

export const allPipelineStages: typeof pipelineStages = [
  ...pipelineStages,
  { id: "visita", label: "Visita", accent: "violet" },
  { id: "contrato", label: "Contrato", accent: "primary" },
  { id: "qualificacao", label: "Qualificação", accent: "violet" },
  { id: "negociacao", label: "Negociação", accent: "amber" },
  { id: "fechado", label: "Fechamento", accent: "emerald" },
]

export const stageLabelMap = Object.fromEntries(
  allPipelineStages.map((stage) => [stage.id, stage.label]),
) as Record<string, string>

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}
