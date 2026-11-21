"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Briefcase,
  CalendarClock,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
} from "lucide-react"

import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { FormSelect } from "@/components/design-system"
import { LeadQuestionnairesPanel } from "@/components/leads/lead-questionnaires-panel"
import { crmFilterChipClass } from "@/components/crm/crm-controls"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { getErrorMessage } from "@/lib/data-access"
import { queryKeys } from "@/lib/data-access/query-keys"
import { useActivityTimeline } from "@/lib/data-access/modules/activities"
import { reactivateLead } from "@/lib/data-access/modules/commercial-reactivations/api"
import { useLeadLossReasons } from "@/lib/data-access/modules/lead-loss-reasons"
import {
  useLead,
  useUpdateLead,
  type Lead,
} from "@/lib/data-access/modules/leads"
import type { QuestionnaireSubmission } from "@/lib/data-access/modules/questionnaires"
import { NEXT_CONTACT_ACTIVITY_OPTIONS } from "@/lib/data-access/modules/leads/lead-next-contact-form"
import {
  LEAD_DETAIL_EMPTY,
  formatLeadDetailDate,
  leadCanReactivate,
  leadDetailActions,
  leadDetailDocument,
  leadDetailInterests,
  leadDetailOpportunity,
  leadDetailOwner,
  leadDetailPhone,
  leadDetailUnits,
  leadNextAction,
  leadQualificationSnapshot,
  leadReactivationPayload,
} from "@/lib/leads/lead-detail-view"
import { leadPipelinePresentation } from "@/lib/leads/lead-pipeline-clarity"
import {
  leadTelHref,
  leadWhatsAppHref,
} from "@/lib/leads/lead-operational-signals"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<Lead["status"], string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
}

const STATUS_BADGE: Record<Lead["status"], string> = {
  new: "border-[var(--avila-navy-900)]/20 bg-white text-[var(--avila-navy-900)]",
  contacted: "border-info/30 bg-info/12 text-info",
  qualified:
    "border-[var(--avila-gold-600)]/45 bg-[var(--avila-gold-600)]/16 text-[var(--avila-navy-900)]",
  converted: "border-success/30 bg-success/20 text-success",
  lost: "border-destructive/30 bg-destructive/12 text-destructive",
}

const SECTIONS = [
  { id: "lead-detail-identity", label: "Cadastro" },
  { id: "lead-detail-commercial", label: "Comercial" },
  { id: "lead-detail-qualification", label: "Qualificação" },
  { id: "lead-detail-questionnaires", label: "Questionários" },
  { id: "lead-detail-history", label: "Histórico" },
] as const

function DetailSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="mx-4! mt-3! scroll-mt-3 space-y-3 rounded-xl border border-border bg-white p-4!"
    >
      <h3 className="text-[11px] font-semibold tracking-wide text-[var(--avila-navy-800)] uppercase">
        <span className="mr-2 text-[var(--avila-gold-600)]">•</span>
        {title}
      </h3>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  )
}

function DetailRow({
  label,
  value,
  href,
}: {
  label: string
  value?: string | null
  href?: string | null
}) {
  const text = value?.trim() || LEAD_DETAIL_EMPTY
  const missing = text === LEAD_DETAIL_EMPTY
  return (
    <div className="grid grid-cols-1 gap-0.5 text-sm sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-3">
      <span className="text-muted-foreground">{label}</span>
      {href && !missing ? (
        <a
          href={href}
          className="min-w-0 break-words font-medium text-[var(--avila-navy-900)] underline-offset-2 hover:underline"
        >
          {text}
        </a>
      ) : (
        <span
          className={cn(
            "min-w-0 break-words whitespace-pre-wrap",
            missing ? "text-muted-foreground" : "font-medium text-foreground",
          )}
        >
          {text}
        </span>
      )}
    </div>
  )
}

