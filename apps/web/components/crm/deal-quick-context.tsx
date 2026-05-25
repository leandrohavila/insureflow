"use client"

import type { ReactNode } from "react"
import { Clock, ClipboardList, Phone } from "lucide-react"

import type { CrmDeal } from "@/lib/data-access/modules/crm"
import {
  crmQuestionnaireLabel,
  crmQuestionnaireStyle,
} from "@/lib/crm/commercial-labels"
import { formatSubmissionDate } from "@/components/questionnaires/questionnaire-answer-utils"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type DealQuickContextProps = {
  deal: CrmDeal
  children: ReactNode
  /** Desativa tooltip durante drag para não competir com listeners do DnD. */
  disabled?: boolean
}

export function DealQuickContext({
  deal,
  children,
  disabled,
}: DealQuickContextProps) {
  const ctx = deal.commercialContext
  const questionnaireStatus =
    ctx?.questionnaire.status ?? (deal.convertedLead ? "pending" : null)

  if (disabled || (!ctx && !deal.convertedLead)) {
    return <>{children}</>
  }

  return (
    <TooltipProvider delay={350}>
      <Tooltip>
        <TooltipTrigger
          render={<div className="block w-full min-w-0 text-left" />}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="start"
          className="max-w-[240px] flex-col items-stretch gap-2 px-3 py-2.5 text-left"
        >
          <p className="text-[11px] font-semibold tracking-[-0.02em] text-background">
            {deal.title}
          </p>
          <dl className="space-y-1.5 text-[11px] text-background/90">
            <QuickRow
              icon={Phone}
              label="Telefone"
              value={ctx?.phone?.trim() || "—"}
            />
            <QuickRow
              icon={Clock}
              label="Último contato"
              value={
                ctx?.lastContactAt
                  ? formatSubmissionDate(ctx.lastContactAt)
                  : "—"
              }
            />
            <QuickRow
              icon={ClipboardList}
              label="Questionário"
              value={
                questionnaireStatus ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full border-background/20 bg-background/10 text-[10px] text-background",
                      questionnaireStatus !== "pending" &&
                        crmQuestionnaireStyle(questionnaireStatus),
                    )}
                  >
                    {crmQuestionnaireLabel(questionnaireStatus)}
                  </Badge>
                ) : (
                  "—"
                )
              }
            />
            <QuickRow
              icon={Clock}
              label="Última interação"
              value={formatLastInteraction(ctx?.lastInteractionAt)}
            />
          </dl>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function QuickRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1 text-background/70">
        <Icon className="size-3 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
