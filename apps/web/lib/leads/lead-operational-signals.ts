import type { Lead } from "@/lib/data-access/modules/leads"

export type LeadPriority = "high" | "medium" | "low"

export type LeadOperationalBadge =
  | "no_contact"
  | "contact_today"
  | "overdue"
  | "renewal_soon"

export const LEAD_OPERATIONAL_BADGE_LABEL: Record<LeadOperationalBadge, string> =
  {
    no_contact: "Sem contato",
    contact_today: "Contato hoje",
    overdue: "Atrasado",
    renewal_soon: "Renovação próxima",
  }

const DAY_MS = 24 * 60 * 60 * 1000
const RENEWAL_SOON_DAYS = 60
const OVERDUE_IDLE_DAYS = 3

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseDate(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function leadHasNoContact(lead: Lead): boolean {
  return (
    lead.status === "new" &&
    !lead.lastContactAt &&
    !lead.lastInteractionAt
  )
}

export function leadHadContactToday(lead: Lead, now = new Date()): boolean {
  const last = parseDate(lead.lastInteractionAt ?? lead.lastContactAt)
  if (!last) return false
  return startOfLocalDay(last).getTime() === startOfLocalDay(now).getTime()
}

export function leadIsOverdue(lead: Lead, now = new Date()): boolean {
  if (lead.status === "converted" || lead.status === "lost") return false
  const anchor =
    parseDate(lead.lastInteractionAt) ??
    parseDate(lead.lastContactAt) ??
    parseDate(lead.createdAt)
  if (!anchor) return false
  return now.getTime() - anchor.getTime() >= OVERDUE_IDLE_DAYS * DAY_MS
}

export function leadRenewalSoon(lead: Lead, now = new Date()): boolean {
  const expires = parseDate(lead.policyExpiresAt)
  if (!expires) return false
  const diff = expires.getTime() - startOfLocalDay(now).getTime()
  return diff >= 0 && diff <= RENEWAL_SOON_DAYS * DAY_MS
}

export function deriveLeadOperationalBadges(
  lead: Lead,
  now = new Date(),
): LeadOperationalBadge[] {
  const badges: LeadOperationalBadge[] = []
  if (leadHasNoContact(lead)) badges.push("no_contact")
  if (leadHadContactToday(lead, now)) badges.push("contact_today")
  if (leadIsOverdue(lead, now)) badges.push("overdue")
  if (leadRenewalSoon(lead, now)) badges.push("renewal_soon")
  return badges
}

export function deriveLeadPriority(lead: Lead): LeadPriority {
  if (leadHasNoContact(lead) || lead.status === "new") return "high"
  if (lead.status === "contacted") return "medium"
  return "low"
}

export const LEAD_PRIORITY_LABEL: Record<LeadPriority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
}

export function leadPhoneDigits(phone?: string | null) {
  return (phone ?? "").replace(/\D/g, "")
}

export function leadTelHref(phone?: string | null) {
  const digits = leadPhoneDigits(phone)
  return digits ? `tel:+${digits.startsWith("55") ? digits : `55${digits}`}` : null
}

export function leadWhatsAppHref(phone?: string | null) {
  const digits = leadPhoneDigits(phone)
  if (!digits) return null
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${withCountry}`
}