function LeadLostPanel({ lead }: { lead: Lead }) {
  const reasonsQuery = useLeadLossReasons(true)
  const updateLead = useUpdateLead()
  const [reasonId, setReasonId] = useState("")
  const reasons = reasonsQuery.data ?? []
  const selected = reasons.find((reason) => reason.id === reasonId)

  return (
    <div className="space-y-2 rounded-lg border border-border bg-[var(--avila-ivory)] p-3!">
      <p className="text-sm font-medium text-[var(--avila-navy-900)]">
        Marcar como perdido
      </p>
      <p className="text-xs text-muted-foreground">
        O motivo é obrigatório. O lead permanece fora do pipeline.
      </p>
      <FormSelect
        value={reasonId}
        onChange={(event) => setReasonId(event.target.value)}
        options={[
          { value: "", label: "Selecione o motivo" },
          ...reasons.map((reason) => ({
            value: reason.id,
            label: reason.name,
          })),
        ]}
      />
      {reasonsQuery.isError ? (
        <p className="text-xs font-medium text-destructive">
          {getErrorMessage(reasonsQuery.error, "Não foi possível carregar os motivos.")}
        </p>
      ) : null}
      {!reasonsQuery.isLoading && reasons.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhum motivo de perda ativo.
        </p>
      ) : null}
      {selected?.reactivationEnabled ? (
        <p className="text-xs text-muted-foreground">
          Reativação prevista em {selected.reactivationDays} dias. Reativar não
          converte o lead.
        </p>
      ) : null}
      {updateLead.isError ? (
        <p className="text-xs font-medium text-destructive">
          {getErrorMessage(updateLead.error, "Não foi possível marcar como perdido.")}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!reasonId || updateLead.isPending}
        onClick={() =>
          updateLead.mutate({
            id: lead.id,
            input: { status: "lost", lossReasonId: reasonId },
          })
        }
      >
        {updateLead.isPending ? "Salvando…" : "Confirmar perda"}
      </Button>
    </div>
  )
}

type LeadDetailSheetProps = {
  lead: Lead | null
  open: boolean
  stageLabel?: string | null
  canEdit?: boolean
  canConvert: boolean
  canReactivate?: boolean
  canViewDeals: boolean
  canSchedule: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (lead: Lead) => void
  onConvert: (lead: Lead) => void
  onRegisterContact: (lead: Lead) => void
  onSchedule: (lead: Lead) => void
  onOpenDeal: (dealId: string) => void
  onStartIntelligentQuestionnaire?: (lead: Lead) => void
  onContinueIntelligentQuestionnaire?: (
    lead: Lead,
    submission: QuestionnaireSubmission,
  ) => void
  onViewQuestionnaire?: (submissionId: string) => void
}

