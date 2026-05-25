import type { Activity, ActivityType } from "@/lib/data-access/modules/activities"

export type TaskTemporalStatus = "overdue" | "today" | "upcoming" | "undated" | "completed"

export type TaskPriority = "alta" | "media" | "baixa"

export type EnrichedTask = {
  activity: Activity
  entityTitle: string
  entityType: "lead" | "deal" | "unknown"
  entityId: string | null
  entityCompany: string | null
  status: TaskTemporalStatus
  sortDate: Date
  priority: TaskPriority
}

export type TaskSectionKey = "overdue" | "today" | "upcoming" | "completed"

export const TASK_SECTION_LABELS: Record<TaskSectionKey, string> = {
  overdue: "Atrasadas",
  today: "Hoje",
  upcoming: "Próximas",
  completed: "Concluídas",
}

export const TASK_FILTER_LABELS = {
  all: "Todas",
  today: "Hoje",
  overdue: "Atrasadas",
  completed: "Concluídas",
} as const

export type TaskFilter = keyof typeof TASK_FILTER_LABELS

export const TASK_FILTER_ACCENT: Record<TaskFilter, string | undefined> = {
  all: undefined,
  overdue: "var(--crm-tone-danger)",
  today: "var(--crm-tone-info)",
  completed: "var(--crm-tone-success)",
}

export const TASK_STATUS_CONFIG: Record<
  Exclude<TaskTemporalStatus, "completed">,
  { label: string; tone: "danger" | "info" | "neutral" | "warn"; row: string }
> = {
  overdue: {
    label: "Atrasada",
    tone: "danger",
    row: "task-row--overdue",
  },
  today: {
    label: "Hoje",
    tone: "info",
    row: "task-row--today",
  },
  upcoming: {
    label: "Agendada",
    tone: "neutral",
    row: "task-row--upcoming",
  },
  undated: {
    label: "Sem prazo",
    tone: "warn",
    row: "task-row--undated",
  },
}

export const COMPLETED_LIMIT = 40

export function getPendingTaskFilters() {
  return {
    status: "pending" as const,
    limit: 100,
  }
}

export function getCompletedTaskFilters() {
  return {
    status: "completed" as const,
    limit: COMPLETED_LIMIT,
  }
}

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfToday(): Date {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d
}

export function classifyFollowUpStatus(nextFollowUpAt: string): Exclude<TaskTemporalStatus, "completed" | "undated"> {
  const date = new Date(nextFollowUpAt)
  const todayStart = startOfToday()
  const todayEnd = endOfToday()
  if (date < todayStart) return "overdue"
  if (date >= todayStart && date <= todayEnd) return "today"
  return "upcoming"
}

export function derivePriority(
  status: TaskTemporalStatus,
  type: ActivityType,
): TaskPriority {
  if (status === "overdue") return "alta"
  if (status === "today") {
    return type === "meeting" || type === "follow_up" ? "alta" : "media"
  }
  if (type === "meeting") return "media"
  return "baixa"
}

export function formatTaskSla(iso: string | null, status: TaskTemporalStatus): string {
  if (!iso) return "Sem prazo definido"

  const date = new Date(iso)
  const today = startOfToday()

  const timeStr = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)

  if (status === "overdue") {
    const daysDiff = Math.ceil(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysDiff === 1) return `1 dia atrasado · ${timeStr}`
    return `${daysDiff} dias atrasado · ${timeStr}`
  }

  if (status === "today") return `Vence hoje · ${timeStr}`

  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date)
  return `${weekday} · ${timeStr}`
}

export function formatCompletedAt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function taskMatchesSearch(task: EnrichedTask, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    task.activity.subject,
    task.activity.description ?? "",
    task.activity.outcome ?? "",
    task.entityTitle,
    task.entityCompany ?? "",
    task.activity.performedBy.name,
  ]
    .join(" ")
    .toLowerCase()

  return haystack.includes(q)
}
