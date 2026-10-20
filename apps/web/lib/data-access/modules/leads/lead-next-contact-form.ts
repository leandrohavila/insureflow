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

export function isoToDateTimeInputs(iso: string | null | undefined) {
  if (!iso) return { date: "", time: "09:00" }
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "09:00" }
  const pad = (value: number) => String(value).padStart(2, "0")
  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  }
}

export type RenewalReminderMode = "suggested" | "manual" | "disabled" | "completed"

export type RenewalReminderFieldSlice = {
  renewalReminderD60Date: string
  renewalReminderD60Time: string
  renewalReminderD60Mode?: RenewalReminderMode
  renewalReminderD30Date: string
  renewalReminderD30Time: string
  renewalReminderD30Mode?: RenewalReminderMode
  renewalReminderD15Date: string
  renewalReminderD15Time: string
  renewalReminderD15Mode?: RenewalReminderMode
}

const RENEWAL_REMINDER_SLOTS = [
  ["renewalReminderD60Date", "renewalReminderD60Time", "renewalReminderD60Mode"],
  ["renewalReminderD30Date", "renewalReminderD30Time", "renewalReminderD30Mode"],
  ["renewalReminderD15Date", "renewalReminderD15Time", "renewalReminderD15Mode"],
] as const

/**
 * Lembrete manual, desativado ou concluído permanece ao mudar o vencimento.
 * Lembrete que ainda acompanha a sugestão recebe a nova data.
 */
export function applyPolicyExpiryChange<T extends RenewalReminderFieldSlice>(
  current: T & { policyExpiresAt: string },
  nextExpiresAt: string,
): T & { policyExpiresAt: string } {
  const previous = suggestRenewalReminderFields(current.policyExpiresAt)
  const next = suggestRenewalReminderFields(nextExpiresAt)
  const reminders = { ...current, policyExpiresAt: nextExpiresAt }
  for (const [dateKey, timeKey, modeKey] of RENEWAL_REMINDER_SLOTS) {
    const mode = current[modeKey]
    if (mode === "disabled" || mode === "completed" || mode === "manual") {
      continue
    }
    const stillSuggested =
      current[dateKey] === previous[dateKey] &&
      current[timeKey] === previous[timeKey]
    if (mode === "suggested" || stillSuggested) {
      reminders[dateKey] = next[dateKey]
      reminders[timeKey] = next[timeKey]
      reminders[modeKey] = "suggested"
    }
  }
  return reminders
}

export function describeRenewalRecalculation(
  form: RenewalReminderFieldSlice & { policyExpiresAt: string },
) {
  const next = suggestRenewalReminderFields(form.policyExpiresAt)
  return RENEWAL_REMINDER_SLOTS.map(([dateKey, timeKey, modeKey]) => {
    const label = dateKey.includes("D60")
      ? "D-60"
      : dateKey.includes("D30")
        ? "D-30"
        : "D-15"
    const suggestion = `${next[dateKey]} às ${next[timeKey]}`
    const mode = form[modeKey]
    if (mode === "disabled") {
      return `${label} desativado será reativado para ${suggestion}.`
    }
    if (mode === "manual") {
      return `${label} em ${form[dateKey]} às ${form[timeKey]} será substituído pela sugestão ${suggestion}.`
    }
    if (mode === "completed") {
      return `${label} concluído receberá uma nova sugestão ${suggestion}. A atividade concluída permanece no histórico.`
    }
    return `${label} permanece na sugestão ${suggestion}.`
  })
}

export function applyExplicitRenewalRecalculation<
  T extends RenewalReminderFieldSlice & { policyExpiresAt: string },
>(form: T): T {
  const next = suggestRenewalReminderFields(form.policyExpiresAt)
  return {
    ...form,
    ...next,
    renewalReminderD60Mode: "suggested",
    renewalReminderD30Mode: "suggested",
    renewalReminderD15Mode: "suggested",
  }
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
  renewalReminderD60Mode?: RenewalReminderMode
  renewalReminderD30Date: string
  renewalReminderD30Time: string
  renewalReminderD30Mode?: RenewalReminderMode
  renewalReminderD15Date: string
  renewalReminderD15Time: string
  renewalReminderD15Mode?: RenewalReminderMode
}

export function leadFormToAgendaFields(form: LeadNextContactFormSlice) {
  const presetDays =
    form.followUpDays && form.followUpDays !== NEXT_CONTACT_PRESET_CUSTOM
      ? Number(form.followUpDays)
      : undefined
  const presetAt = presetDays ? shiftDateInputToIso(presetDays) : undefined
  const customAt =
    form.followUpDays === NEXT_CONTACT_PRESET_CUSTOM
      ? combineDateAndTime(form.nextContactDate, form.nextContactTime)
      : undefined
  const nextContactAt = customAt ?? presetAt ?? null
  const reminder = (
    date: string,
    time: string,
    mode: RenewalReminderMode | undefined,
  ) => {
    if (mode === "completed") return undefined
    if (!form.policyExpiresAt || mode === "disabled") return null
    return combineDateAndTime(date, time) ?? null
  }
  const renewalReminderD60 = reminder(
    form.renewalReminderD60Date,
    form.renewalReminderD60Time,
    form.renewalReminderD60Mode,
  )
  const renewalReminderD30 = reminder(
    form.renewalReminderD30Date,
    form.renewalReminderD30Time,
    form.renewalReminderD30Mode,
  )
  const renewalReminderD15 = reminder(
    form.renewalReminderD15Date,
    form.renewalReminderD15Time,
    form.renewalReminderD15Mode,
  )

  return {
    policyExpiresAt: form.policyExpiresAt || null,
    nextContactAt,
    ...(nextContactAt
      ? {
          nextContactType: form.nextContactType || "whatsapp",
          nextContactNotes: form.nextContactNotes.trim() || null,
        }
      : { nextContactType: null, nextContactNotes: null }),
    ...(renewalReminderD60 !== undefined
      ? { renewalReminderD60 }
      : {}),
    ...(renewalReminderD30 !== undefined
      ? { renewalReminderD30 }
      : {}),
    ...(renewalReminderD15 !== undefined
      ? { renewalReminderD15 }
      : {}),
  }
}

function shiftDateInputToIso(days: number) {
  const parsed = new Date()
  parsed.setDate(parsed.getDate() + days)
  parsed.setHours(9, 0, 0, 0)
  return parsed.toISOString()
}
