"use client"

import {
  Activity,
  Briefcase,
  LayoutGrid,
  Users,
} from "lucide-react"

import { EntitySheetShell, StatusPill } from "@/components/crm/primitives"
import {
  CompanyContactsSection,
  CompanyDealsSection,
  CompanyOverviewSection,
} from "@/components/crm/sheet-sections/company-sections"
import { MergedTimelineLane } from "@/components/crm/sheet-sections/merged-timeline-lane"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { useMergedActivityTimeline } from "@/lib/crm/relationship/hooks"
import type { OperationalCompany } from "@/lib/crm/relationship"
import { formatCurrency } from "@/lib/data-access/modules/crm"
import { useCrmPersistedValue } from "@/lib/hooks/use-crm-workspace-preferences"

type CompanySheetV2Section =
  | "overview"
  | "timeline"
  | "contacts"
  | "deals"

const DEFAULT_SECTION: CompanySheetV2Section = "overview"

const COMPANY_SECTIONS: CompanySheetV2Section[] = [
  "overview",
  "timeline",
  "contacts",
  "deals",
]

function isCompanySheetSection(value: string): value is CompanySheetV2Section {
  return COMPANY_SECTIONS.includes(value as CompanySheetV2Section)
}

type CompanySheetV2Props = {
  company: OperationalCompany | null
  open: boolean
  onOpenChange: (open: boolean) => void
  returnTo?: string
}

export function CompanySheetV2({
  company,
  open,
  onOpenChange,
  returnTo = "/crm/empresas",
}: CompanySheetV2Props) {
  const [persistedSection, setPersistedSection] = useCrmPersistedValue(
    "companySheetSection",
    isCompanySheetSection,
  )
  const section: CompanySheetV2Section = isCompanySheetSection(persistedSection)
    ? persistedSection
    : DEFAULT_SECTION

  const leadIds =
    company?.contacts.flatMap((contact) => contact.leadIds) ?? []
  const dealIds = company?.dealIds ?? []

  const timeline = useMergedActivityTimeline({
    leadIds,
    dealIds,
    enabled: open && Boolean(company),
  })

  if (!company) return null

  const lastInteractionLabel = formatLastInteraction(
    company.lastInteractionAt ?? timeline.data[0]?.occurredAt,
  )

  return (
    <EntitySheetShell
      open={open}
      onOpenChange={onOpenChange}
      activeSection={section}
      onSectionChange={(id) => setPersistedSection(id as CompanySheetV2Section)}
      ariaLabel={`Empresa: ${company.name}`}
      ariaDescription={`Workspace operacional da empresa ${company.name}.`}
      width="default"
    >
      <EntitySheetShell.Header>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone="brand" variant="soft" size="sm" dot>
            Conta corporativa
          </StatusPill>
          {company.openDealCount > 0 ? (
            <StatusPill tone="warn" variant="outline" size="xs">
              {company.openDealCount} aberto(s)
            </StatusPill>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.1rem] leading-tight font-semibold tracking-[-0.025em] text-foreground md:text-[1.25rem]">
              {company.name}
            </h2>
            <p className="crm-text-meta mt-0.5 truncate text-foreground/70">
              {company.domain}
            </p>
          </div>
          <p className="crm-text-metric shrink-0 text-[1.2rem] font-semibold tracking-[-0.03em]">
            {formatCurrency(company.pipelineValue)}
          </p>
        </div>

        <div className="crm-text-meta flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="bg-primary/20 text-[9px] text-primary">
                {company.ownerInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground/80">{company.owner}</span>
          </span>
          <span aria-hidden className="text-foreground/25">
            ·
          </span>
          <span className="text-foreground/65">{lastInteractionLabel}</span>
          <span aria-hidden className="text-foreground/25">
            ·
          </span>
          <span className="text-foreground/65">
            {company.contactCount} contato(s)
          </span>
        </div>
      </EntitySheetShell.Header>

      <EntitySheetShell.Rail label="Seções da empresa">
        <EntitySheetShell.RailItem id="overview" icon={LayoutGrid}>
          Visão geral
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem
          id="timeline"
          icon={Activity}
          count={timeline.total || undefined}
        >
          Timeline
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem
          id="contacts"
          icon={Users}
          count={company.contactCount || undefined}
        >
          Contatos
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem
          id="deals"
          icon={Briefcase}
          count={company.dealCount || undefined}
        >
          Negócios
        </EntitySheetShell.RailItem>
      </EntitySheetShell.Rail>

      <EntitySheetShell.Body>
        {section === "overview" ? (
          <div className="entity-sheet-section">
            <CompanyOverviewSection company={company} />
          </div>
        ) : null}

        {section === "timeline" ? (
          <div className="entity-sheet-section">
            <MergedTimelineLane leadIds={leadIds} dealIds={dealIds} />
          </div>
        ) : null}

        {section === "contacts" ? (
          <div className="entity-sheet-section">
            <CompanyContactsSection company={company} returnTo={returnTo} />
          </div>
        ) : null}

        {section === "deals" ? (
          <div className="entity-sheet-section">
            <CompanyDealsSection company={company} returnTo={returnTo} />
          </div>
        ) : null}
      </EntitySheetShell.Body>
    </EntitySheetShell>
  )
}
