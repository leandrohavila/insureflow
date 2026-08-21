import type { LeadDocumentType } from "../../../documents/document"
import {
  formatCnpjMask,
  formatCpfMask,
  formatStoredPhone,
} from "../../../documents/document"
import type { InterestCategory } from "@/lib/business-units/constants"
import type { Lead } from "./types"

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
  businessUnitId: string
  interestCategories: InterestCategory[]
  followUpDays: string
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
  businessUnitId: "",
  interestCategories: [],
  followUpDays: "",
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

export function buildLeadDialogFormState(
  lead: Lead | null,
  sessionName?: string | null,
): LeadDialogFormState {
  if (!lead) {
    return {
      ...EMPTY_LEAD_DIALOG_FORM,
      assignedTo: sessionName?.trim() ?? "",
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
    businessUnitId: lead.businessUnitId ?? "",
    interestCategories: lead.interestCategories ?? [],
    followUpDays: "",
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
