import {
  type RecordRowAccent,
  type StatusPillTone,
} from "@/components/crm/primitives"
import type { CrmStageId } from "@/lib/data-access/modules/crm"

/* -------------------------------------------------------------------------- */
/* Mapeamentos semânticos de estágio / prioridade                              */
/* -------------------------------------------------------------------------- */

/**
 * Tom semântico do `StatusPill` por estágio do pipeline. Alinhado com
 * `pipelineStages[].accent` (sky/violet/primary/amber/emerald) e com as
 * tokens `--crm-stage-*` do crm-v2.
 */
export const STAGE_TONE: Record<CrmStageId, StatusPillTone> = {
  novo: "info",
  qualificacao: "violet",
  proposta: "brand",
  negociacao: "warn",
  fechado: "success",
}

/**
 * Accent rail equivalente para uso em `RecordRow` (header pill, rail item,
 * propriedades semanticamente coloridas).
 */
export const STAGE_ACCENT: Record<CrmStageId, RecordRowAccent> = {
  novo: "sky",
  qualificacao: "violet",
  proposta: "primary",
  negociacao: "amber",
  fechado: "emerald",
}

export type DealPriority = "alta" | "media" | "baixa"

export {
  PRIORITY_ACCENT_VAR,
  STAGE_ACCENT_VAR,
} from "@/lib/crm/deal-accents"

export const PRIORITY_TONE: Record<DealPriority, StatusPillTone> = {
  alta: "danger",
  media: "warn",
  baixa: "neutral",
}

export const PRIORITY_LABEL: Record<DealPriority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
}

/* -------------------------------------------------------------------------- */
/* Re-export de primitives compartilhados entre sheets de entidade            */
/* -------------------------------------------------------------------------- */

// Mantemos o re-export aqui para preservar todos os imports legados
// (`import { PropertyCell, PropertyGrid } from "./deal-shared"`) sem
// alteração em consumidores existentes. O código real vive em sheet-shared
// porque é genérico — usado também por LeadSheetV2 e futuras entidades.
export { PropertyCell, PropertyGrid } from "./sheet-shared"
