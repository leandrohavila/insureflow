export const NEXT_CONTACT_PRESET_CUSTOM = "custom"

export const NEXT_CONTACT_ACTIVITY_OPTIONS = [
  { value: "call", label: "Ligação" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "meeting", label: "Reunião" },
  { value: "visit", label: "Visita" },
  { value: "follow_up", label: "Follow-up" },
  { value: "renewal", label: "Renovação" },
  { value: "task", label: "Tarefa" },
] as const

export function combineDateAndTime(date: string, time: string) {
  const day = date.trim()
  if (!day) return undefined
  const clock = time.trim() || "09:00"
  const parsed = new Date(`${day}T${clock}`)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

export function shiftDateInput(dateInput: string, days: number) {
  const parsed = new Date(`${dateInput}T09:00:00`)
  if (Number.isNaN(parsed.getTime())) return ""
  parsed.setDate(parsed.getDate() + days)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
}

export function suggestRenewalReminderFields(expiresAt: string) {
  if (!expiresAt) {
    return {
      renewalReminderD60Date: "",
      renewalReminderD60Time: "09:00",
      renewalReminderD30Date: "",
      renewalReminderD30Time: "09:00",
      renewalReminderD15Date: "",
      renewalReminderD15Time: "09:00",
    }
  }
  return {
    renewalReminderD60Date: shiftDateInput(expiresAt, -60),
    renewalReminderD60Time: "09:00",
    renewalReminderD30Date: shiftDateInput(expiresAt, -30),
    renewalReminderD30Time: "09:00",
    renewalReminderD15Date: shiftDateInput(expiresAt, -15),
    renewalReminderD15Time: "09:00",
  }
}

export type LeadNextContactFormSlice = {
  followUpDays: string
  nextContactDate: string
  nextContactTime: string
  nextContactType: string
  nextContactNotes: string
  policyExpiresAt: string
  renewalReminderD60Date: string
  renewalReminderD60Time: string
  renewalReminderD30Date: string
  renewalReminderD30Time: string
  renewalReminderD15Date: string
  renewalReminderD15Time: string
}

export function leadFormToAgendaFields(form: LeadNextContactFormSlice) {
  const nextContactAt =
    form.followUpDays === NEXT_CONTACT_PRESET_CUSTOM
      ? combineDateAndTime(form.nextContactDate, form.nextContactTime)
      : undefined
  const followUpDays =
    form.followUpDays && form.followUpDays !== NEXT_CONTACT_PRESET_CUSTOM
      ? Number(form.followUpDays)
      : undefined

  return {
    ...(followUpDays ? { followUpDays, followUpType: "WHATSAPP" as const } : {}),
    ...(nextContactAt
      ? {
          nextContactAt,
          nextContactType: form.nextContactType || "whatsapp",
          nextContactNotes: form.nextContactNotes.trim() || undefined,
        }
      : {}),
    ...(form.policyExpiresAt
      ? {
          renewalReminderD60: combineDateAndTime(
            form.renewalReminderD60Date,
            form.renewalReminderD60Time,
          ),
          renewalReminderD30: combineDateAndTime(
            form.renewalReminderD30Date,
            form.renewalReminderD30Time,
          ),
          renewalReminderD15: combineDateAndTime(
            form.renewalReminderD15Date,
            form.renewalReminderD15Time,
          ),
        }
      : {}),
  }
}
