import type { BusinessUnitType } from "@/lib/business-units/constants"
import type { CrmStageId } from "@/lib/data-access/modules/crm"

export function boardDealStage(
  stage: string,
  unitType: BusinessUnitType | null | undefined,
  boardType: BusinessUnitType,
): CrmStageId {
  const canonical =
    stage === "fechado"
      ? "fechamento"
      : stage === "qualificacao"
        ? unitType === "REAL_ESTATE"
          ? "visita"
          : "contato"
        : stage === "negociacao"
          ? unitType === "REAL_ESTATE"
            ? "contrato"
            : "proposta"
          : stage
  if (boardType === "INSURANCE") {
    if (canonical === "visita") return "contato"
    if (canonical === "contrato") return "proposta"
    return canonical as CrmStageId
  }
  if (canonical === "contato") return "visita"
  if (canonical === "cotacao") return "proposta"
  return canonical as CrmStageId
}
