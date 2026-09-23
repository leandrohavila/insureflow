import type { Lead, LeadListMeta } from "@/lib/data-access/modules/leads"

function isConverted(lead: Pick<Lead, "dealId" | "status">) {
  return Boolean(lead.dealId) || lead.status === "converted"
}

export type LeadPipelinePresentation = {
  converted: boolean
  statusLabel: "Não convertido" | "Negócio criado"
  stageLabel: string | null
  showConvert: boolean
  showOpenDeal: boolean
}

/**
 * Estado visual do lead em relação ao pipeline.
 * Não decide se a conversão é permitida no servidor — só o que a tela mostra.
 */
export function leadPipelinePresentation(
  lead: Pick<Lead, "dealId" | "status">,
  stageLabel?: string | null,
): LeadPipelinePresentation {
  const converted = isConverted(lead)
  return {
    converted,
    statusLabel: converted ? "Negócio criado" : "Não convertido",
    stageLabel: converted && stageLabel ? stageLabel : null,
    showConvert: !converted,
    showOpenDeal: Boolean(lead.dealId),
  }
}

export function unconvertedLeadCount(
  counts: LeadListMeta["counts"] | null | undefined,
): number {
  if (!counts) return 0
  return counts.new + counts.contacted + counts.qualified
}

export type PipelineEmptyGuidance = {
  leadCount: number
  title: string
  body: string
  actionLabel: "Ir para Leads"
  href: "/leads"
}

/**
 * Empty state do Kanban quando não há negócios e ainda existem leads vivos.
 * Leads perdidos não entram na conta.
 */
export function pipelineEmptyGuidance(input: {
  dealCount: number
  unconvertedLeadCount: number
}): PipelineEmptyGuidance | null {
  if (input.dealCount > 0 || input.unconvertedLeadCount <= 0) return null
  const count = input.unconvertedLeadCount
  const noun = count === 1 ? "lead" : "leads"
  const adjective = count === 1 ? "convertido" : "convertidos"
  return {
    leadCount: count,
    title: `Você possui ${count} ${noun} ainda não ${adjective}.`,
    body: "Converta um lead para criar seu primeiro negócio.",
    actionLabel: "Ir para Leads",
    href: "/leads",
  }
}

export const LEAD_OPPORTUNITY_PIPELINE_HINT =
  "Tipo de oportunidade classifica o lead. Para aparecer no Pipeline é necessário converter o lead em negócio."
