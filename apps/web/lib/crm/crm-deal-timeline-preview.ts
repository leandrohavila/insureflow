import {
  formatCurrency,
  stageLabelMap,
  type CrmDeal,
} from "@/lib/data-access/modules/crm"

/** Tipos de preview derivados de negócios — substituídos pelo domínio Activity no Sprint 1. */
export const CRM_DEAL_TIMELINE_PREVIEW_TYPES = [
  "created",
  "note",
  "value",
] as const

export type CrmDealTimelinePreviewType =
  (typeof CRM_DEAL_TIMELINE_PREVIEW_TYPES)[number]

export type CrmDealTimelinePreviewItem = {
  id: string
  type: CrmDealTimelinePreviewType
  title: string
  description: string
  time: string
  user: string
  occurredAt: string
}

export function formatDealTimelineRelativeTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  if (Number.isNaN(diffMs)) return "Agora"

  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return "Agora"
  if (minutes < 60) return `Há ${minutes}min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Há ${hours}h`

  const days = Math.floor(hours / 24)
  return `Há ${days}d`
}

function previewTypeFromDeal(deal: CrmDeal): CrmDealTimelinePreviewType {
  if (deal.value > 0) return "value"
  return "created"
}

function previewTitleFromDeal(deal: CrmDeal) {
  return deal.status === "won"
    ? `Negócio ganho — ${deal.title}`
    : deal.title
}

function previewDescriptionFromDeal(deal: CrmDeal, includeStage: boolean) {
  const parts = [deal.company, formatCurrency(deal.value)]
  if (includeStage) parts.push(stageLabelMap[deal.stage])
  return parts.join(" · ")
}

/** Preview temporário até o domínio Activity existir (Sprint 1). */
export function buildDealTimelinePreview(
  deals: CrmDeal[],
  options?: { limit?: number; includeStage?: boolean; relativeTime?: boolean },
): CrmDealTimelinePreviewItem[] {
  const limit = options?.limit ?? deals.length
  const includeStage = options?.includeStage ?? true
  const relativeTime = options?.relativeTime ?? false

  return deals
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit)
    .map((deal) => ({
      id: deal.id,
      type: previewTypeFromDeal(deal),
      title: previewTitleFromDeal(deal),
      description: previewDescriptionFromDeal(deal, includeStage),
      time: relativeTime
        ? formatDealTimelineRelativeTime(deal.updatedAt)
        : new Intl.DateTimeFormat("pt-BR").format(new Date(deal.updatedAt)),
      user: deal.owner,
      occurredAt: deal.updatedAt,
    }))
}
