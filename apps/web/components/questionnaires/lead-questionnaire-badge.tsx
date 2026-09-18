"use client"

import { useEffect, useRef } from "react"
import { ClipboardCheck } from "lucide-react"

import {
  questionnaireStatusLabels,
  questionnaireStatusStyles,
} from "@/components/questionnaires/questionnaire-submission-constants"
import type { QuestionnaireSubmissionStatus } from "@/lib/data-access/modules/questionnaires"
import { Badge } from "@/components/ui/badge"
import {
  LEAD_STATUS_LOG,
  logLeadStatus,
} from "@/lib/data-access/modules/questionnaires/lead-submission-status"
import { useLeadQuestionnaireSubmissions } from "@/lib/data-access/modules/questionnaires"
import { cn } from "@/lib/utils"

type LeadQuestionnaireBadgeProps = {
  leadId: string
  templateId?: string
  onViewSubmission: (submissionId: string) => void
  onFill: () => void
}

export function LeadQuestionnaireBadge({
  leadId,
  templateId,
  onViewSubmission,
  onFill,
}: LeadQuestionnaireBadgeProps) {
  const lastLoggedKeyRef = useRef<string | null>(null)

  const submissionsQuery = useLeadQuestionnaireSubmissions(leadId, {
    templateId,
    limit: 5,
  })

  const leadStatus = submissionsQuery.data?.leadStatus
  const isDraft = leadStatus?.isDraft ?? false

  useEffect(() => {
    if (!leadStatus) return
    const logKey = `${leadId}:${leadStatus.submissionId ?? "none"}:${leadStatus.label}`
    if (lastLoggedKeyRef.current === logKey) return
    lastLoggedKeyRef.current = logKey

    logLeadStatus(LEAD_STATUS_LOG.render, {
      leadId,
      templateId,
      submissionId: leadStatus.submissionId,
      status: leadStatus.status,
      label: leadStatus.label,
    })
  }, [leadId, leadStatus, templateId])

  if (submissionsQuery.isLoading) {
    return <span className="text-xs text-muted-foreground">Verificando...</span>
  }

  if (!leadStatus || leadStatus.label === "pending") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onFill()
        }}
        className="inline-flex"
      >
        <Badge
          variant="outline"
          className="cursor-pointer rounded-full border-white/10 text-[10px] transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          Pendente
        </Badge>
      </button>
    )
  }

  const statusKey = (
    leadStatus.isDraft ? "draft" : leadStatus.status
  ) as QuestionnaireSubmissionStatus

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        if (isDraft) {
          onFill()
          return
        }
        if (leadStatus.submissionId) {
          onViewSubmission(leadStatus.submissionId)
        }
      }}
      className="inline-flex"
      title={
        isDraft
          ? "Continuar preenchimento do rascunho"
          : "Ver respostas do questionário"
      }
    >
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer gap-1 rounded-full text-[10px] font-semibold transition-opacity hover:opacity-90",
          questionnaireStatusStyles[statusKey],
        )}
      >
        <ClipboardCheck className="size-3" />
        {isDraft
          ? "Continuar rascunho"
          : questionnaireStatusLabels[statusKey]}
      </Badge>
    </button>
  )
}
