import type { LeadDocumentType } from "../../../documents/document"
import {
  formatCnpjMask,
  formatCpfMask,
  formatStoredPhone,
} from "../../../documents/document"
import type { InterestCategory } from "@/lib/business-units/constants"
import type { Lead } from "./types"
import {
  suggestRenewalReminderFields,
  isoToDateTimeInputs,
  NEXT_CONTACT_PRESET_CUSTOM,
  type RenewalReminderMode,
} from "./lead-next-contact-form"

export type LeadDialogFormState = {
  name: string
  email: string
  phone: string
  company: string
  source: string
  documentType: LeadDocumentType
  document: string
  notes: string
  assignedTo: string
  opportunityType: string
  currentInsurer: string
  currentPolicyNumber: string
  policyExpiresAt: string
  businessUnitId: string
  interestCategories: InterestCategory[]
  followUpDays: string
  nextContactDate: string
  nextContactTime: string
  nextContactType: string
  nextContactNotes: string
  renewalReminderD60Date: string
  renewalReminderD60Time: string
  renewalReminderD60Mode: RenewalReminderMode
  renewalReminderD60CompletedAt: string
  renewalReminderD30Date: string
  renewalReminderD30Time: string
  renewalReminderD30Mode: RenewalReminderMode
  renewalReminderD30CompletedAt: string
  renewalReminderD15Date: string
  renewalReminderD15Time: string
  renewalReminderD15Mode: RenewalReminderMode
  renewalReminderD15CompletedAt: string
}

export const EMPTY_LEAD_DIALOG_FORM: LeadDialogFormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "",
  documentType: "cpf",
  document: "",
  notes: "",
  assignedTo: "",
  opportunityType: "",
  currentInsurer: "",
  currentPolicyNumber: "",
  policyExpiresAt: "",
  businessUnitId: "",
  interestCategories: [],
  followUpDays: "",
  nextContactDate: "",
  nextContactTime: "09:00",
  nextContactType: "whatsapp",
  nextContactNotes: "",
  renewalReminderD60Date: "",
  renewalReminderD60Time: "09:00",
  renewalReminderD60Mode: "suggested",
  renewalReminderD60CompletedAt: "",
  renewalReminderD30Date: "",
  renewalReminderD30Time: "09:00",
  renewalReminderD30Mode: "suggested",
  renewalReminderD30CompletedAt: "",
  renewalReminderD15Date: "",
  renewalReminderD15Time: "09:00",
  renewalReminderD15Mode: "suggested",
  renewalReminderD15CompletedAt: "",
}

function formatStoredDocument(
  documentType: LeadDocumentType | null | undefined,
  document: string | null | undefined,
) {
  if (!documentType || !document) return ""
  return documentType === "cpf"
    ? formatCpfMask(document)
    : formatCnpjMask(document)
}

export function getLeadDialogSessionKey(lead: Lead | null) {
  return lead?.id ?? "__new__"
}

export type BuildLeadDialogFormOptions = {
  lockedBusinessUnitId?: string
  defaultInterestCategories?: InterestCategory[]
}

export function buildLeadDialogFormState(
  lead: Lead | null,
  sessionName?: string | null,
  options?: BuildLeadDialogFormOptions,
): LeadDialogFormState {
  if (!lead) {
    return {
      ...EMPTY_LEAD_DIALOG_FORM,
      assignedTo: sessionName?.trim() ?? "",
      businessUnitId: options?.lockedBusinessUnitId ?? "",
      interestCategories: options?.defaultInterestCategories ?? [],
    }
  }

  return {
    name: lead.name ?? "",
    email: lead.email ?? "",
    phone: formatStoredPhone(lead.phone),
    company: lead.company ?? "",
    source: lead.source ?? "",
    documentType: lead.documentType ?? "cpf",
    document: formatStoredDocument(lead.documentType, lead.document),
    notes: lead.notes ?? "",
    assignedTo: lead.assignedTo ?? sessionName ?? "",
    opportunityType: lead.opportunityType ?? "",
    currentInsurer: lead.currentInsurer ?? "",
    currentPolicyNumber: lead.currentPolicyNumber ?? "",
    policyExpiresAt: lead.policyExpiresAt
      ? lead.policyExpiresAt.slice(0, 10)
      : "",
    businessUnitId:
      options?.lockedBusinessUnitId || lead.businessUnitId || "",
    interestCategories: lead.interestCategories ?? [],
    ...hydrateNextContact(lead),
    ...hydrateRenewalReminders(
      lead.policyExpiresAt ? lead.policyExpiresAt.slice(0, 10) : "",
      lead,
    ),
  }
}

