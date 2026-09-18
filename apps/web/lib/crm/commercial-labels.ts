import type { CrmDealQuestionnaireStatus } from "@/lib/data-access/modules/crm"
import {
  questionnaireStatusLabels,
  questionnaireStatusStyles,
} from "@/components/questionnaires/questionnaire-submission-constants"
import type { QuestionnaireSubmissionStatus } from "@/lib/data-access/modules/questionnaires"

const crmQuestionnaireLabels: Record<CrmDealQuestionnaireStatus, string> = {
  pending: "Pendente",
  draft: "Rascunho",
  submitted: "Enviado",
  reviewed: questionnaireStatusLabels.reviewed,
  archived: questionnaireStatusLabels.archived,
}

const crmQuestionnaireStyles: Record<CrmDealQuestionnaireStatus, string> = {
  pending: "border-white/10 bg-white/[0.04] text-muted-foreground",
  draft: questionnaireStatusStyles.draft,
  submitted: questionnaireStatusStyles.submitted,
  reviewed: questionnaireStatusStyles.reviewed,
  archived: questionnaireStatusStyles.archived,
}

export function crmQuestionnaireLabel(status: CrmDealQuestionnaireStatus) {
  return crmQuestionnaireLabels[status]
}

export function crmQuestionnaireStyle(status: CrmDealQuestionnaireStatus) {
  return crmQuestionnaireStyles[status]
}

export function toSubmissionStatusKey(
  status: CrmDealQuestionnaireStatus,
): QuestionnaireSubmissionStatus | null {
  if (status === "pending") return null
  return status
}
