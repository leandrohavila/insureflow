"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  ClipboardList,
  User,
  UserPlus,
} from "lucide-react"

import { SectionPanel, StatusPill } from "@/components/crm/primitives"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  formatSubmissionDate,
  submissionResponsible,
} from "@/components/questionnaires/questionnaire-answer-utils"
import { questionnaireStatusLabels } from "@/components/questionnaires/questionnaire-submission-constants"
import { crmQuestionnaireLabel } from "@/lib/crm/commercial-labels"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import type {
  CrmDeal,
  CrmDealQuestionnaireStatus,
} from "@/lib/data-access/modules/crm"
import {
  buildCrmQuestionnaireResponsesHref,
  markQuestionnaireCrmNavigation,
} from "@/lib/questionnaires/questionnaire-crm-navigation"
import { cn } from "@/lib/utils"

import { PropertyCell, PropertyGrid } from "./deal-shared"

type DealCommercialSectionProps = {
  deal: CrmDeal
  crmReturnHref?: string
}

/**
 * Tom semântico do `StatusPill` por status de questionário.
 * Pareado com `crm-tone-*` e com `crmQuestionnaireStyle` legado.
 */
const QUESTIONNAIRE_TONE: Record<
  CrmDealQuestionnaireStatus,
  "neutral" | "info" | "success" | "warn" | "violet"
> = {
  pending: "neutral",
  draft: "warn",
  submitted: "info",
  reviewed: "success",
  archived: "violet",
}

function questionnaireLabel(status: CrmDealQuestionnaireStatus) {
  if (status === "pending") return "Pendente"
  if (status === "submitted") return questionnaireStatusLabels.submitted
  return crmQuestionnaireLabel(status)
}

/**
 * Contexto comercial — questionário, responsável, última interação e ações
 * operacionais (visualizar respostas, abrir lead vinculado).
 *
 * Substitui visualmente o bloco `DealCommercialContext` do `DealDetailSheet`
 * legado, sem alterar nenhum dado, hook ou navegação.
 */
export function DealCommercialSection({
  deal,
  crmReturnHref,
}: DealCommercialSectionProps) {
  const router = useRouter()
  const lead = deal.convertedLead ?? null
  const commercial = deal.commercialContext ?? null
  const questionnaireStatus: CrmDealQuestionnaireStatus =
    commercial?.questionnaire.status ?? "pending"
  const returnTo = crmReturnHref ?? `/crm/negocios?deal=${deal.id}`
  const responsible = submissionResponsible(
    commercial?.responsible,
    lead?.assignedTo ?? deal.assignedTo,
  )
  const lastUpdated =
    commercial?.questionnaire.updatedAt ??
    commercial?.lastInteractionAt ??
    deal.updatedAt

  function handleViewResponses() {
    const href = buildCrmQuestionnaireResponsesHref({
      dealId: deal.id,
      dealName: deal.title,
      leadId: lead?.id,
      returnTo,
    })
    markQuestionnaireCrmNavigation(returnTo)
    router.push(href)
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel title="Contexto comercial" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={UserPlus}
            label="Lead de origem"
            value={lead ? lead.name : "Sem lead vinculado"}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={ClipboardList}
            label="Status do questionário"
            value={
              <StatusPill
                tone={QUESTIONNAIRE_TONE[questionnaireStatus]}
                variant="soft"
                size="sm"
              >
                {questionnaireLabel(questionnaireStatus)}
              </StatusPill>
            }
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Calendar}
            label="Última interação"
            value={formatLastInteraction(commercial?.lastInteractionAt)}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Calendar}
            label="Questionário atualizado"
            value={formatSubmissionDate(lastUpdated)}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={User}
            label="Responsável"
            value={responsible}
            className="bg-[var(--crm-surface-panel)]"
            span={2}
          />
        </PropertyGrid>
      </SectionPanel>

      <SectionPanel title="Ações comerciais" tone="default" density="compact">
        <div className="flex flex-col gap-2 px-1.5 pb-1 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleViewResponses}
          >
            <ClipboardList className="size-3.5" />
            Visualizar respostas do questionário
          </Button>
          {lead ? (
            <Link
              href={`/leads?lead=${lead.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full justify-start gap-2",
              )}
            >
              <UserPlus className="size-3.5" />
              Abrir lead vinculado
            </Link>
          ) : null}
        </div>
      </SectionPanel>
    </div>
  )
}
