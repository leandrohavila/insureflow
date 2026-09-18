import {
  type RecordRowAccent,
  type StatusPillTone,
} from "@/components/crm/primitives"
import type { LeadStatus } from "@/lib/data-access/modules/leads"

/* -------------------------------------------------------------------------- */
/* Tokens semânticos do Lead                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Rótulos PT-BR canônicos dos status de lead.
 *
 * Centralizado aqui para o LeadSheetV2; o `LeadsPage` legado mantém o seu
 * próprio map duplicado por enquanto (não migramos consumidores existentes
 * neste escopo). Migração futura é trivial: trocar o import.
 */
export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
}

/**
 * Tom semântico do `StatusPill` por status do lead.
 *
 * Alinhado com `STAGE_TONE` do Deal (sky/violet/brand/emerald) para que o
 * usuário enxergue a continuidade visual lead → negócio sem dissonância de
 * cor entre os dois workspaces.
 */
export const LEAD_STATUS_TONE: Record<LeadStatus, StatusPillTone> = {
  new: "info",
  contacted: "violet",
  qualified: "brand",
  converted: "success",
  lost: "danger",
}

/**
 * Accent rail equivalente para uso em `RecordRow` quando quisermos pintar
 * uma linha inteira pelo status do lead (futuras tabelas v2).
 */
export const LEAD_STATUS_ACCENT: Record<LeadStatus, RecordRowAccent> = {
  new: "sky",
  contacted: "violet",
  qualified: "primary",
  converted: "emerald",
  lost: "rose",
}
