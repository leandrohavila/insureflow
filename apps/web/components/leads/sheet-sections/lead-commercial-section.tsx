"use client"

import { useMemo } from "react"
import {
  Calendar,
  ClipboardList,
  FileText,
  Loader2,
  StickyNote,
  UserCog,
} from "lucide-react"

import { SectionPanel, StatusPill } from "@/components/crm/primitives"
import {
  PropertyCell,
  PropertyGrid,
} from "@/components/crm/sheet-sections/sheet-shared"
import { Button } from "@/components/ui/button"
import {
  formatSubmissionDate,
  submissionResponsible,
} from "@/components/questionnaires/questionnaire-answer-utils"
import { questionnaireStatusLabels } from "@/components/questionnaires/questionnaire-submission-constants"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import {
  useLeadContext,
  type Lead,
  type LeadContextSubmission,
} from "@/lib/data-access/modules/leads"
import type { QuestionnaireSubmissionStatus } from "@/lib/data-access/modules/questionnaires"

type LeadCommercialSectionProps = {
  lead: Lead
  onFillQuestionnaire: (lead: Lead) => void
  onViewSubmission: (submissionId: string) => void
}

/**
 * Tom semântico do `StatusPill` por status de submissão de questionário.
 * Espelha o mapping usado no `DealCommercialSection` para consistência
 * cross-entidade — vermelhos/verdes significam a mesma coisa em qualquer
 * workspace.
 */
const SUBMISSION_TONE: Record<
  QuestionnaireSubmissionStatus | "pending" | "draft",
  "neutral" | "info" | "success" | "warn" | "violet"
> = {
  pending: "neutral",
  draft: "warn",
  submitted: "info",
  reviewed: "success",
  archived: "violet",
}

function submissionLabel(
  status: QuestionnaireSubmissionStatus | "pending" | "draft",
) {
  if (status === "pending") return "Pendente"
  if (status === "draft") return "Em rascunho"
  return questionnaireStatusLabels[status]
}

/**
 * Contexto comercial do Lead — questionário, qualificação, última interação
 * e notas do responsável. Equivalente narrativo do `DealCommercialSection`,
 * mas com lente "está pronto para virar negócio?" em vez de "como o negócio
 * está progredindo?".
 *
 * Reusa `useLeadContext` (mesma key/staleTime da seção Conversão — sem
 * fetch duplicado). Quando o contexto ainda não chegou, renderiza um esqueleto
 * minimalista; nunca trava o sheet inteiro.
 */
export function LeadCommercialSection({
  lead,
  onFillQuestionnaire,
  onViewSubmission,
}: LeadCommercialSectionProps) {
  const contextQuery = useLeadContext(lead.id)
  const latest: LeadContextSubmission | null =
    contextQuery.data?.latestSubmission ?? null

  const submissionState = useMemo<
    QuestionnaireSubmissionStatus | "pending" | "draft"
  >(() => {
    if (!latest) return "pending"
    if (latest.status === "draft") return "draft"
    return latest.status
  }, [latest])

  const isDraft = submissionState === "draft"
  const isPending = submissionState === "pending"

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel title="Qualificação" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={ClipboardList}
            label="Status do questionário"
            value={
              <StatusPill
                tone={SUBMISSION_TONE[submissionState]}
                variant="soft"
                size="sm"
              >
                {submissionLabel(submissionState)}
              </StatusPill>
            }
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={FileText}
            label="Template aplicado"
            value={latest?.template?.name ?? "—"}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Calendar}
            label="Última interação"
            value={formatLastInteraction(
              lead.lastInteractionAt ?? lead.lastContactAt,
            )}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Calendar}
            label="Questionário atualizado"
            value={formatSubmissionDate(latest?.updatedAt)}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={UserCog}
            label="Responsável pela qualificação"
            value={submissionResponsible(lead.assignedTo, null)}
            className="bg-[var(--crm-surface-panel)]"
            span={2}
          />
        </PropertyGrid>
      </SectionPanel>

      {lead.notes?.trim() ? (
        <SectionPanel title="Notas operacionais" tone="default">
          <div className="flex items-start gap-2 px-3.5 py-2.5">
            <StickyNote
              className="size-3.5 shrink-0 text-foreground/45"
              strokeWidth={1.5}
            />
            <p className="crm-text-meta whitespace-pre-wrap text-foreground/85">
              {lead.notes}
            </p>
          </div>
        </SectionPanel>
      ) : null}

      <SectionPanel title="Ações de qualificação" tone="default" density="compact">
        <div className="flex flex-col gap-2 px-1.5 pb-1 pt-1">
          {isPending || isDraft ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => onFillQuestionnaire(lead)}
            >
              <ClipboardList className="size-3.5" />
              {isDraft
                ? "Continuar preenchimento do questionário"
                : "Preencher questionário"}
            </Button>
          ) : null}

          {latest && !isDraft && !isPending ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => onViewSubmission(latest.id)}
            >
              <ClipboardList className="size-3.5" />
              Ver respostas do questionário
            </Button>
          ) : null}

          {contextQuery.isLoading ? (
            <p className="crm-text-meta flex items-center gap-1.5 px-2 pt-1 text-foreground/55">
              <Loader2 className="size-3 animate-spin" />
              Carregando contexto comercial…
            </p>
          ) : null}
        </div>
      </SectionPanel>
    </div>
  )
}
