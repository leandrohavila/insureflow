"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Building2,
  Calendar,
  ClipboardList,
  Mail,
  User,
  UserPlus,
} from "lucide-react"

import {
  formatSubmissionDate,
  submissionResponsible,
} from "@/components/questionnaires/questionnaire-answer-utils"
import { questionnaireStatusLabels } from "@/components/questionnaires/questionnaire-submission-constants"
import type { CrmDeal, CrmDealQuestionnaireStatus } from "@/lib/data-access/modules/crm"
import {
  crmQuestionnaireLabel,
  crmQuestionnaireStyle,
} from "@/lib/crm/commercial-labels"
import {
  buildCrmQuestionnaireResponsesHref,
  markQuestionnaireCrmNavigation,
} from "@/lib/questionnaires/questionnaire-crm-navigation"
import { cn } from "@/lib/utils"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import {
  formatCurrency,
  pipelineStages,
  stageLabelMap,
} from "@/lib/data-access/modules/crm"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ActivityQuickActions } from "@/components/activities/activity-quick-actions"
import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type DealDetailSheetProps = {
  deal: CrmDeal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  crmReturnHref?: string
}

export function DealDetailSheet({
  deal,
  open,
  onOpenChange,
  crmReturnHref,
}: DealDetailSheetProps) {
  if (!deal) return null

  const stageInfo = pipelineStages.find((s) => s.id === deal.stage)
  const leadId = deal.convertedLead?.id ?? null
  const lastInteractionLabel = formatLastInteraction(
    deal.commercialContext?.lastInteractionAt,
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-white/[0.08] bg-background/95 p-0 backdrop-blur-xl sm:max-w-lg"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-white/[0.06] px-6 py-5 text-left">
            <SheetDescription className="text-xs text-primary">
              {stageLabelMap[deal.stage]}
            </SheetDescription>
            <SheetTitle className="text-xl font-semibold tracking-[-0.03em]">
              {deal.title}
            </SheetTitle>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatCurrency(deal.value)}
            </p>
            <p className="text-xs text-muted-foreground">{lastInteractionLabel}</p>
            <ActivityQuickActions
              dealId={deal.id}
              leadId={leadId}
              className="pt-2"
              compact
            />
          </SheetHeader>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto px-6 py-5"
          >
            <section className="space-y-4">
              <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Propriedades do negócio
              </h3>
              <dl className="space-y-3 text-sm">
                <PropertyRow
                  icon={Building2}
                  label="Empresa"
                  value={deal.company}
                />
                <PropertyRow icon={User} label="Contato" value={deal.contact} />
                {deal.email && (
                  <PropertyRow icon={Mail} label="E-mail" value={deal.email} />
                )}
                <PropertyRow
                  icon={Calendar}
                  label="Produto"
                  value={deal.product}
                />
                <PropertyRow
                  icon={User}
                  label="Proprietário"
                  value={
                    <span className="flex items-center gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="bg-primary/20 text-[9px] text-primary">
                          {deal.ownerInitials}
                        </AvatarFallback>
                      </Avatar>
                      {deal.owner}
                    </span>
                  }
                />
                <PropertyRow
                  label="Estágio"
                  value={
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary/10 text-primary"
                    >
                      {stageInfo?.label}
                    </Badge>
                  }
                />
                <PropertyRow label="Prioridade" value={deal.priority} />
              </dl>
            </section>

            <Separator className="my-6 bg-white/[0.06]" />

            <DealCommercialContext deal={deal} crmReturnHref={crmReturnHref} />

            <Separator className="my-6 bg-white/[0.06]" />

            <ActivityTimeline dealId={deal.id} leadId={leadId} />
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DealCommercialContext({
  deal,
  crmReturnHref,
}: {
  deal: CrmDeal
  crmReturnHref?: string
}) {
  const router = useRouter()
  const lead = deal.convertedLead
  const commercial = deal.commercialContext
  const questionnaireStatus: CrmDealQuestionnaireStatus =
    commercial?.questionnaire.status ?? (lead ? "pending" : "pending")
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
    <section className="space-y-4">
      <h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        Contexto comercial
      </h3>
      <dl className="space-y-3 text-sm">
        <PropertyRow
          icon={UserPlus}
          label="Lead de origem"
          value={lead ? lead.name : "Sem lead vinculado"}
        />
        <PropertyRow
          icon={ClipboardList}
          label="Status do questionário"
          value={
            <Badge
              variant="outline"
              className={cn(
                "rounded-full text-[10px] font-semibold",
                questionnaireStatus === "pending"
                  ? "border-white/10 text-[10px]"
                  : crmQuestionnaireStyle(questionnaireStatus),
              )}
            >
              {questionnaireStatus === "pending"
                ? "Pendente"
                : questionnaireStatus === "submitted"
                  ? questionnaireStatusLabels.submitted
                  : crmQuestionnaireLabel(questionnaireStatus)}
            </Badge>
          }
        />
        <PropertyRow
          icon={Calendar}
          label="Última interação"
          value={
            <span className="text-xs text-muted-foreground">
              {formatLastInteraction(commercial?.lastInteractionAt)}
            </span>
          }
        />
        <PropertyRow
          icon={Calendar}
          label="Questionário"
          value={
            <span className="text-xs text-muted-foreground">
              {formatSubmissionDate(commercial?.questionnaire.updatedAt ?? lastUpdated)}
            </span>
          }
        />
        <PropertyRow icon={User} label="Responsável" value={responsible} />
      </dl>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleViewResponses}
        >
          <ClipboardList className="size-3.5" />
          Visualizar respostas
        </Button>
        {lead ? (
          <Link
            href={`/leads?lead=${lead.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full gap-2",
            )}
          >
            <UserPlus className="size-3.5" />
            Abrir lead
          </Link>
        ) : null}
      </div>
    </section>
  )
}

function PropertyRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.04] pb-3 last:border-0">
      <dt className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-3.5 shrink-0 opacity-60" />}
        {label}
      </dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  )
}
