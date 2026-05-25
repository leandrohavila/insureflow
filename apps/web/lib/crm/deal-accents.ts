import type { CrmStageId } from "@/lib/data-access/modules/crm"

export type DealPriority = "alta" | "media" | "baixa"

/** Variável CSS de accent por prioridade (dot / rail). */
export const PRIORITY_ACCENT_VAR: Record<DealPriority, string> = {
  alta: "var(--crm-tone-danger)",
  media: "var(--crm-tone-warn)",
  baixa: "var(--crm-tone-neutral)",
}

/** Variável CSS de accent por estágio (rail do kanban card). */
export const STAGE_ACCENT_VAR: Record<CrmStageId, string> = {
  novo: "var(--crm-stage-prospeccao)",
  qualificacao: "var(--crm-stage-qualificacao)",
  proposta: "var(--crm-stage-proposta)",
  negociacao: "var(--crm-stage-negociacao)",
  fechado: "var(--crm-stage-fechado)",
}
