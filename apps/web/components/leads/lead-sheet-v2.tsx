"use client"

import {
  Activity,
  ArrowRightLeft,
  ArrowUpRight,
  ClipboardList,
  Compass,
  Database,
  Edit3,
  LayoutGrid,
} from "lucide-react"

import { ActivityQuickActions } from "@/components/activities/activity-quick-actions"
import { EntitySheetShell, StatusPill } from "@/components/crm/primitives"
import { TimelineLane } from "@/components/crm/sheet-sections/timeline-lane"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { useActivityTimeline } from "@/lib/data-access/modules/activities"
import { useCrmPersistedValue } from "@/lib/hooks/use-crm-workspace-preferences"
import type { Lead } from "@/lib/data-access/modules/leads"
import { cn } from "@/lib/utils"

import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "./lead-shared"
import { LeadCommercialSection } from "./sheet-sections/lead-commercial-section"
import { LeadConversionSection } from "./sheet-sections/lead-conversion-section"
import { LeadDataSection } from "./sheet-sections/lead-data-section"
import { LeadOverviewSection } from "./sheet-sections/lead-overview-section"
import { LeadSourceSection } from "./sheet-sections/lead-source-section"

/* -------------------------------------------------------------------------- */
/* Tipos                                                                        */
/* -------------------------------------------------------------------------- */

type LeadSheetV2Section =
  | "overview"
  | "timeline"
  | "commercial"
  | "source"
  | "data"
  | "conversion"

const DEFAULT_SECTION: LeadSheetV2Section = "overview"

const LEAD_SECTIONS: LeadSheetV2Section[] = [
  "overview",
  "timeline",
  "commercial",
  "source",
  "data",
  "conversion",
]

function isLeadSheetSection(value: string): value is LeadSheetV2Section {
  return LEAD_SECTIONS.includes(value as LeadSheetV2Section)
}

type LeadSheetV2Props = {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Conversão: dispara o `ConvertLeadDialog` já presente no `LeadsPage`. */
  onConvert: (lead: Lead) => void
  /** Edição de campos: abre o `LeadDialog` legado em modo edição. */
  onEdit?: (lead: Lead) => void
  /** Abre o `QuestionnaireSubmissionDialog` para preencher/continuar. */
  onFillQuestionnaire: (lead: Lead) => void
  /** Abre o `QuestionnaireSubmissionDetailSheet` para visualizar respostas. */
  onViewSubmission: (submissionId: string) => void
  /** Estado da mutation de conversão. Apenas reflexo visual no CTA. */
  isConverting?: boolean
}

/* -------------------------------------------------------------------------- */
/* LeadSheetV2                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Workspace operacional de Lead — v2.
 *
 * Espelho narrativo do `DealSheetV2`: header sticky de 4 zonas, rail vertical
 * com 6 seções, body single-section. Reusa `EntitySheetShell` (Fase 2.1) e
 * `TimelineLane` (Fase 2.2), além de `useActivityTimeline` apenas para popular
 * o badge de count no rail (mesma key da Timeline — React Query deduplica).
 *
 * Princípios visuais aplicados:
 * - Cockpit operacional: header sticky com identidade, status e ação hero.
 * - Hierarchy-first: surface ladder (raised > panel > base) no shell.
 * - Continuidade cognitiva com o Deal: mesmas pills, mesma tipografia,
 *   mesmo rail, mesmas surfaces.
 * - NÃO altera nenhum hook, mutation ou query existente. Todas as ações
 *   (converter / editar / questionário) são callbacks que o consumer
 *   (`LeadsPage`) implementa exatamente como já fazia.
 *
 * Permanece atrás de feature flag `?sheet=v2` até validação interna.
 */
