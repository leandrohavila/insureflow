"use client"

import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  FileText,
  Hash,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react"

import {
  MetricStrip,
  SectionPanel,
  StatusPill,
} from "@/components/crm/primitives"
import { PlaceholderSection } from "@/components/crm/sheet-sections/placeholder-section"
import { PropertyCell, PropertyGrid } from "@/components/crm/sheet-sections/deal-shared"
import { buildEntitySheetHref } from "@/lib/crm/entity-sheet-navigation"
import {
  customerLifecycleLabel,
  CUSTOMER_LIFECYCLE_TONES,
  normalizeCustomerLifecycleStage,
} from "@/lib/crm/customer-lifecycle"
import type { PortfolioCustomer } from "@/lib/crm/customer-health"
import {
  daysUntilRenewal,
  renewalStatusLabel,
  renewalUrgency,
} from "@/lib/crm/customer-renewal"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { formatCurrency } from "@/lib/data-access/modules/crm"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import {
  formatDocumentMask,
  formatPhoneBrMask,
  formatStoredPhone,
  stripDocumentDigits,
} from "@/lib/documents/document"

export function CustomerLifecycleBadge({
  stage,
}: {
  stage: string | null | undefined
}) {
  const normalized = normalizeCustomerLifecycleStage(stage)
  const tone = CUSTOMER_LIFECYCLE_TONES[normalized]
  const toneMap = {
    neutral: "neutral",
    info: "brand",
    success: "success",
    warning: "warn",
    danger: "danger",
  } as const

  return (
    <StatusPill tone={toneMap[tone]} variant="soft" size="xs">
      {customerLifecycleLabel(normalized)}
    </StatusPill>
  )
}

type CustomerOverviewSectionProps = {
  customer: PortfolioCustomer
}

export function CustomerOverviewSection({
  customer,
}: CustomerOverviewSectionProps) {
  const documentDigits = stripDocumentDigits(customer.document)
  const documentLabel =
    documentDigits.length === 11
      ? formatDocumentMask("cpf", customer.document)
      : documentDigits.length === 14
        ? formatDocumentMask("cnpj", customer.document)
        : customer.document

  const renewalDays = daysUntilRenewal(customer.renewalDate)
  const renewalHint = renewalUrgency(customer.renewalDate)

  return (
    <div className="flex flex-col gap-4">
      <MetricStrip>
        <MetricStrip.Item
          label="Health"
          value={`${customer.healthScore}%`}
          tone={
            customer.healthLevel === "risk"
              ? "danger"
              : customer.healthLevel === "attention"
                ? "warn"
                : "success"
          }
        />
        <MetricStrip.Item
          label="Negócios"
          value={customer.dealIds.length}
          tone="brand"
        />
        <MetricStrip.Item
          label="Apólices"
          value={customer.policyCount}
          tone="info"
        />
        <MetricStrip.Item
          label="Lifecycle"
          value={<CustomerLifecycleBadge stage={customer.lifecycleStage} />}
        />
      </MetricStrip>

      <SectionPanel tone="panel" bordered title="Identidade operacional">
        <PropertyGrid cols={2}>
          <PropertyCell
            icon={User}
            label="Segurado / titular"
            value={customer.name}
          />
          <PropertyCell
            icon={Building2}
            label="Empresa"
            value={customer.companyName ?? "—"}
          />
          <PropertyCell icon={Hash} label="Documento" value={documentLabel} />
          <PropertyCell
            icon={Mail}
            label="E-mail"
            value={customer.email ?? "—"}
          />
          <PropertyCell
            icon={Phone}
            label="Telefone"
            value={
              customer.phone
                ? formatPhoneBrMask(formatStoredPhone(customer.phone))
                : "—"
            }
          />
          <PropertyCell
            icon={CalendarClock}
            label="Última interação"
            value={formatLastInteraction(customer.lastInteractionAt)}
          />
        </PropertyGrid>
      </SectionPanel>

      <SectionPanel tone="panel" bordered title="Renovação (foundation)">
        <PropertyGrid cols={2}>
          <PropertyCell
            icon={CalendarClock}
            label="Data de renovação"
            value={
              customer.renewalDate
                ? formatLastInteraction(customer.renewalDate)
                : "Não definida"
            }
          />
          <PropertyCell
            icon={Shield}
            label="Status"
            value={renewalStatusLabel(customer.renewalStatus)}
          />
          <PropertyCell
            icon={FileText}
            label="Pipeline"
            value={customer.renewalPipeline ?? "default"}
          />
          <PropertyCell
            icon={AlertTriangle}
            label="Urgência"
            value={
              renewalHint === "overdue"
                ? "Vencida"
                : renewalHint === "soon"
                  ? `${renewalDays ?? 0} dia(s)`
                  : "Normal"
            }
          />
        </PropertyGrid>
      </SectionPanel>
    </div>
  )
}

