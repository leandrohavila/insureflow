"use client"

import { useMemo } from "react"
import {
  Activity,
  Briefcase,
  FileText,
  LayoutGrid,
  ShieldCheck,
  UserPlus,
} from "lucide-react"

import { ActivityQuickActions } from "@/components/activities/activity-quick-actions"
import { EntitySheetShell, StatusPill } from "@/components/crm/primitives"
import { DealCommercialSection } from "@/components/crm/sheet-sections/deal-commercial-section"
import { DealLeadSection } from "@/components/crm/sheet-sections/deal-lead-section"
import { DealOverviewSection } from "@/components/crm/sheet-sections/deal-overview-section"
import { PlaceholderSection } from "@/components/crm/sheet-sections/placeholder-section"
import { TimelineLane } from "@/components/crm/sheet-sections/timeline-lane"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import {
  PRIORITY_LABEL,
  PRIORITY_TONE,
  STAGE_TONE,
} from "@/components/crm/sheet-sections/deal-shared"
import { useActivityTimeline } from "@/lib/data-access/modules/activities"
import { useCrmPersistedValue } from "@/lib/hooks/use-crm-workspace-preferences"
import {
  formatCurrency,
  stageLabelMap,
  type CrmDeal,
} from "@/lib/data-access/modules/crm"

/* -------------------------------------------------------------------------- */
/* Tipos                                                                        */
/* -------------------------------------------------------------------------- */

type DealSheetV2Section =
  | "overview"
  | "timeline"
  | "commercial"
  | "lead"
  | "documents"
  | "policies"

const DEFAULT_SECTION: DealSheetV2Section = "overview"

const DEAL_SECTIONS: DealSheetV2Section[] = [
  "overview",
  "timeline",
  "commercial",
  "lead",
  "documents",
  "policies",
]

function isDealSheetSection(value: string): value is DealSheetV2Section {
  return DEAL_SECTIONS.includes(value as DealSheetV2Section)
}

type DealSheetV2Props = {
  deal: CrmDeal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  crmReturnHref?: string
}

/* -------------------------------------------------------------------------- */
/* DealSheetV2                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Workspace operacional de Negócio — v2.
 *
 * Consome `EntitySheetShell` (Fase 2.1) e `TimelineLane` (Fase 2.2). Cada
 * seção do rail é uma composição visual sobre os mesmos dados do `CrmDeal`
 * — nenhum hook, mutation ou query é alterado em relação ao `DealDetailSheet`
 * legado. Permanece atrás de feature flag `?sheet=v2` até validação.
 *
 * Princípios visuais aplicados:
 * - Cockpit operacional: header sticky com identidade, prioridade e ações.
 * - Hierarchy-first: surface ladder (raised > panel > base) no shell.
 * - Scanability: PropertyCell label-em-cima + gap-px hairlines.
 * - Single-section view: zero scrollspy, foco operacional por contexto.
 */
