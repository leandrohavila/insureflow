/**
 * Cores semânticas por tipo de atividade.
 * Uso atual: Agenda Comercial. Outros módulos podem reutilizar este mapa
 * sem copiar os hexadecimais.
 */
export type ActivityVisualKind =
  | "all"
  | "follow_up"
  | "renewal"
  | "reactivation"
  | "sla"
  | "call"
  | "whatsapp"
  | "email"
  | "meeting"
  | "visit"
  | "task"

export type ActivityKindColor = {
  icon: string
  surface: string
}

export const activityKindColors: Record<ActivityVisualKind, ActivityKindColor> = {
  all: { icon: "#10294B", surface: "#F5F0E7" },
  follow_up: { icon: "#A87528", surface: "#F8EDDB" },
  renewal: { icon: "#A87528", surface: "#F8EDDB" },
  reactivation: { icon: "#315B8A", surface: "#E9EFF8" },
  sla: { icon: "#10294B", surface: "#E7EEF6" },
  call: { icon: "#2878C8", surface: "#E7F0FA" },
  whatsapp: { icon: "#16834A", surface: "#E4F4EB" },
  email: { icon: "#C34C68", surface: "#FCECEF" },
  meeting: { icon: "#7956B5", surface: "#F0EBFA" },
  visit: { icon: "#C08028", surface: "#FFF2DF" },
  task: { icon: "#526783", surface: "#E9EDF4" },
}

const AGENDA_TYPE_KIND: Record<string, ActivityVisualKind> = {
  FOLLOW_UP: "follow_up",
  RENEWAL: "renewal",
  REACTIVATION: "reactivation",
  SLA: "sla",
  CALL: "call",
  WHATSAPP: "whatsapp",
  EMAIL: "email",
  MEETING: "meeting",
  VISIT: "visit",
  TASK: "task",
}

export function activityKindFromAgendaType(type: string): ActivityVisualKind {
  return AGENDA_TYPE_KIND[type] ?? "all"
}

export function activityKindFromActivityType(type: string): ActivityVisualKind {
  if (type === "follow_up") return "follow_up"
  if (type === "renewal") return "renewal"
  if (type === "call") return "call"
  if (type === "whatsapp") return "whatsapp"
  if (type === "email") return "email"
  if (type === "meeting") return "meeting"
  if (type === "visit") return "visit"
  if (type === "task") return "task"
  return "all"
}
