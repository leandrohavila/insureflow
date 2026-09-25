import type { BusinessUnitType } from "@/lib/business-units/constants"
import type { CrmStageId } from "@/lib/data-access/modules/crm"

const REAL_ESTATE_STAGE_ALIASES: Record<string, CrmStageId> = {
  novo: "novo",
  qualificacao: "primeiro-contato",
  contato: "primeiro-contato",
  "primeiro-contato": "primeiro-contato",
  visita: "visita-agendada",
  "visita-agendada": "visita-agendada",
  cotacao: "negociacao",
  proposta: "proposta",
  negociacao: "negociacao",
  contrato: "negociacao",
  fechamento: "fechado",
  fechado: "fechado",
  perdido: "perdido",
}

export function boardDealStage(
  stage: string,
  unitType: BusinessUnitType | null | undefined,
  boardType: BusinessUnitType,
): CrmStageId {
  const canonical: string =
    unitType === "REAL_ESTATE"
      ? (REAL_ESTATE_STAGE_ALIASES[stage] ?? stage)
      : stage === "fechado"
        ? "fechamento"
        : stage === "qualificacao"
          ? "contato"
          : stage === "negociacao"
            ? "proposta"
            : stage
  if (boardType === "INSURANCE") {
    if (
      canonical === "visita" ||
      canonical === "visita-agendada" ||
      canonical === "primeiro-contato"
    ) {
      return "contato"
    }
    if (canonical === "contrato" || canonical === "negociacao") return "proposta"
    if (canonical === "fechado") return "fechamento"
    return canonical as CrmStageId
  }
  if (canonical === "contato" || canonical === "qualificacao") return "primeiro-contato"
  if (canonical === "visita") return "visita-agendada"
  if (canonical === "cotacao" || canonical === "contrato") return "negociacao"
  if (canonical === "fechamento") return "fechado"
  return canonical as CrmStageId
}