export function DealSheetV2({
  deal,
  open,
  onOpenChange,
  crmReturnHref,
}: DealSheetV2Props) {
  const [persistedSection, setPersistedSection] = useCrmPersistedValue(
    "dealSheetSection",
    isDealSheetSection,
  )
  const section: DealSheetV2Section = isDealSheetSection(persistedSection)
    ? persistedSection
    : DEFAULT_SECTION

  const setSection = (id: DealSheetV2Section) => {
    setPersistedSection(id)
  }

  const leadId = deal?.convertedLead?.id ?? null
  const dealId = deal?.id ?? null

  // Reusa o cache de useActivityTimeline (mesma key usada pela TimelineLane
  // e pela ActivityTimeline). React Query deduplica — sem fetch adicional.
  const timelineQuery = useActivityTimeline({
    leadId,
    dealId,
  })
  const activityCount = timelineQuery.data?.data.length ?? null

  const lastInteractionLabel = useMemo(
    () => formatLastInteraction(deal?.commercialContext?.lastInteractionAt),
    [deal?.commercialContext?.lastInteractionAt],
  )

  if (!deal) return null

  const stageLabel = stageLabelMap[deal.stage]
  const stageTone = STAGE_TONE[deal.stage]
  const priorityTone = PRIORITY_TONE[deal.priority]
  const priorityLabel = PRIORITY_LABEL[deal.priority]

  return (
    <EntitySheetShell
      open={open}
      onOpenChange={onOpenChange}
      activeSection={section}
      onSectionChange={(id) => setSection(id as DealSheetV2Section)}
      ariaLabel={`Negócio: ${deal.title}`}
      ariaDescription={`Workspace operacional do negócio ${deal.title}, no estágio ${stageLabel}.`}
      width="default"
    >
      {/* -------------------------------------------------------------- */}
      {/* HEADER — quatro zonas verticais:                                */}
      {/*   1) status (stage + priority)                                  */}
      {/*   2) identidade (título) + valor (área hero à direita)          */}
      {/*   3) meta (owner, última interação)                             */}
      {/*   4) quick actions                                              */}
      {/* -------------------------------------------------------------- */}
      <EntitySheetShell.Header>
        {/* Zona 1 — status badges em linha */}
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone={stageTone} variant="soft" size="sm" dot>
            {stageLabel}
          </StatusPill>
          <StatusPill tone={priorityTone} variant="soft" size="xs" dot>
            {priorityLabel}
          </StatusPill>
        </div>

        {/* Zona 2 — identidade + valor (área hero) */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h2 className="min-w-0 flex-1 text-[1.1rem] leading-tight font-semibold tracking-[-0.025em] text-foreground md:text-[1.25rem]">
            {deal.title}
          </h2>
          <p
            className="crm-text-metric shrink-0 text-[1.4rem] leading-none font-semibold tracking-[-0.03em] text-foreground md:text-[1.55rem]"
            aria-label="Valor do negócio"
          >
            {formatCurrency(deal.value)}
          </p>
        </div>

        {/* Zona 3 — meta operacional */}
        <div className="crm-text-meta flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="bg-primary/20 text-[9px] text-primary">
                {deal.ownerInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground/80">{deal.owner}</span>
          </span>
          <span aria-hidden className="text-foreground/25">·</span>
          <span className="text-foreground/65">{lastInteractionLabel}</span>
        </div>

        {/* Zona 4 — ações rápidas, separadas por um hairline sutil. */}
        <div
          className="pt-1"
          style={{
            borderTop: "1px dashed var(--crm-stroke-faint)",
            paddingTop: "0.75rem",
            marginTop: "0.125rem",
          }}
        >
          <ActivityQuickActions dealId={deal.id} leadId={leadId} compact />
        </div>
      </EntitySheetShell.Header>

      {/* -------------------------------------------------------------- */}
      {/* RAIL                                                            */}
      {/* -------------------------------------------------------------- */}
      <EntitySheetShell.Rail label="Seções do negócio">
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
        <EntitySheetShell.RailItem id="commercial" icon={Briefcase}>
          Comercial
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem
          id="lead"
          icon={UserPlus}
          trailing={
            !deal.convertedLead ? (
              <span className="crm-text-micro text-foreground/45">—</span>
            ) : undefined
          }
        >
          Lead origem
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="documents" icon={FileText} disabled>
          Documentos
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="policies" icon={ShieldCheck} disabled>
          Apólices
        </EntitySheetShell.RailItem>
      </EntitySheetShell.Rail>

      {/* -------------------------------------------------------------- */}
      {/* BODY                                                            */}
      {/* -------------------------------------------------------------- */}
      <EntitySheetShell.Body>
        {section === "overview" ? (
          <div className="entity-sheet-section">
            <DealOverviewSection deal={deal} />
          </div>
        ) : null}

        {section === "timeline" ? (
          <div className="entity-sheet-section">
            <TimelineLane dealId={deal.id} leadId={leadId} />
          </div>
        ) : null}

        {section === "commercial" ? (
          <div className="entity-sheet-section">
            <DealCommercialSection deal={deal} crmReturnHref={crmReturnHref} />
          </div>
        ) : null}

        {section === "lead" ? (
          <div className="entity-sheet-section">
            <DealLeadSection deal={deal} />
          </div>
        ) : null}

        {section === "documents" ? (
          <div className="entity-sheet-section">
            <PlaceholderSection
              title="Documentos"
              icon={FileText}
              description="Anexos, contratos e arquivos vinculados ao negócio. Disponível em uma próxima fase."
              badge="Em desenvolvimento"
            />
          </div>
        ) : null}

        {section === "policies" ? (
          <div className="entity-sheet-section">
            <PlaceholderSection
              title="Apólices"
              icon={ShieldCheck}
              description="Apólices emitidas, vigências e renovações associadas a este negócio. Disponível em uma próxima fase."
              badge="Em desenvolvimento"
            />
          </div>
        ) : null}
      </EntitySheetShell.Body>
    </EntitySheetShell>
  )
}
