"use client"

import type { ReactNode } from "react"
import { Briefcase, CalendarClock, ExternalLink, Pencil, Phone } from "lucide-react"

import { ActivityTimeline } from "@/components/activities/activity-timeline"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  INTEREST_CATEGORY_LABELS,
  type InterestCategory,
} from "@/lib/business-units/constants"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import type { Lead } from "@/lib/data-access/modules/leads"
import { NEXT_CONTACT_ACTIVITY_OPTIONS } from "@/lib/data-access/modules/leads/lead-next-contact-form"
import { leadPipelinePresentation } from "@/lib/leads/lead-pipeline-clarity"
import { cn } from "@/lib/utils"
import { leadOwnerDisplayName } from "@/lib/leads/lead-owner"
import {
  deriveLeadOperationalBadges,
  deriveLeadPriority,
  LEAD_OPERATIONAL_BADGE_LABEL,
  LEAD_PRIORITY_LABEL,
  leadTelHref,
  leadWhatsAppHref,
} from "@/lib/leads/lead-operational-signals"

const STATUS_LABEL: Record<Lead["status"], string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
}

const STATUS_BADGE: Record<Lead["status"], string> = {
  new: "border-success/30 bg-success/15 text-success",
  contacted: "border-info/30 bg-info/12 text-info",
  qualified: "border-[var(--avila-gold-600)]/45 bg-[var(--avila-gold-600)]/16 text-[var(--avila-navy-900)]",
  converted: "border-success/30 bg-success/20 text-success",
  lost: "border-destructive/30 bg-destructive/12 text-destructive",
}

const PRIORITY_BADGE = {
  high: "bg-destructive/12 text-destructive",
  medium: "bg-warning/25 text-warning-foreground",
  low: "bg-muted text-muted-foreground",
} as const

const OPPORTUNITY_LABEL: Record<string, string> = {
  new_business: "Novo negócio",
  renewal: "Renovação",
  cross_sell: "Cross sell",
  indication: "Indicação",
}

function formatLeadMoment(iso?: string | null) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const start = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const diffDays = Math.round((start(date) - start(new Date())) / 86_400_000)
  if (diffDays === 0) return `Hoje, ${time}`
  if (diffDays === -1) return `Ontem, ${time}`
  if (diffDays === 1) return `Amanhã, ${time}`
  return `${date.toLocaleDateString("pt-BR")}, ${time}`
}

function formatPolicyExpiry(value?: string | null) {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("pt-BR")
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mx-4! mt-3! space-y-2 rounded-xl border border-border bg-white p-4!">
      <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null
  return (
    <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words whitespace-pre-wrap text-foreground">
        {value}
      </span>
    </div>
  )
}

type LeadDetailSheetProps = {
  lead: Lead | null
  open: boolean
  stageLabel?: string | null
  canConvert: boolean
  canViewDeals: boolean
  canSchedule: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (lead: Lead) => void
  onConvert: (lead: Lead) => void
  onSchedule: (lead: Lead) => void
  onOpenDeal: (dealId: string) => void
}

