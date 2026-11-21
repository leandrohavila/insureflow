import {
  INTEREST_CATEGORY_LABELS,
  type InterestCategory,
} from "@/lib/business-units/constants"
import { formatDocumentMask, formatStoredPhone } from "@/lib/documents/document"
import type { Lead } from "@/lib/data-access/modules/leads"
import { isLeadConverted, leadOwnerDisplayName } from "@/lib/leads/lead-owner"
import { leadTelHref, leadWhatsAppHref } from "@/lib/leads/lead-operational-signals"

export const LEAD_DETAIL_OPPORTUNITY_LABEL: Record<string, string> = {
  new_business: "Novo negócio",
  renewal: "Renovação",
  cross_sell: "Cross sell",
  indication: "Indicação",
}

export const LEAD_DETAIL_EMPTY = "Não informado"

export function formatLeadDetailDate(iso?: string | null) {
  if (!iso) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("pt-BR")
}

export function leadDetailDocument(
  lead: Pick<Lead, "document" | "documentType">,
) {
  const document = lead.document?.trim()
  if (!document) return null
  if (lead.documentType === "cpf" || lead.documentType === "cnpj") {
    return {
      label: lead.documentType === "cpf" ? "CPF" : "CNPJ",
      value: formatDocumentMask(lead.documentType, document),
    }
  }
  return { label: "Documento", value: document }
}

export function leadDetailPhone(phone?: string | null) {
  const formatted = formatStoredPhone(phone)
  return formatted || null
}

export function leadDetailUnits(
  lead: Pick<Lead, "businessUnit" | "businessUnits">,
) {
  const linked = lead.businessUnits ?? []
  const units = [
    ...linked,
    ...(lead.businessUnit && !linked.some((unit) => unit.id === lead.businessUnit?.id)
      ? [lead.businessUnit]
      : []),
  ]
  const names = units.map((unit) => unit.name?.trim()).filter(Boolean)
  return names.length ? names.join(", ") : null
}

export function leadDetailInterests(
  lead: Pick<Lead, "interestCategories">,
) {
  return (lead.interestCategories ?? [])
    .map(
      (item) =>
        INTEREST_CATEGORY_LABELS[item as InterestCategory] ?? item,
    )
    .filter(Boolean)
}

export function leadDetailOpportunity(type?: string | null) {
  const value = type?.trim()
  if (!value) return null
  return LEAD_DETAIL_OPPORTUNITY_LABEL[value] ?? value
}

export function leadDetailOwner(lead: Pick<Lead, "owner" | "assignedTo">) {
  return leadOwnerDisplayName(lead) || null
}

export const LEAD_CONTACT_ACTIVITY_TYPES = [
  "call",
  "whatsapp",
  "email",
  "meeting",
  "visit",
] as const

export const LEAD_SCHEDULE_ACTIVITY_TYPES = [
  "follow_up",
  "meeting",
  "task",
  "visit",
] as const

/** Perdido, com retorno permitido e data prevista. A data não reativa sozinha. */
export function leadCanReactivate(
  lead: Pick<Lead, "status" | "dealId" | "reactivationEnabled" | "nextReactivationAt">,
) {
  if (lead.dealId || lead.status !== "lost") return false
  if (lead.reactivationEnabled !== true) return false
  return Boolean(lead.nextReactivationAt)
}

/** Ação explícita: contacted, sem conversão e sem apagar a perda. */
export function leadReactivationPayload() {
  return { toStatus: "contacted" as const }
}

export function leadQualificationSnapshot(
  lead: Pick<
    Lead,
    | "phone"
    | "email"
    | "company"
    | "document"
    | "interestCategories"
    | "opportunityType"
    | "currentInsurer"
    | "owner"
    | "assignedTo"
    | "lastInteractionAt"
    | "lastContactAt"
  >,
) {
  const interests = leadDetailInterests(lead)
  const opportunity = leadDetailOpportunity(lead.opportunityType)
  const owner = leadDetailOwner(lead)
  const collected = [
    lead.phone?.trim() || lead.email?.trim() ? "Contato" : null,
    interests.length ? interests.join(", ") : null,
    lead.company?.trim() ? `Empresa: ${lead.company.trim()}` : null,
    lead.document?.trim() ? "Documento" : null,
    lead.currentInsurer?.trim()
      ? `Seguradora: ${lead.currentInsurer.trim()}`
      : null,
  ].filter((item): item is string => Boolean(item))
  const pending = [
    lead.phone?.trim() || lead.email?.trim()
      ? null
      : "Telefone ou e-mail",
    interests.length ? null : "Ramo de interesse",
    owner ? null : "Responsável",
  ].filter((item): item is string => Boolean(item))

  return {
    seeking: opportunity
      ? [opportunity, ...interests].join(" · ")
      : interests.join(", ") || null,
    interests,
    collected,
    pending,
    owner,
    lastContactAt: lead.lastInteractionAt ?? lead.lastContactAt ?? null,
  }
}

export function leadNextAction(input: {
  nextContactAt?: string | null
  nextContactType?: string | null
  nextContactNotes?: string | null
  followUps?: Array<{
    status?: string | null
    nextFollowUpAt?: string | null
    subject?: string | null
  }>
}) {
  const candidates: Array<{ at: string; detail: string }> = []
  if (input.nextContactAt) {
    candidates.push({
      at: input.nextContactAt,
      detail:
        [input.nextContactType, input.nextContactNotes?.trim()]
          .filter(Boolean)
          .join(" · ") || "Próximo contato",
    })
  }
  for (const item of input.followUps ?? []) {
    if (!item.nextFollowUpAt || item.status === "cancelled") continue
    candidates.push({
      at: item.nextFollowUpAt,
      detail: item.subject?.trim() || "Acompanhamento agendado",
    })
  }
  if (candidates.length === 0) {
    return { scheduled: false as const, label: "Sem próxima ação" }
  }
  candidates.sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  )
  const now = Date.now()
  const upcoming =
    candidates.find((item) => new Date(item.at).getTime() >= now) ??
    candidates[candidates.length - 1]
  if (!upcoming) {
    return { scheduled: false as const, label: "Sem próxima ação" }
  }
  return {
    scheduled: true as const,
    at: upcoming.at,
    label: upcoming.detail,
  }
}

export type LeadDetailActionAccess = {
  canEdit: boolean
  canConvert: boolean
  canSchedule: boolean
  canViewDeals: boolean
}

/** Ações já suportadas. Perdido não converte; reativação não vira negócio. */
export function leadDetailActions(
  lead: Pick<Lead, "status" | "dealId" | "phone" | "email">,
  access: LeadDetailActionAccess,
) {
  const converted = isLeadConverted(lead)
  const lost = lead.status === "lost"
  return {
    edit: access.canEdit,
    schedule: access.canSchedule,
    convert: access.canConvert && !converted && !lost,
    openDeal: access.canViewDeals && Boolean(lead.dealId),
    markLost: access.canEdit && !converted && !lost,
    showLoss: lost,
    call: Boolean(leadTelHref(lead.phone)),
    whatsapp: Boolean(leadWhatsAppHref(lead.phone)),
    email: Boolean(lead.email?.trim()),
  }
}
