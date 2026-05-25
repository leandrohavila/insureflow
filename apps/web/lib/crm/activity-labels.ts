import type { ActivityType } from "@/lib/data-access/modules/activities"

export const activityTypeLabels: Record<ActivityType, string> = {
  call: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  meeting: "Reunião",
  visit: "Visita",
  note: "Observação",
  follow_up: "Follow-up",
}

export const activityTypeSubjects: Record<ActivityType, string> = {
  call: "Ligação registrada",
  whatsapp: "Contato via WhatsApp",
  email: "E-mail enviado",
  meeting: "Reunião realizada",
  visit: "Visita realizada",
  note: "Observação",
  follow_up: "Follow-up agendado",
}