export function LeadDetailSheet({
  lead,
  open,
  stageLabel,
  canConvert,
  canViewDeals,
  canSchedule,
  onOpenChange,
  onEdit,
  onConvert,
  onSchedule,
  onOpenDeal,
}: LeadDetailSheetProps) {
  const view = lead ? leadPipelinePresentation(lead, stageLabel) : null
  const priority = lead ? deriveLeadPriority(lead) : null
  const badges = lead ? deriveLeadOperationalBadges(lead) : []
  const interests = (lead?.interestCategories ?? [])
    .map((item) => INTEREST_CATEGORY_LABELS[item as InterestCategory] ?? item)
    .filter(Boolean)
  const nextType = NEXT_CONTACT_ACTIVITY_OPTIONS.find(
    (item) => item.value === lead?.nextContactType,
  )?.label
  const tel = leadTelHref(lead?.phone)
  const whatsapp = leadWhatsAppHref(lead?.phone)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="avila-crm-canvas avila-lead-surface h-dvh max-h-dvh w-[min(560px,100%)] max-w-none gap-0 overflow-hidden p-0 text-foreground data-[side=right]:w-[min(560px,100%)] data-[side=right]:sm:max-w-[560px]!"
      >
        {lead && view && priority ? (
          <div className="flex h-full min-h-0 flex-col">
            <SheetHeader className="shrink-0 gap-2 border-b border-border bg-white px-5! py-4! pr-12!">
              <SheetTitle className="text-lg font-semibold tracking-tight text-[var(--avila-navy-900)]">
                {lead.name}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Detalhes do lead {lead.name}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={cn("rounded-full border px-2! py-0.5! font-semibold", STATUS_BADGE[lead.status])}>
                  {STATUS_LABEL[lead.status]}
                </span>
                <span className={cn("rounded-full px-2! py-0.5! font-semibold", PRIORITY_BADGE[priority])}>
                  {LEAD_PRIORITY_LABEL[priority]}
                </span>
                {badges.map((badge) => (
                  <span key={badge} className="text-muted-foreground">
                    {LEAD_OPERATIONAL_BADGE_LABEL[badge]}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Responsável: {leadOwnerDisplayName(lead) || "—"}
              </p>
              <Button
                type="button"
                variant="edit"
                size="sm"
                className="mt-1 w-fit"
                onClick={() => onEdit(lead)}
              >
                <Pencil className="size-3.5" />
                Editar lead
              </Button>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-4!">
              {lead.phone || lead.email || lead.source ? (
                <DetailSection title="Contato">
                  <DetailRow label="Telefone" value={lead.phone} />
                  {whatsapp ? (
                    <DetailRow label="WhatsApp" value={lead.phone} />
                  ) : null}
                  <DetailRow label="E-mail" value={lead.email} />
                  <DetailRow label="Origem" value={lead.source} />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="button" variant="contact" size="sm" disabled={!tel} onClick={() => tel && window.open(tel, "_self")}>
                      <Phone className="size-3.5" />
                      Ligar
                    </Button>
                    <Button type="button" variant="whatsapp" size="sm" disabled={!whatsapp} onClick={() => whatsapp && window.open(whatsapp, "_blank", "noopener,noreferrer")}>
                      <WhatsAppIcon className="size-3.5" />
                      WhatsApp
                    </Button>
                  </div>
                </DetailSection>
              ) : null}

              {interests.length || lead.company || lead.currentInsurer ? (
                <DetailSection title="Qualificação">
                  <DetailRow
                    label="Interesses"
                    value={interests.length ? interests.join(", ") : null}
                  />
                  <DetailRow label="Empresa" value={lead.company} />
                  <DetailRow label="Seguradora" value={lead.currentInsurer} />
                </DetailSection>
              ) : null}

              {lead.opportunityType ||
              lead.currentPolicyNumber ||
              lead.policyExpiresAt ? (
                <DetailSection title="Oportunidade">
                  <DetailRow
                    label="Tipo"
                    value={
                      lead.opportunityType
                        ? (OPPORTUNITY_LABEL[lead.opportunityType] ??
                          lead.opportunityType)
                        : null
                    }
                  />
                  <DetailRow label="Apólice" value={lead.currentPolicyNumber} />
                  <DetailRow
                    label="Vencimento"
                    value={formatPolicyExpiry(lead.policyExpiresAt)}
                  />
                </DetailSection>
              ) : null}

              {lead.nextContactAt || nextType || lead.nextContactNotes ? (
                <DetailSection title="Próxima ação">
                  <DetailRow
                    label="Quando"
                    value={formatLeadMoment(lead.nextContactAt)}
                  />
                  <DetailRow label="Atividade" value={nextType} />
                  <DetailRow label="Observação" value={lead.nextContactNotes} />
                  {canSchedule ? (
                    <Button type="button" variant="schedule" size="sm" className="w-fit" onClick={() => onSchedule(lead)}>
                      <CalendarClock className="size-3.5" />
                      {lead.nextContactAt ? "Reagendar" : "Agendar"}
                    </Button>
                  ) : null}
                </DetailSection>
              ) : null}

              {lead.notes?.trim() ? (
                <DetailSection title="Observações">
                  <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {lead.notes}
                  </p>
                </DetailSection>
              ) : null}

              <DetailSection title="Histórico comercial">
                <p className="text-sm text-muted-foreground">
                  {formatLastInteraction(lead.lastInteractionAt ?? lead.lastContactAt)}
                </p>
                <ActivityTimeline
                  leadId={lead.id}
                  dealId={lead.dealId}
                  embedded
                  showHeading={false}
                />
              </DetailSection>

              <DetailSection title="Pipeline">
                <p className="text-sm font-medium text-foreground">
                  {view.statusLabel}
                </p>
                {view.stageLabel ? (
                  <p className="text-sm text-muted-foreground">{view.stageLabel}</p>
                ) : null}
              </DetailSection>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-white px-5! py-3!">
              <Button
                type="button"
                variant="contact"
                size="sm"
                disabled={!tel}
                onClick={() => {
                  if (tel) window.open(tel, "_self")
                }}
              >
                <Phone className="size-3.5" />
                Ligar
              </Button>
              <Button
                type="button"
                variant="whatsapp"
                size="sm"
                disabled={!whatsapp}
                onClick={() => {
                  if (whatsapp) window.open(whatsapp, "_blank", "noopener,noreferrer")
                }}
              >
                <WhatsAppIcon className="size-3.5" />
                WhatsApp
              </Button>
              {canSchedule ? (
                <Button
                  type="button"
                  variant="schedule"
                  size="sm"
                  onClick={() => onSchedule(lead)}
                >
                  <CalendarClock className="size-3.5" />
                  Agendar
                </Button>
              ) : null}
              {view.showConvert && canConvert ? (
                <Button
                  type="button"
                  variant="convert"
                  size="sm"
                  onClick={() => onConvert(lead)}
                >
                  <Briefcase className="size-3.5" />
                  Converter
                </Button>
              ) : null}
              {view.showOpenDeal && canViewDeals && lead.dealId ? (
                <Button
                  type="button"
                  variant="view"
                  size="sm"
                  onClick={() => onOpenDeal(lead.dealId!)}
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