export function LeadSheetV2({
  lead,
  open,
  onOpenChange,
  onConvert,
  onEdit,
  onFillQuestionnaire,
  onViewSubmission,
  isConverting = false,
}: LeadSheetV2Props) {
  const [persistedSection, setPersistedSection] = useCrmPersistedValue(
    "leadSheetSection",
    isLeadSheetSection,
  )
  const section: LeadSheetV2Section = isLeadSheetSection(persistedSection)
    ? persistedSection
    : DEFAULT_SECTION

  const setSection = (id: LeadSheetV2Section) => {
    setPersistedSection(id)
  }

  const leadId = lead?.id ?? null

  // Reusa o cache de useActivityTimeline (mesma key usada pela TimelineLane
  // e pela ActivityTimeline embedded). React Query deduplica — sem fetch
  // adicional, mesmo abrindo o sheet várias vezes.
  const timelineQuery = useActivityTimeline({
    leadId,
    dealId: lead?.dealId ?? null,
  })
  const activityCount = timelineQuery.data?.data.length ?? null

  if (!lead) return null

  const statusTone = LEAD_STATUS_TONE[lead.status]
  const statusLabel = LEAD_STATUS_LABEL[lead.status]
  const lastInteractionLabel = formatLastInteraction(
    lead.lastInteractionAt ?? lead.lastContactAt,
  )

  const isConverted = lead.status === "converted" || Boolean(lead.dealId)
  const conversionTone = isConverted ? "success" : "neutral"

  // Inferir iniciais do owner (campo livre). Se não houver responsável,
  // caímos nas iniciais do próprio lead — não renderiza avatar vazio.
  const ownerName = lead.assignedTo?.trim() || ""
  const ownerInitials = ownerName
    ? ownerName
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : lead.initials

  return (
    <EntitySheetShell
      open={open}
      onOpenChange={onOpenChange}
      activeSection={section}
      onSectionChange={(id) => setSection(id as LeadSheetV2Section)}
      ariaLabel={`Lead: ${lead.name}`}
      ariaDescription={`Workspace operacional do lead ${lead.name}, com status ${statusLabel}.`}
      width="default"
    >
      {/* -------------------------------------------------------------- */}
      {/* HEADER — quatro zonas verticais (espelho do DealSheetV2):       */}
      {/*   1) status (status do lead + origem)                            */}
      {/*   2) identidade (nome + empresa) + ação hero (Converter ou      */}
      {/*      Abrir negócio se já convertido)                             */}
      {/*   3) meta (owner, última interação)                             */}
      {/*   4) quick actions                                              */}
      {/* -------------------------------------------------------------- */}
      <EntitySheetShell.Header>
        {/* Zona 1 — status badges em linha */}
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone={statusTone} variant="soft" size="sm" dot>
            {statusLabel}
          </StatusPill>
          {lead.source ? (
            <StatusPill tone="neutral" variant="outline" size="xs">
              {lead.source}
            </StatusPill>
          ) : null}
        </div>

        {/* Zona 2 — identidade + ação hero */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.1rem] leading-tight font-semibold tracking-[-0.025em] text-foreground md:text-[1.25rem]">
              {lead.name}
            </h2>
            {lead.company ? (
              <p className="crm-text-meta mt-0.5 truncate text-foreground/70">
                {lead.company}
              </p>
            ) : null}
          </div>

          {isConverted && lead.dealId ? (
            // Já convertido — área hero vira link para o negócio gerado.
            // Mantém o mesmo espaço visual do CTA "Converter", para que a
            // hierarquia do header não "pule" entre leads de status diferentes.
            <a
              href={`/crm/negocios?deal=${lead.dealId}`}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "shrink-0 gap-2",
              )}
              aria-label="Abrir negócio gerado a partir deste lead"
            >
              Abrir negócio
              <ArrowUpRight className="size-3.5" />
            </a>
          ) : isConverted ? (
            // Status converted mas sem dealId (edge case legado): só o pill.
            <StatusPill tone="success" variant="soft" size="sm">
              Convertido
            </StatusPill>
          ) : (
            <Button
              type="button"
              size="sm"
              className="shrink-0 gap-2"
              disabled={isConverting}
              onClick={() => onConvert(lead)}
              aria-label="Converter lead em negócio"
            >
              <ArrowRightLeft className="size-3.5" />
              {isConverting ? "Convertendo…" : "Converter em negócio"}
            </Button>
          )}
        </div>

        {/* Zona 3 — meta operacional */}
        <div className="crm-text-meta flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="bg-primary/20 text-[9px] text-primary">
                {ownerInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground/80">
              {ownerName || "Sem responsável"}
            </span>
          </span>
          <span aria-hidden className="text-foreground/25">·</span>
          <span className="text-foreground/65">{lastInteractionLabel}</span>
        </div>

        {/* Zona 4 — ações rápidas (mesmo componente do Deal) */}
        <div
          className="flex flex-col gap-2 pt-1"
          style={{
            borderTop: "1px dashed var(--crm-stroke-faint)",
            paddingTop: "0.75rem",
            marginTop: "0.125rem",
          }}
        >
          <ActivityQuickActions
            leadId={lead.id}
            dealId={lead.dealId}
            compact
          />
          {onEdit ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-fit gap-1.5 px-2 text-xs text-foreground/65 hover:text-foreground"
              onClick={() => onEdit(lead)}
            >
              <Edit3 className="size-3" strokeWidth={1.75} />
              Editar dados do lead
            </Button>
          ) : null}
        </div>
      </EntitySheetShell.Header>

      {/* -------------------------------------------------------------- */}
      {/* RAIL                                                            */}
      {/* -------------------------------------------------------------- */}
      <EntitySheetShell.Rail label="Seções do lead">
        <EntitySheetShell.RailItem id="overview" icon={LayoutGrid}>
          Visão geral
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem
          id="timeline"
          icon={Activity}
          count={activityCount ?? undefined}
        >
          Timeline
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="commercial" icon={ClipboardList}>
          Comercial
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="source" icon={Compass}>
          Origem
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="data" icon={Database}>
          Dados
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem
          id="conversion"
          icon={ArrowRightLeft}
          trailing={
            isConverted ? (
              <StatusPill tone={conversionTone} variant="soft" size="xs">
                Convertido
              </StatusPill>
            ) : undefined
          }
        >
          Conversão
        </EntitySheetShell.RailItem>
      </EntitySheetShell.Rail>

      {/* -------------------------------------------------------------- */}
      {/* BODY                                                            */}
      {/* -------------------------------------------------------------- */}
      <EntitySheetShell.Body>
        {section === "overview" ? (
          <div className="entity-sheet-section">
            <LeadOverviewSection lead={lead} />
          </div>
        ) : null}

        {section === "timeline" ? (
          <div className="entity-sheet-section">
            <TimelineLane leadId={lead.id} dealId={lead.dealId} />
          </div>
        ) : null}

        {section === "commercial" ? (
          <div className="entity-sheet-section">
            <LeadCommercialSection
              lead={lead}
              onFillQuestionnaire={onFillQuestionnaire}
              onViewSubmission={onViewSubmission}
            />
          </div>
        ) : null}

        {section === "source" ? (
          <div className="entity-sheet-section">
            <LeadSourceSection lead={lead} />
          </div>
        ) : null}

        {section === "data" ? (
          <div className="entity-sheet-section">
            <LeadDataSection lead={lead} />
          </div>
        ) : null}

        {section === "conversion" ? (
          <div className="entity-sheet-section">
            <LeadConversionSection
              lead={lead}
              isConverting={isConverting}
              onConvert={onConvert}
              onFillQuestionnaire={onFillQuestionnaire}
            />
          </div>
        ) : null}
      </EntitySheetShell.Body>
    </EntitySheetShell>
  )
}
