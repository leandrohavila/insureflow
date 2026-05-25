"use client"

import { ClipboardList } from "lucide-react"

import type { CrmDeal } from "@/lib/data-access/modules/crm"
import {
  crmQuestionnaireLabel,
  crmQuestionnaireStyle,
} from "@/lib/crm/commercial-labels"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type DealQuestionnaireBadgeProps = {
  deal: CrmDeal
  className?: string
}

export function DealQuestionnaireBadge({
  deal,
  className,
}: DealQuestionnaireBadgeProps) {
  const status =
    deal.commercialContext?.questionnaire.status ??
    (deal.convertedLead ? "pending" : null)

  if (!status) return null

  return (
    <Badge
      variant="outline"
      className={cn(
        "pointer-events-none gap-1 rounded-full text-[10px] font-semibold",
        crmQuestionnaireStyle(status),
        className,
      )}
    >
      {status !== "pending" ? (
        <ClipboardList className="size-3 shrink-0" aria-hidden />
      ) : null}
      {crmQuestionnaireLabel(status)}
    </Badge>
  )
}
