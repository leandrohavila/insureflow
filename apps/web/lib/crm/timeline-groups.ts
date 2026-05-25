import type { Activity } from "@/lib/data-access/modules/activities"

/** Buckets temporais da timeline enterprise (Fase 2.2). */
export type TimelineGroupKey =
  | "today"
  | "yesterday"
  | "this-week"
  | "older"

export type TimelineGroupLabel =
  | "Hoje"
  | "Ontem"
  | "Esta semana"
  | "Mais antigas"

export type TimelineGroup = {
  key: TimelineGroupKey
  label: TimelineGroupLabel
  activities: Activity[]
}

const GROUP_ORDER: TimelineGroupKey[] = [
  "today",
  "yesterday",
  "this-week",
  "older",
]

const GROUP_LABELS: Record<TimelineGroupKey, TimelineGroupLabel> = {
  today: "Hoje",
  yesterday: "Ontem",
  "this-week": "Esta semana",
  older: "Mais antigas",
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

/**
 * Classifica uma atividade em um dos quatro grupos temporais operacionais.
 * Puramente visual — não altera ordem nem paginação do servidor.
 */
export function timelineGroupKeyOf(
  iso: string,
  now: Date = new Date(),
): TimelineGroupKey {
  const dayStart = startOfDay(new Date(iso))
  const today = startOfDay(now)
  const diffDays = Math.floor(
    (today.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays <= 0) return "today"
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return "this-week"
  return "older"
}

/**
 * Agrupa atividades preservando a ordem descendente do servidor.
 * Retorna apenas grupos não vazios, na ordem Hoje → Mais antigas.
 */
export function buildTimelineGroups(
  activities: Activity[],
  now: Date = new Date(),
): TimelineGroup[] {
  if (activities.length === 0) return []

  const buckets = new Map<TimelineGroupKey, Activity[]>()

  for (const activity of activities) {
    const key = timelineGroupKeyOf(activity.occurredAt, now)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(activity)
    } else {
      buckets.set(key, [activity])
    }
  }

  return GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    label: GROUP_LABELS[key],
    activities: buckets.get(key)!,
  }))
}

export function formatTimelineCompactTime(
  iso: string,
  now: Date = new Date(),
): string {
  const date = new Date(iso)
  const timeStr = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)

  const key = timelineGroupKeyOf(iso, now)

  if (key === "today") return timeStr

  if (key === "yesterday") return `Ontem · ${timeStr}`

  if (key === "this-week") {
    const weekday = new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
    }).format(date)
    return `${weekday.replace(".", "")} · ${timeStr}`
  }

  const dateStr = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date)

  return `${dateStr} · ${timeStr}`
}

export function formatTimelineFullDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}
