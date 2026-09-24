import type { Activity } from "@/lib/data-access/modules/activities"

/** Estágio gravado pela conversão quando a tela não escolhe outro. */
export const CONVERSION_INITIAL_STAGE_LABEL = "Novo Lead"

export type ConversionTimelineStory = {
  kind: "conversion"
  id: string
  occurredAt: string
  steps: readonly [string, string, string]
}

export type TimelinePresentationItem =
  | { kind: "activity"; activity: Activity }
  | ConversionTimelineStory

function storyId(dealId: string) {
  return `conversion-story:${dealId}`
}

function dealTitleFromSubject(subject: string) {
  const parts = subject.split("—")
  const title = parts.length > 1 ? parts.slice(1).join("—").trim() : ""
  return title
}

/**
 * Junta os dois eventos já persistidos na conversão
 * (`lead_converted` + `deal_created`) numa sequência legível.
 * Não cria atividade nova e não altera o que está no banco.
 */
export function foldLeadConversionTimeline(
  activities: Activity[],
): TimelinePresentationItem[] {
  const convertedByDeal = new Map<string, Activity>()
  const createdByDeal = new Map<string, Activity>()

  for (const activity of activities) {
    if (!activity.dealId) continue
    if (activity.operationalEventKind === "lead_converted") {
      convertedByDeal.set(activity.dealId, activity)
    } else if (activity.operationalEventKind === "deal_created") {
      createdByDeal.set(activity.dealId, activity)
    }
  }

  const consumed = new Set<string>()
  const stories = new Map<string, ConversionTimelineStory>()

  for (const [dealId, converted] of convertedByDeal) {
    const created = createdByDeal.get(dealId)
    if (!created) continue
    consumed.add(converted.id)
    consumed.add(created.id)
    const dealTitle = dealTitleFromSubject(created.subject)
    const occurredAt =
      new Date(converted.occurredAt).getTime() >=
      new Date(created.occurredAt).getTime()
        ? converted.occurredAt
        : created.occurredAt
    stories.set(converted.id, {
      kind: "conversion",
      id: storyId(dealId),
      occurredAt,
      steps: [
        "Lead convertido",
        dealTitle ? `Negócio criado — ${dealTitle}` : "Negócio criado",
        `Estágio inicial: ${CONVERSION_INITIAL_STAGE_LABEL}`,
      ],
    })
  }

  const items: TimelinePresentationItem[] = []
  for (const activity of activities) {
    if (consumed.has(activity.id)) {
      const story = stories.get(activity.id)
      if (story) items.push(story)
      continue
    }
    items.push({ kind: "activity", activity })
  }
  return items
}
