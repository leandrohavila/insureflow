import type {
  ProposalStatus,
  QuoteLineStatus,
  QuoteWorkflowStatus,
} from "@/lib/data-access/modules/quotes"

export const quoteWorkflowStatusLabels: Record<QuoteWorkflowStatus, string> = {
  received: "Recebido",
  in_analysis: "Em análise",
  quote_created: "Cotação criada",
  quote_sent: "Enviado",
  negotiation: "Negociação",
  closed_won: "Fechado (ganho)",
  closed_lost: "Fechado (perdido)",
}

export const quoteLineStatusLabels: Record<QuoteLineStatus, string> = {
  draft: "Rascunho",
  quoted: "Cotado",
  sent: "Enviado",
  selected: "Selecionado",
  rejected: "Recusado",
  expired: "Expirado",
}

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  draft: "Criada",
  sent: "Enviada",
  viewed: "Visualizada",
  accepted: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
}

export const PROPOSAL_STATUS_TONE: Record<
  ProposalStatus,
  "neutral" | "info" | "success" | "warn" | "danger" | "violet"
> = {
  draft: "neutral",
  sent: "info",
  viewed: "violet",
  accepted: "success",
  rejected: "danger",
  expired: "warn",
}

export function quoteWorkflowLabel(status: QuoteWorkflowStatus | string) {
  if (status in quoteWorkflowStatusLabels) {
    return quoteWorkflowStatusLabels[status as QuoteWorkflowStatus]
  }
  return status.replace(/_/g, " ")
}

export function quoteLineStatusLabel(status: QuoteLineStatus | string) {
  if (status in quoteLineStatusLabels) {
    return quoteLineStatusLabels[status as QuoteLineStatus]
  }
  return status.replace(/_/g, " ")
}

export function proposalStatusLabel(status: ProposalStatus | string) {
  if (status in proposalStatusLabels) {
    return proposalStatusLabels[status as ProposalStatus]
  }
  return status.replace(/_/g, " ")
}