export function CustomerPoliciesSection() {
  return (
    <PlaceholderSection
      title="Apólices"
      icon={Shield}
      badge="Foundation — emissão real não implementada"
      description="Área reservada para apólices emitidas, vigência, coberturas e documentos vinculados ao segurado."
    />
  )
}

export function CustomerFinancialSection() {
  return (
    <PlaceholderSection
      title="Financeiro"
      icon={FileText}
      badge="Foundation"
      description="Premiação, parcelas, boletos e comissões serão conectados nesta aba em fases futuras."
    />
  )
}

export function CustomerClaimsSection() {
  return (
    <PlaceholderSection
      title="Sinistros"
      icon={AlertTriangle}
      badge="Foundation"
      description="Registro e acompanhamento de sinistros do segurado — integração operacional pendente."
    />
  )
}

export function CustomerRenewalSection({ customer }: { customer: PortfolioCustomer }) {
  const renewalDays = daysUntilRenewal(customer.renewalDate)

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel tone="panel" bordered title="Renovação operacional">
        <PropertyGrid cols={2}>
          <PropertyCell
            icon={CalendarClock}
            label="Próxima renovação"
            value={
              customer.renewalDate
                ? formatLastInteraction(customer.renewalDate)
                : "Não agendada"
            }
          />
          <PropertyCell
            icon={Shield}
            label="Status"
            value={renewalStatusLabel(customer.renewalStatus)}
          />
          <PropertyCell
            icon={FileText}
            label="Pipeline"
            value={customer.renewalPipeline ?? "default"}
          />
          <PropertyCell
            icon={AlertTriangle}
            label="Dias restantes"
            value={renewalDays === null ? "—" : String(renewalDays)}
          />
        </PropertyGrid>
      </SectionPanel>
      <PlaceholderSection
        title="Automação de renovação"
        icon={CalendarClock}
        badge="Não implementado"
        description="Automações de renovação, lembretes e pipeline de retenção serão adicionados em fase posterior."
      />
    </div>
  )
}

type CustomerRelationshipsSectionProps = {
  customer: PortfolioCustomer
  deals: CrmDeal[]
}

export function CustomerRelationshipsSection({
  customer,
  deals,
}: CustomerRelationshipsSectionProps) {
  const linkedDeals = deals.filter((deal) => customer.dealIds.includes(deal.id))

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel tone="panel" bordered title="Negócios vinculados">
        {linkedDeals.length === 0 ? (
          <p className="crm-text-meta">Nenhum negócio vinculado à carteira.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {linkedDeals.map((deal) => (
              <li key={deal.id}>
                <Link
                  href={buildEntitySheetHref({
                    entityType: "deal",
                    entityId: deal.id,
                    returnTo: `/crm/clientes?customer=${customer.id}&sheet=v2`,
                  })}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 transition hover:bg-white/[0.03]"
                  style={{ borderColor: "var(--crm-stroke-faint)" }}
                >
                  <span className="text-sm font-medium">{deal.title}</span>
                  <span className="crm-text-meta tabular-nums">
                    {formatCurrency(deal.value)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>
    </div>
  )
}
