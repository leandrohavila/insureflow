import type { CrmStageId } from "./types"

export const pipelineStages: {
  id: CrmStageId
  label: string
  accent: string
}[] = [
  { id: "novo", label: "Novo", accent: "sky" },
  { id: "qualificacao", label: "Qualificação", accent: "violet" },
  { id: "proposta", label: "Proposta", accent: "primary" },
  { id: "negociacao", label: "Negociação", accent: "amber" },
  { id: "fechado", label: "Fechado", accent: "emerald" },
]

export const stageLabelMap = Object.fromEntries(
  pipelineStages.map((stage) => [stage.id, stage.label]),
) as Record<CrmStageId, string>

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}