export function LeadDetailSheet({
  lead,
  open,
  stageLabel,
  canEdit = true,
  canConvert,
  canReactivate = false,
  canViewDeals,
  canSchedule,
  onOpenChange,
  onEdit,
  onConvert,
  onRegisterContact,
  onSchedule,
  onOpenDeal,
  onStartIntelligentQuestionnaire,
  onContinueIntelligentQuestionnaire,
  onViewQuestionnaire,
}: LeadDetailSheetProps) {
  const detailQuery = useLead(open && lead ? lead.id : null)
  const current = detailQuery.data ?? lead
  const [lostOpen, setLostOpen] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const queryClient = useQueryClient()
  const timelineQuery = useActivityTimeline({
    leadId: open ? current?.id : null,
    dealId: open ? current?.dealId : null,
  })
  const reactivate = useMutation({
    mutationFn: (leadId: string) =>
      reactivateLead(leadId, leadReactivationPayload()),
    onSuccess: async () => {
      setReactivateOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.activities.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.commercialAgenda.all,
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.commercialReactivations.all,
        }),
      ])
    },
  })

  useEffect(() => {
    setLostOpen(false)
    setReactivateOpen(false)
  }, [lead?.id])

  const actions = current
    ? leadDetailActions(current, {
        canEdit,
        canConvert,
        canSchedule,
        canViewDeals,
      })
    : null
  const identityDocument = current ? leadDetailDocument(current) : null
  const interests = current ? leadDetailInterests(current) : []
  const units = current ? leadDetailUnits(current) : null
  const owner = current ? leadDetailOwner(current) : null
  const opportunity = leadDetailOpportunity(current?.opportunityType)
  const phone = leadDetailPhone(current?.phone)
  const createdAt = formatLeadDetailDate(current?.createdAt)
  const pipeline = current ? leadPipelinePresentation(current, stageLabel) : null
  const tel = leadTelHref(current?.phone)
  const whatsapp = leadWhatsAppHref(current?.phone)
  const mailto = current?.email?.trim() ? `mailto:${current.email.trim()}` : null
  const nextType = NEXT_CONTACT_ACTIVITY_OPTIONS.find(
    (item) => item.value === current?.nextContactType,
  )?.label
  const qualification = current ? leadQualificationSnapshot(current) : null
  const nextAction = leadNextAction({
    nextContactAt: current?.nextContactAt,
    nextContactType: nextType ?? current?.nextContactType,
    nextContactNotes: current?.nextContactNotes,
    followUps: (timelineQuery.data?.data ?? []).map((activity) => ({
      status: activity.status,
      nextFollowUpAt: activity.nextFollowUpAt,
      subject: activity.subject,
    })),
  })
  const reactivateReady = Boolean(
    current && canReactivate && leadCanReactivate(current),
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="avila-crm-canvas avila-lead-surface h-dvh max-h-dvh w-full max-w-none gap-0 overflow-hidden border-border bg-[var(--avila-ivory)] p-0 text-foreground data-[side=right]:w-full data-[side=right]:sm:max-w-[720px]! data-[side=right]:sm:w-[min(720px,100%)]"
      >
        {current && actions && pipeline ? (
          <div className="flex h-full min-h-0 flex-col">
            <SheetHeader className="shrink-0 gap-2 border-b border-border bg-white px-5! py-4! pr-12!">
              <SheetTitle className="text-lg font-semibold tracking-tight text-[var(--avila-navy-900)]">
                {current.name}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Detalhes do lead {current.name}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={cn(
                    "rounded-full border px-2! py-0.5! font-semibold",
                    STATUS_BADGE[current.status],
                  )}
                >
                  {STATUS_LABEL[current.status]}
                </span>
                <span className="text-muted-foreground">
                  Origem: {current.source?.trim() || LEAD_DETAIL_EMPTY}
                </span>
              </div>
              <p className="text-sm text-[var(--avila-navy-900)]">
                Responsável: {owner || LEAD_DETAIL_EMPTY}
              </p>
              {createdAt ? (
                <p className="text-xs text-muted-foreground">
                  Cadastro em {createdAt}
                </p>
              ) : null}
              <p
                className={cn(
                  "text-sm",
                  nextAction.scheduled
                    ? "font-medium text-[var(--avila-navy-900)]"
                    : "text-muted-foreground",
                )}
              >
                {nextAction.scheduled
                  ? `Próxima ação: ${nextAction.label}${
                      nextAction.at
                        ? ` · ${formatLeadDetailDate(nextAction.at) ?? ""}`
                        : ""
                    }`
                  : "Sem próxima ação"}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {actions.schedule ? (
                  <Button
                    type="button"
                    variant="crmPrimary"
                    onClick={() => onRegisterContact(current)}
                  >
                    <Phone className="size-3.5" />
                    Registrar contato
                  </Button>
                ) : null}
                {actions.schedule ? (
                  <Button
                    type="button"
                    variant="crmSecondary"
                    onClick={() => onSchedule(current)}
                  >
                    <CalendarClock className="size-3.5" />
                    Agendar próximo passo
                  </Button>
                ) : null}
                {actions.edit ? (
                  <Button
                    type="button"
                    variant="crmSecondary"
                    onClick={() => onEdit(current)}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                ) : null}
                {actions.call ? (
                  <Button
                    type="button"
                    variant="contact"
                    size="sm"
                    onClick={() => tel && window.open(tel, "_self")}
                  >
                    <Phone className="size-3.5" />
                    Ligar
                  </Button>
                ) : null}
                {actions.whatsapp ? (
                  <Button
                    type="button"
                    variant="whatsapp"
                    size="sm"
                    onClick={() =>
                      whatsapp &&
                      window.open(whatsapp, "_blank", "noopener,noreferrer")
                    }
                  >
                    <WhatsAppIcon className="size-3.5" />
                    WhatsApp
                  </Button>
                ) : null}
                {actions.email && mailto ? (
                  <Button
                    type="button"
                    variant="crmSecondary"
                    onClick={() => window.open(mailto, "_self")}
                  >
                    <Mail className="size-3.5" />
                    E-mail
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Ligar, WhatsApp e e-mail só abrem o aplicativo. O histórico
                muda quando o contato é registrado.
              </p>
            </SheetHeader>

            <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-[var(--avila-ivory)] px-4! py-2!">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={crmFilterChipClass(false)}
                  onClick={() =>
                    document
                      .getElementById(section.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  {section.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-4!">
              {detailQuery.isError ? (
                <div className="mx-4! mt-3! space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3!">
                  <p className="text-sm text-destructive">
                    {getErrorMessage(
                      detailQuery.error,
                      "Não foi possível atualizar os detalhes do lead.",
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="crmSecondary"
                    onClick={() => detailQuery.refetch()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : null}

              <DetailSection id="lead-detail-identity" title="Identificação e contato">
                <DetailRow label="Nome" value={current.name} />
                {identityDocument ? (
                  <DetailRow
                    label={identityDocument.label}
                    value={identityDocument.value}
                  />
                ) : (
                  <DetailRow label="CPF/CNPJ" value={null} />
                )}
                <DetailRow label="Telefone" value={phone} href={tel} />
                <DetailRow label="E-mail" value={current.email} href={mailto} />
              </DetailSection>

              <DetailSection id="lead-detail-commercial" title="Informações comerciais">
                <DetailRow
                  label="Ramo de interesse"
                  value={interests.length ? interests.join(", ") : null}
                />
                <DetailRow label="Empresa" value={current.company} />
                <DetailRow label="Unidade" value={units} />
                <DetailRow label="Responsável" value={owner} />
                {opportunity ? (
                  <DetailRow label="Oportunidade" value={opportunity} />
                ) : null}
                {current.currentInsurer?.trim() ? (
                  <DetailRow label="Seguradora" value={current.currentInsurer} />
                ) : null}
                {current.currentPolicyNumber?.trim() ? (
                  <DetailRow label="Apólice" value={current.currentPolicyNumber} />
                ) : null}
                {current.policyExpiresAt ? (
                  <DetailRow
                    label="Vencimento"
                    value={formatLeadDetailDate(current.policyExpiresAt)}
                  />
                ) : null}
                <DetailRow label="Situação" value={pipeline.statusLabel} />
                {pipeline.stageLabel ? (
                  <DetailRow label="Etapa" value={pipeline.stageLabel} />
                ) : null}
                {current.lostReason?.trim() ? (
                  <DetailRow
                    label={actions.showLoss ? "Motivo da perda" : "Perda anterior"}
                    value={current.lostReason}
                  />
                ) : null}
                {actions.showLoss ? (
                  <>
                    <DetailRow
                      label="Perdido em"
                      value={formatLeadDetailDate(current.lostAt)}
                    />
                    {current.nextReactivationAt ? (
                      <DetailRow
                        label="Reativação prevista"
                        value={formatLeadDetailDate(current.nextReactivationAt)}
                      />
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      A data prevista não reativa o lead. Lead perdido não entra
                      no pipeline.
                    </p>
                    {reactivateReady ? (
                      reactivateOpen ? (
                        <div className="space-y-2 rounded-lg border border-border bg-[var(--avila-ivory)] p-3!">
                          <p className="text-sm font-medium text-[var(--avila-navy-900)]">
                            Reativar este lead
                          </p>
                          <p className="text-xs text-muted-foreground">
                            O status volta para Contatado. O motivo e o histórico
                            da perda permanecem. Isso não cria um negócio.
                          </p>
                          {reactivate.isError ? (
                            <p className="text-xs font-medium text-destructive">
                              {getErrorMessage(
                                reactivate.error,
                                "Não foi possível reativar o lead.",
                              )}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="edit"
                              size="sm"
                              disabled={reactivate.isPending}
                              onClick={() => reactivate.mutate(current.id)}
                            >
                              {reactivate.isPending
                                ? "Reativando…"
                                : "Confirmar reativação"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={reactivate.isPending}
                              onClick={() => setReactivateOpen(false)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={() => setReactivateOpen(true)}
                        >
                          Reativar lead
                        </Button>
                      )
                    ) : null}
                  </>
                ) : null}
                {actions.markLost ? (
                  lostOpen ? (
                    <LeadLostPanel lead={current} />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => setLostOpen(true)}
                    >
                      Marcar como perdido
                    </Button>
                  )
                ) : null}
              </DetailSection>

              {qualification ? (
                <DetailSection id="lead-detail-qualification" title="Qualificação">
                  <DetailRow label="O que procura" value={qualification.seeking} />
                  <DetailRow
                    label="Ramo de interesse"
                    value={
                      qualification.interests.length
                        ? qualification.interests.join(", ")
                        : null
                    }
                  />
                  <DetailRow
                    label="Já coletado"
                    value={
                      qualification.collected.length
                        ? qualification.collected.join(" · ")
                        : null
                    }
                  />
                  <DetailRow
                    label="Pendências"
                    value={
                      qualification.pending.length
                        ? qualification.pending.join(" · ")
                        : "Nenhuma pendência dos dados principais"
                    }
                  />
                  <DetailRow label="Responsável" value={qualification.owner} />
                  <DetailRow
                    label="Último contato"
                    value={formatLastInteraction(qualification.lastContactAt)}
                  />
                  <DetailRow
                    label="Próxima ação"
                    value={
                      nextAction.scheduled
                        ? `${nextAction.label}${
                            nextAction.at
                              ? ` · ${formatLeadDetailDate(nextAction.at) ?? ""}`
                              : ""
                          }`
                        : nextAction.label
                    }
                  />
                </DetailSection>
              ) : null}

              <DetailSection
                id="lead-detail-questionnaires"
                title="Questionários"
              >
                <LeadQuestionnairesPanel
                  leadId={current.id}
                  onStart={
                    onStartIntelligentQuestionnaire
                      ? () => onStartIntelligentQuestionnaire(current)
                      : undefined
                  }
                  onContinue={
                    onContinueIntelligentQuestionnaire
                      ? (submission) =>
                          onContinueIntelligentQuestionnaire(current, submission)
                      : undefined
                  }
                  onView={onViewQuestionnaire}
                />
              </DetailSection>

              <DetailSection id="lead-detail-history" title="Histórico e atividades">
                <DetailRow
                  label="Última interação"
                  value={formatLastInteraction(
                    current.lastInteractionAt ?? current.lastContactAt,
                  )}
                />
                {current.nextContactAt || nextType || current.nextContactNotes ? (
                  <DetailRow
                    label="Próximo contato"
                    value={
                      [
                        formatLeadDetailDate(current.nextContactAt),
                        nextType,
                        current.nextContactNotes?.trim(),
                      ]
                        .filter(Boolean)
                        .join(" · ") || null
                    }
                  />
                ) : null}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">
                    {current.notes?.trim() || "Nenhuma observação registrada."}
                  </p>
                </div>
                <ActivityTimeline
                  leadId={current.id}
                  dealId={current.dealId}
                  embedded
                  showHeading={false}
                  presentation="drawer"
                  lockLink
                />
              </DetailSection>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-white px-5! py-3!">
              {actions.edit ? (
                <Button
                  type="button"
                  variant="crmSecondary"
                  onClick={() => onEdit(current)}
                >
                  <Pencil className="size-3.5" />
                  Editar lead
                </Button>
              ) : null}
              {actions.convert ? (
                <Button
                  type="button"
                  variant="crmPrimary"
                  onClick={() => onConvert(current)}
                >
                  <Briefcase className="size-3.5" />
                  Converter
                </Button>
              ) : null}
              {actions.openDeal && current.dealId ? (
                <Button
                  type="button"
                  variant="crmSecondary"
                  onClick={() => onOpenDeal(current.dealId!)}
                >
                  <ExternalLink className="size-3.5" />
                  Abrir negócio
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
