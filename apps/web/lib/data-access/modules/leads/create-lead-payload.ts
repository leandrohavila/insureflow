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
  policyExpiresAt?: string
  nextContactAt?: string
  nextContactType?: string
  nextContactNotes?: string
  renewalReminderD60?: string
  renewalReminderD30?: string
  renewalReminderD15?: string
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
  const policyExpiresAt = optionalValue(input.policyExpiresAt)
  if (policyExpiresAt) payload.policyExpiresAt = policyExpiresAt
  const nextContactAt = optionalValue(input.nextContactAt)
  if (nextContactAt) payload.nextContactAt = nextContactAt
  const nextContactType = optionalValue(input.nextContactType)
  if (nextContactType) payload.nextContactType = nextContactType
  const nextContactNotes = optionalValue(input.nextContactNotes)
  if (nextContactNotes) payload.nextContactNotes = nextContactNotes
  const renewalReminderD60 = optionalValue(input.renewalReminderD60)
  if (renewalReminderD60) payload.renewalReminderD60 = renewalReminderD60
  const renewalReminderD30 = optionalValue(input.renewalReminderD30)
  if (renewalReminderD30) payload.renewalReminderD30 = renewalReminderD30
  const renewalReminderD15 = optionalValue(input.renewalReminderD15)
  if (renewalReminderD15) payload.renewalReminderD15 = renewalReminderD15

  return payload
}
