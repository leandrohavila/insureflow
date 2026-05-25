"use client"

import {
  Activity,
  FileText,
  LayoutGrid,
  Link2,
  RefreshCw,
  Shield,
  Wallet,
} from "lucide-react"

import { EntitySheetShell, StatusPill } from "@/components/crm/primitives"
import {
  CustomerClaimsSection,
  CustomerFinancialSection,
  CustomerLifecycleBadge,
  CustomerOverviewSection,
  CustomerPoliciesSection,
  CustomerRelationshipsSection,
  CustomerRenewalSection,
} from "@/components/crm/sheet-sections/customer-sections"
import { OperationalTimelineLane } from "@/components/crm/sheet-sections/operational-timeline-lane"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { PortfolioCustomer } from "@/lib/crm/customer-health"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { useCrmPersistedValue } from "@/lib/hooks/use-crm-workspace-preferences"

type CustomerSheetV2Section =
  | "overview"
  | "policies"
  | "timeline"
  | "financial"
  | "claims"
  | "renewal"
  | "relationships"

const DEFAULT_SECTION: CustomerSheetV2Section = "overview"

const CUSTOMER_SECTIONS: CustomerSheetV2Section[] = [
  "overview",
  "policies",
  "timeline",
  "financial",
  "claims",
  "renewal",
  "relationships",
]

function isCustomerSheetSection(
  value: string,
): value is CustomerSheetV2Section {
  return CUSTOMER_SECTIONS.includes(value as CustomerSheetV2Section)
}

type CustomerSheetV2Props = {
  customer: PortfolioCustomer | null
  deals: CrmDeal[]
  open: boolean
  onOpenChange: (open: boolean) => void
  returnTo?: string
}

export function CustomerSheetV2({
  customer,
  deals,
  open,
  onOpenChange,
  returnTo,
}: CustomerSheetV2Props) {
  void returnTo
  const [persistedSection, setPersistedSection] = useCrmPersistedValue(
    "customerSheetSection",
    isCustomerSheetSection,
  )
  const section: CustomerSheetV2Section = isCustomerSheetSection(
    persistedSection,
  )
    ? persistedSection
    : DEFAULT_SECTION

  if (!customer) return null

  const lastInteractionLabel = formatLastInteraction(customer.lastInteractionAt)

  return (
    <EntitySheetShell
      open={open}
      onOpenChange={onOpenChange}
      activeSection={section}
      onSectionChange={(id) =>
        setPersistedSection(id as CustomerSheetV2Section)
      }
      ariaLabel={`Cliente: ${customer.name}`}
      ariaDescription={`Carteira operacional do segurado ${customer.name}.`}
      width="default"
    >
      <EntitySheetShell.Header>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone="success" variant="soft" size="sm" dot>
            Carteira operacional
          </StatusPill>
          <CustomerLifecycleBadge stage={customer.lifecycleStage} />
          <StatusPill tone="neutral" variant="outline" size="xs">
            {customer.healthLabel}
          </StatusPill>
        </div>

        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="size-11 border border-white/10">
            <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
              {customer.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {customer.name}
            </h2>
            <p className="crm-text-meta truncate">
              {customer.companyName ?? "Segurado · carteira ativa"}
            </p>
          </div>
        </div>

        <div className="crm-text-meta flex flex-wrap gap-x-4 gap-y-1">
          <span>Health {customer.healthScore}%</span>
          <span>{customer.dealIds.length} negócio(s)</span>
          <span>Última interação {lastInteractionLabel}</span>
        </div>
      </EntitySheetShell.Header>

      <EntitySheetShell.Rail label="Seções do cliente">
        <EntitySheetShell.RailItem id="overview" icon={LayoutGrid}>
          Visão geral
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="policies" icon={Shield}>
          Apólices
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="timeline" icon={Activity}>
          Timeline
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="financial" icon={Wallet}>
          Financeiro
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="claims" icon={FileText}>
          Sinistros
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="renewal" icon={RefreshCw}>
          Renovação
        </EntitySheetShell.RailItem>
        <EntitySheetShell.RailItem id="relationships" icon={Link2}>
          Relacionamentos
        </EntitySheetShell.RailItem>
      </EntitySheetShell.Rail>

      <EntitySheetShell.Body>
        {section === "overview" ? (
          <div className="entity-sheet-section">
            <CustomerOverviewSection customer={customer} />
          </div>
        ) : null}
        {section === "policies" ? (
          <div className="entity-sheet-section">
            <CustomerPoliciesSection />
          </div>
        ) : null}
        {section === "timeline" ? (
          <div className="entity-sheet-section">
            <OperationalTimelineLane customer={customer} deals={deals} />
          </div>
        ) : null}
        {section === "financial" ? (
          <div className="entity-sheet-section">
            <CustomerFinancialSection />
          </div>
        ) : null}
        {section === "claims" ? (
          <div className="entity-sheet-section">
            <CustomerClaimsSection />
          </div>
        ) : null}
        {section === "renewal" ? (
          <div className="entity-sheet-section">
            <CustomerRenewalSection customer={customer} />
          </div>
        ) : null}
        {section === "relationships" ? (
          <div className="entity-sheet-section">
            <CustomerRelationshipsSection customer={customer} deals={deals} />
          </div>
        ) : null}
      </EntitySheetShell.Body>
    </EntitySheetShell>
  )
}
