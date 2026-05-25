import type { ActivityType } from "@/lib/data-access/modules/activities"
import { ACTIVITY_TYPES } from "@/lib/data-access/modules/activities"

import { activityTypeLabels } from "./activity-labels"

export type ActivityFormField =
  | "subject"
  | "description"
  | "occurredAt"
  | "outcome"
  | "nextFollowUpAt"

export const activityTypeEmojis: Record<ActivityType, string> = {
  call: "📞",
  whatsapp: "💬",
  email: "✉️",
  meeting: "🤝",
  visit: "🚗",
  note: "📝",
  follow_up: "⏰",
}

export const activityTypeOptions = ACTIVITY_TYPES.map((type) => ({
  type,
  label: activityTypeLabels[type],
  emoji: activityTypeEmojis[type],
}))

export const activityFormPlaceholders: Record<
  ActivityType,
  {
    subject: string
    description: string
    outcome: string
  }
> = {
  call: {
    subject: "Ex.: Ligação de qualificação",
    description: "Resumo da conversa, objeções e próximos passos",
    outcome: "Ex.: Cliente pediu proposta até sexta",
  },
  whatsapp: {
    subject: "Ex.: Retorno via WhatsApp",
    description: "Mensagens trocadas e contexto do contato",
    outcome: "Ex.: Aguardando documentação",
  },
  email: {
    subject: "Ex.: Proposta enviada por e-mail",
    description: "Assunto do e-mail e pontos principais",
    outcome: "Ex.: Cliente confirmou recebimento",
  },
  meeting: {
    subject: "Ex.: Reunião de alinhamento",
    description: "Participantes, pauta e decisões",
    outcome: "Ex.: Aprovado seguir para cotação",
  },
  visit: {
    subject: "Ex.: Visita técnica no cliente",
    description: "Local, contato presencial e achados",
    outcome: "Ex.: Necessário nova vistoria",
  },
  note: {
    subject: "Observação",
    description: "Registre o contexto operacional desta observação…",
    outcome: "",
  },
  follow_up: {
    subject: "Ex.: Retorno agendado",
    description: "O que precisa ser feito no próximo contato",
    outcome: "Ex.: Confirmar interesse na proposta",
  },
}

const NOTE_VISIBLE: ActivityFormField[] = ["description"]
const FOLLOW_UP_VISIBLE: ActivityFormField[] = [
  "subject",
  "description",
  "occurredAt",
  "nextFollowUpAt",
  "outcome",
]
const DEFAULT_VISIBLE: ActivityFormField[] = [
  "subject",
  "description",
  "occurredAt",
  "outcome",
  "nextFollowUpAt",
]

export function getActivityFormFields(type: ActivityType): {
  visible: ActivityFormField[]
  required: ActivityFormField[]
} {
  if (type === "note") {
    return { visible: NOTE_VISIBLE, required: ["description"] }
  }

  if (type === "follow_up") {
    return {
      visible: FOLLOW_UP_VISIBLE,
      required: ["subject", "nextFollowUpAt"],
    }
  }

  return {
    visible: DEFAULT_VISIBLE,
    required: ["subject", "occurredAt"],
  }
}

export function isActivityFormFieldVisible(
  type: ActivityType,
  field: ActivityFormField,
) {
  return getActivityFormFields(type).visible.includes(field)
}

export function isActivityFormFieldRequired(
  type: ActivityType,
  field: ActivityFormField,
) {
  return getActivityFormFields(type).required.includes(field)
}
