"use client"

import { useMemo } from "react"
import {
  Activity,
  Building2,
  LayoutGrid,
  Link2,
  User,
} from "lucide-react"

import { ActivityQuickActions } from "@/components/activities/activity-quick-actions"
import { EntitySheetShell, StatusPill } from "@/components/crm/primitives"
import {
  ContactOverviewSection,
  ContactRelationshipsSection,
} from "@/components/crm/sheet-sections/contact-sections"
import { MergedTimelineLane } from "@/components/crm/sheet-sections/merged-timeline-lane"
import { LifecycleBadge } from "@/components/crm/crm-record-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  formatPhoneBrMask,
  formatStoredPhone,
} from "@/lib/documents/document"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { useMergedActivityTimeline } from "@/lib/crm/relationship/hooks"
import { companyIdFromName } from "@/lib/crm/relationship/identity"
import type { OperationalContact } from "@/lib/crm/relationship"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { useLeads } from "@/lib/data-access/modules/leads"
import { useCrmPersistedValue } from "@/lib/hooks/use-crm-workspace-preferences"

type ContactSheetV2Section =
  | "overview"
  | "timeline"
  | "relationships"
  | "company"

const DEFAULT_SECTION: ContactSheetV2Section = "overview"

const CONTACT_SECTIONS: ContactSheetV2Section[] = [
  "overview",
  "timeline",
  "relationships",
  "company",
]

function isContactSheetSection(value: string): value is ContactSheetV2Section {
  return CONTACT_SECTIONS.includes(value as ContactSheetV2Section)
}

type ContactSheetV2Props = {
  contact: OperationalContact | null
  open: boolean
  onOpenChange: (open: boolean) => void
  returnTo?: string
}

export function ContactSheetV2({
  contact,
  open,
  onOpenChange,
  returnTo = "/crm/contatos",
}: ContactSheetV2Props) {
  const [persistedSection, setPersistedSection] = useCrmPersistedValue(
    "contactSheetSection",
    isContactSheetSection,
  )
  const section: ContactSheetV2Section = isContactSheetSection(persistedSection)
    ? persistedSection
    : DEFAULT_SECTION

  const timeline = useMergedActivityTimeline({
    leadIds: contact?.leadIds ?? [],
    dealIds: contact?.dealIds ?? [],
    enabled: open && Boolean(contact),
  })

  const dealsQuery = useCrmDeals()
  const leadsQuery = useLeads({ limit: 500, page: 1 })

  const dealLabels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const deal of dealsQuery.data ?? []) {
      map[deal.id] = deal.title
    }
    return map
  }, [dealsQuery.data])

  const leadLabels = useMemo(() => {
    const map: Record<string, string> = {}
    for (const lead of leadsQuery.data?.data ?? []) {
      map[lead.id] = lead.name
    }
    return map
  }, [leadsQuery.data?.data])

  const phoneLabel = useMemo(() => {
    if (!contact?.phone) return null
    return formatPhoneBrMask(formatStoredPhone(contact.phone))
  }, [contact?.phone])

  if (!contact) return null

  const lastInteractionLabel = formatLastInteraction(
    contact.lastInteractionAt ?? timeline.data[0]?.occurredAt,
  )

  return (
    <EntitySheetShell
      open={open}
      onOpenChange={onOpenChange}
      activeSection={section}
      onSectionChange={(id) => setPersistedSection(id as ContactSheetV2Section)}
      ariaLabel={`Contato: ${contact.name}`}
      ariaDescription={`Workspace operacional do contato ${contact.name}.`}
      width="default"
    >
      <EntitySheetShell.Header>
        <div className="flex flex-wrap items-center gap-1.5">
          <LifecycleBadge label={contact.lifecycle} />
          {contact.identityWarnings.length > 0 ? (
            <StatusPill tone="warn" variant="soft" size="xs">
              Identidade consolidada
            </StatusPill>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.1rem] leading-tight font-semibold tracking-[-0.025em] text-foreground md:text-[1.25rem]">
              {contact.name}
            </h2>
            {contact.companies[0] ? (
              <p className="crm-text-meta mt-0.5 truncate text-foreground/70">
                {contact.companies[0]}
              </p>
            ) : null}
          </div>
          {phoneLabel ? (
            <p className="crm-text-metric shrink-0 text-sm font-medium tabular-nums text-foreground/90">
              {phoneLabel}
            </p>
          ) : null}
        </div>

        <div className="crm-text-meta flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="bg-primary/20 text-[9px] text-primary">
                {contact.ownerInitials}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground/80">{contact.owner}</span>
          </span>
          <span aria-hidden className="text-foreground/25">
            ·
          </span>
          <span className="text-foreground/65">{lastInteractionLabel}</span>
          {timeline.nextFollowUpAt ? (
            <>
              <span aria-hidden className="text-foreground/25">
                ·
              </span>
              <span className="text-amber-200/90">
                Follow-up: {formatLastInteraction(timeline.nextFollowUpAt)}
              </span>
            </>
          ) : null}
        </div>

        <div
          className="pt-1"
          style={{
            borderTop: "1px dashed var(--crm-stroke-faint)",
            paddingTop: "0.75rem",
            marginTop: "0.125rem",
          }}
        >
          <ActivityQuickActions
            leadId={contact.primaryLeadId}
            dealId={contact.primaryDealId}
            compact
          />
        </div>
      </EntitySheetShell.Header>

      <EntitySheetShell.Rail label="Seções do contato">
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
        <EntitySheetShell.RailItem id="relationships" icon={Link2}>
          Relacionamentos
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="company" icon={Building2}>
          Empresa
        </EntitySheetShell.RailItem>
      </EntitySheetShell.Rail>

      <EntitySheetShell.Body>
        {section === "overview" ? (
          <div className="entity-sheet-section">
            <ContactOverviewSection contact={contact} />
          </div>
        ) : null}

        {section === "timeline" ? (
          <div className="entity-sheet-section">
            <MergedTimelineLane
              leadIds={contact.leadIds}
              dealIds={contact.dealIds}
            />
          </div>
        ) : null}

        {section === "relationships" ? (
          <div className="entity-sheet-section">
            <ContactRelationshipsSection
              contact={contact}
              returnTo={returnTo}
              dealLabels={dealLabels}
              leadLabels={leadLabels}
            />
          </div>
        ) : null}

        {section === "company" ? (
          <div className="entity-sheet-section">
            <SectionCompanyContext contact={contact} returnTo={returnTo} />
          </div>
        ) : null}
      </EntitySheetShell.Body>
    </EntitySheetShell>
  )
}

function SectionCompanyContext({
  contact,
  returnTo,
}: {
  contact: OperationalContact
  returnTo: string
}) {
  if (contact.companies.length === 0) {
    return (
      <p className="crm-text-meta text-muted-foreground">
        Nenhuma empresa vinculada a este contato.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {contact.companies.map((companyName) => {
        const companyId = companyIdFromName(companyName)
        return (
          <a
            key={companyName}
            href={`/crm/empresas?company=${encodeURIComponent(companyId)}&sheet=v2&returnTo=${encodeURIComponent(returnTo)}`}
            className="crm-surface-panel flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-white/[0.04]"
          >
            <User className="size-4 text-primary" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="font-medium">{companyName}</p>
              <p className="crm-text-meta text-muted-foreground">
                Abrir workspace empresarial
              </p>
            </div>
          </a>
        )
      })}
    </div>
  )
}
