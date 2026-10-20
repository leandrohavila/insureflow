import type { CreateLeadInput, LeadStatus } from "./types"
import type { InterestCategory } from "@/lib/business-units/constants"

/** Payload JSON enviado ao BFF — espelha CreateLeadDto do backend. */
export type CreateLeadPayload = {
  name: string
  email?: string
  phone?: string
  company?: string
  source?: string
  documentType?: "cpf" | "cnpj"
  document?: string
  status?: LeadStatus
  notes?: string
  assignedTo?: string
  businessUnitId?: string
  interestCategories?: InterestCategory[]
  followUpDays?: number
  followUpType?: "CALL" | "WHATSAPP" | "EMAIL" | "MEETING"
  opportunityType?: string
  currentInsurer?: string
  currentPolicyNumber?: string
  policyExpiresAt?: string | null
  nextContactAt?: string | null
  nextContactType?: string | null
  nextContactNotes?: string | null
  renewalReminderD60?: string | null
  renewalReminderD30?: string | null
  renewalReminderD15?: string | null
}

function optionalValue(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

/** Normaliza input do LeadDialog para o contrato HTTP de criação. */
export function buildCreateLeadPayload(
  input: CreateLeadInput,
): CreateLeadPayload {
  const payload: CreateLeadPayload = {
    name: input.name.trim(),
  }

  const email = optionalValue(input.email)
  if (email) payload.email = email

  const phone = optionalValue(input.phone)
  if (phone) payload.phone = phone

  const company = optionalValue(input.company)
  if (company) payload.company = company

  const source = optionalValue(input.source)
  if (source) payload.source = source

  const notes = optionalValue(input.notes)
  if (notes) payload.notes = notes

  const assignedTo = optionalValue(input.assignedTo)
  if (assignedTo) payload.assignedTo = assignedTo

  if (input.documentType && input.document?.trim()) {
    payload.documentType = input.documentType
    payload.document = input.document.trim()
  }

  if (input.status) payload.status = input.status
  if (input.businessUnitId) payload.businessUnitId = input.businessUnitId
  if (input.interestCategories?.length) {
    payload.interestCategories = input.interestCategories
  }
  if (input.followUpDays) payload.followUpDays = input.followUpDays
  if (input.followUpType) payload.followUpType = input.followUpType

  const opportunityType = optionalValue(input.opportunityType)
  if (opportunityType) payload.opportunityType = opportunityType
  const currentInsurer = optionalValue(input.currentInsurer)
  if (currentInsurer) payload.currentInsurer = currentInsurer
  const currentPolicyNumber = optionalValue(input.currentPolicyNumber)
  if (currentPolicyNumber) payload.currentPolicyNumber = currentPolicyNumber
  const policyExpiresAt = input.policyExpiresAt
  if (policyExpiresAt) payload.policyExpiresAt = policyExpiresAt
  else if (policyExpiresAt === null) payload.policyExpiresAt = null
  const nextContactAt = input.nextContactAt
  if (nextContactAt) payload.nextContactAt = nextContactAt
  else if (nextContactAt === null) payload.nextContactAt = null
  const nextContactType = optionalValue(input.nextContactType ?? undefined)
  if (nextContactType) payload.nextContactType = nextContactType
  else if (input.nextContactType === null) payload.nextContactType = null
  const nextContactNotes = optionalValue(input.nextContactNotes ?? undefined)
  if (nextContactNotes) payload.nextContactNotes = nextContactNotes
  else if (input.nextContactNotes === null) payload.nextContactNotes = null
  assignNullableDate(payload, "renewalReminderD60", input.renewalReminderD60)
  assignNullableDate(payload, "renewalReminderD30", input.renewalReminderD30)
  assignNullableDate(payload, "renewalReminderD15", input.renewalReminderD15)

  return payload
}

function assignNullableDate(
  payload: CreateLeadPayload,
  key: "renewalReminderD60" | "renewalReminderD30" | "renewalReminderD15",
  value: string | null | undefined,
) {
  if (value) payload[key] = value
  else if (value === null) payload[key] = null
}
