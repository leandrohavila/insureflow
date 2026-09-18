import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { QuestionnaireSubmissionStatus } from "@/lib/data-access/modules/questionnaires"

import type { BackendLead, Lead } from "./types"

export type LeadContextWarning = {
  code: string
  message: string
  severity: "info" | "warning"
}

export type LeadContextSubmission = {
  id: string
  status: QuestionnaireSubmissionStatus
  updatedAt: string
  submittedAt?: string | null
  templateId: string
  dealId?: string | null
  template?: {
    id: string
    name: string
    version: number
  } | null
}

export type LeadTimelineSummary = {
  leadUpdatedAt: string
  lastContactAt: string | null
  dealUpdatedAt: string | null
  lastSubmissionAt: string | null
  submissionCount: number
  draftCount: number
}

export type LeadContext = {
  lead: Lead
  deal: CrmDeal | null
  submissions: LeadContextSubmission[]
  latestSubmission: LeadContextSubmission | null
  warnings: LeadContextWarning[]
  timelineSummary: LeadTimelineSummary
}

export type BackendLeadContext = {
  lead: BackendLead
  deal: CrmDeal | null
  submissions: LeadContextSubmission[]
  latestSubmission: LeadContextSubmission | null
  warnings: LeadContextWarning[]
  timelineSummary: LeadTimelineSummary
}