function hydrateNextContact(lead: Lead) {
  if (!lead.nextContactAt) {
    return {
      followUpDays: "",
      nextContactDate: "",
      nextContactTime: "09:00",
      nextContactType: lead.nextContactType || "whatsapp",
      nextContactNotes: lead.nextContactNotes ?? "",
    }
  }
  const when = isoToDateTimeInputs(lead.nextContactAt)
  return {
    followUpDays: NEXT_CONTACT_PRESET_CUSTOM,
    nextContactDate: when.date,
    nextContactTime: when.time,
    nextContactType: lead.nextContactType || "whatsapp",
    nextContactNotes: lead.nextContactNotes ?? "",
  }
}

function hydrateRenewalReminders(
  expiresAt: string,
  lead: Lead,
) {
  const suggested = suggestRenewalReminderFields(expiresAt)
  const fields: ReturnType<typeof suggestRenewalReminderFields> & {
    renewalReminderD60Mode: RenewalReminderMode
    renewalReminderD60CompletedAt: string
    renewalReminderD30Mode: RenewalReminderMode
    renewalReminderD30CompletedAt: string
    renewalReminderD15Mode: RenewalReminderMode
    renewalReminderD15CompletedAt: string
  } = {
    ...suggested,
    renewalReminderD60Mode: "suggested",
    renewalReminderD60CompletedAt: "",
    renewalReminderD30Mode: "suggested",
    renewalReminderD30CompletedAt: "",
    renewalReminderD15Mode: "suggested",
    renewalReminderD15CompletedAt: "",
  }
  const slots = [
    {
      dateKey: "renewalReminderD60Date",
      timeKey: "renewalReminderD60Time",
      modeKey: "renewalReminderD60Mode",
      completedKey: "renewalReminderD60CompletedAt",
      disabled: lead.renewalD60Disabled,
      iso: lead.renewalReminderD60,
      completedAt: lead.renewalReminderD60CompletedAt,
    },
    {
      dateKey: "renewalReminderD30Date",
      timeKey: "renewalReminderD30Time",
      modeKey: "renewalReminderD30Mode",
      completedKey: "renewalReminderD30CompletedAt",
      disabled: lead.renewalD30Disabled,
      iso: lead.renewalReminderD30,
      completedAt: lead.renewalReminderD30CompletedAt,
    },
    {
      dateKey: "renewalReminderD15Date",
      timeKey: "renewalReminderD15Time",
      modeKey: "renewalReminderD15Mode",
      completedKey: "renewalReminderD15CompletedAt",
      disabled: lead.renewalD15Disabled,
      iso: lead.renewalReminderD15,
      completedAt: lead.renewalReminderD15CompletedAt,
    },
  ] as const
  for (const slot of slots) {
    if (slot.disabled) {
      fields[slot.dateKey] = ""
      fields[slot.timeKey] = "09:00"
      fields[slot.modeKey] = "disabled"
      continue
    }
    if (slot.iso) {
      const when = isoToDateTimeInputs(slot.iso)
      fields[slot.dateKey] = when.date
      fields[slot.timeKey] = when.time
      const followsSuggestion =
        when.date === suggested[slot.dateKey] &&
        when.time === suggested[slot.timeKey]
      fields[slot.modeKey] = followsSuggestion ? "suggested" : "manual"
      continue
    }
    if (slot.completedAt) {
      fields[slot.dateKey] = ""
      fields[slot.timeKey] = "09:00"
      fields[slot.modeKey] = "completed"
      fields[slot.completedKey] = slot.completedAt
    }
  }
  return fields
}

export function shouldShowPageLeadSaveError(
  dialogOpen: boolean,
  hasCreateOrUpdateError: boolean,
) {
  return !dialogOpen && hasCreateOrUpdateError
}

export function resolveLeadDialogSaveError(
  createError: unknown,
  updateError: unknown,
) {
  return createError ?? updateError ?? null
}

export function shouldShowLeadDialogSaveError(
  dialogOpen: boolean,
  createError: unknown,
  updateError: unknown,
) {
  if (!dialogOpen) return false
  return Boolean(resolveLeadDialogSaveError(createError, updateError))
}
