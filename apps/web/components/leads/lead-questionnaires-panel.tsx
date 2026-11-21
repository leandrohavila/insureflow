"use client"

import { useState } from "react"
import { ClipboardList } from "lucide-react"

import { usePermission } from "@/components/auth/session-provider"
import { Button } from "@/components/ui/button"
import { QuestionnaireShareDialog } from "@/components/questionnaires/questionnaire-share-dialog"
import { questionnaireStatusLabels } from "@/components/questionnaires/questionnaire-submission-constants"
import { getErrorMessage } from "@/lib/data-access"
import { useLeadQuestionnaireSubmissions } from "@/lib/data-access/modules/questionnaires"
import type { QuestionnaireSubmission } from "@/lib/data-access/modules/questionnaires"
import { formatLeadDetailDate } from "@/lib/leads/lead-detail-view"
import {
  questionnaireBranchLabel,
  questionnaireCanContinue,
  questionnaireCanReview,
  questionnaireFillOriginLabel,
} from "@/lib/questionnaires/lead-questionnaire-summary"

type LeadQuestionnairesPanelProps = {
  leadId: string
  onStart?: () => void
  onContinue?: (submission: QuestionnaireSubmission) => void
  onView?: (submissionId: string) => void
}

const STATUS_TONE: Record<string, string> = {
  draft:
    "border-[var(--avila-gold-600)]/45 bg-[var(--avila-gold-600)]/14 text-[var(--avila-navy-900)]",
  in_progress: "border-info/30 bg-info/12 text-info",
  pending_client:
    "border-[var(--avila-gold-600)]/45 bg-white text-[var(--avila-navy-900)]",
  submitted: "border-info/30 bg-info/12 text-info",
  reviewed: "border-success/30 bg-success/15 text-success",
  completed: "border-success/30 bg-success/15 text-success",
  expired: "border-border bg-white text-muted-foreground",
  cancelled: "border-border bg-white text-muted-foreground",
  archived: "border-border bg-white text-muted-foreground",
}

function submissionMeta(submission: QuestionnaireSubmission) {
  const version =
    submission.templateVersion?.versionNumber ?? submission.template?.version
  const created = formatLeadDetailDate(submission.createdAt)
  const completed = formatLeadDetailDate(submission.completedAt)
  return [
    questionnaireBranchLabel(submission.branch),
    questionnaireFillOriginLabel(submission.mode),
    version ? `Versão ${version}` : null,
    created ? `Criado em ${created}` : null,
    completed ? `Concluído em ${completed}` : null,
    clientProgress(submission),
  ]
    .filter(Boolean)
    .join(" · ")
}

function clientProgress(submission: QuestionnaireSubmission) {
  if (submission.mode === "EXTERNAL" && submission.status === "completed") {
    return "Cliente concluiu pelo link"
  }
  if (submission.mode === "EXTERNAL" && submission.status === "in_progress") {
    return "Cliente iniciou o preenchimento"
  }
  if (submission.status === "pending_client") return "Link aguardando o cliente"
  return null
}

export function LeadQuestionnairesPanel({
  leadId,
  onStart,
  onContinue,
  onView,
}: LeadQuestionnairesPanelProps) {
  const canView = usePermission("questionnaires:view")
  const canFill = usePermission("questionnaires:manage")
  const [shareSubmission, setShareSubmission] =
    useState<QuestionnaireSubmission | null>(null)
  const query = useLeadQuestionnaireSubmissions(leadId, {
    limit: 20,
    enabled: canView,
    refetchInterval: canView ? 30_000 : false,
  })

  if (!canView) {
    return (
      <p className="text-sm text-muted-foreground">
        Você não tem permissão para consultar os questionários deste lead.
      </p>
    )
  }

  if (query.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Carregando questionários…</p>
    )
  }

  if (query.isError) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">
          {getErrorMessage(
            query.error,
            "Não foi possível carregar os questionários.",
          )}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => query.refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  const submissions = query.data?.data ?? []
  const total = query.data?.meta.total ?? submissions.length

  return (
    <div className="flex flex-col gap-2.5">
      {canFill && onStart ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 sm:w-fit"
          onClick={onStart}
        >
          <ClipboardList className="size-3.5" />
          Novo questionário
        </Button>
      ) : null}

      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum questionário associado a este lead.
        </p>
      ) : (
        submissions.map((submission) => {
          const label =
            questionnaireStatusLabels[submission.status] ?? submission.status
          return (
            <article
              key={submission.id}
              className="rounded-lg border border-border bg-[var(--avila-ivory)] px-3! py-2.5!"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[var(--avila-navy-900)]">
                  {submission.template?.name ?? "Questionário"}
                </p>
                <span
                  className={`rounded-full border px-2! py-0.5! text-[11px] font-semibold ${STATUS_TONE[submission.status] ?? STATUS_TONE.archived}`}
                >
                  {label}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {submissionMeta(submission)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {canFill &&
                onContinue &&
                questionnaireCanContinue(submission.status) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="edit"
                    onClick={() => onContinue(submission)}
                  >
                    Continuar
                  </Button>
                ) : null}
                {onView && questionnaireCanReview(submission.status) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onView(submission.id)}
                  >
                    Ver respostas
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShareSubmission(submission)}
                >
                  Link do cliente
                </Button>
              </div>
            </article>
          )
        })
      )}

      <QuestionnaireShareDialog
        submission={shareSubmission}
        canManage={canFill}
        onOpenChange={(open) => {
          if (!open) setShareSubmission(null)
        }}
      />

      {total > submissions.length ? (
        <p className="text-xs text-muted-foreground">
          Mostrando os {submissions.length} questionários mais recentes de{" "}
          {total}.
        </p>
      ) : null}
    </div>
  )
}
