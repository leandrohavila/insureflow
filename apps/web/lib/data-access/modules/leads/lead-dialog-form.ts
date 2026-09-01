import type { LeadDocumentType } from "../../../documents/document"
import {
  formatCnpjMask,
  formatCpfMask,
  formatStoredPhone,
} from "../../../documents/document"
import type { InterestCategory } from "@/lib/business-units/constants"
import type { Lead } from "./types"
import { suggestRenewalReminderFields } from "./lead-next-contact-form"

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
  renewalReminderD30Date: string
  renewalReminderD30Time: string
  renewalReminderD15Date: string
  renewalReminderD15Time: string
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
  renewalReminderD30Date: "",
  renewalReminderD30Time: "09:00",
  renewalReminderD15Date: "",
  renewalReminderD15Time: "09:00",
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
    followUpDays: "",
    nextContactDate: "",
    nextContactTime: "09:00",
    nextContactType: "whatsapp",
    nextContactNotes: "",
    ...suggestRenewalReminderFields(
      lead.policyExpiresAt ? lead.policyExpiresAt.slice(0, 10) : "",
    ),
  }
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
