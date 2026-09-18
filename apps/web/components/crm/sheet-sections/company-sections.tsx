"use client"

import Link from "next/link"
import { Building2, Globe, TrendingUp, Users } from "lucide-react"

import {
  MetricStrip,
  RecordRow,
  SectionPanel,
} from "@/components/crm/primitives"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import type { OperationalCompany } from "@/lib/crm/relationship"
import { formatCurrency, stageLabelMap } from "@/lib/data-access/modules/crm"
import { buildEntitySheetHref } from "@/lib/crm/entity-sheet-navigation"

import { PropertyCell, PropertyGrid, STAGE_ACCENT } from "./deal-shared"

type CompanyOverviewSectionProps = {
  company: OperationalCompany
}

export function CompanyOverviewSection({ company }: CompanyOverviewSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <MetricStrip>
        <MetricStrip.Item
          label="Pipeline"
          value={formatCurrency(company.pipelineValue)}
          tone="brand"
        />
        <MetricStrip.Item
          label="Negócios"
          value={company.dealCount}
          tone="info"
        />
        <MetricStrip.Item
          label="Abertos"
          value={company.openDealCount}
          tone={company.openDealCount > 0 ? "warn" : "neutral"}
        />
        <MetricStrip.Item
          label="Contatos"
          value={company.contactCount}
          tone="neutral"
        />
      </MetricStrip>

      <SectionPanel title="Contexto empresarial" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={Building2}
            label="Empresa"
            value={company.name}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Globe}
            label="Domínio operacional"
            value={company.domain}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Users}
            label="Proprietário"
            value={company.owner}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={TrendingUp}
            label="Volume comercial"
            value={formatCurrency(company.totalValue)}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={TrendingUp}
            label="Última interação"
            value={formatLastInteraction(company.lastInteractionAt)}
            className="bg-[var(--crm-surface-panel)]"
          />
        </PropertyGrid>
      </SectionPanel>
    </div>
  )
}

type CompanyContactsSectionProps = {
  company: OperationalCompany
  returnTo: string
}

export function CompanyContactsSection({
  company,
  returnTo,
}: CompanyContactsSectionProps) {
  return (
    <SectionPanel
      title="Contatos vinculados"
      description={`${company.contactCount} contato(s) operacional(is) associados a ${company.name}.`}
      tone="panel"
      bordered
    >
      {company.contacts.length === 0 ? (
        <p className="crm-text-meta text-muted-foreground">
          Nenhum contato deduplicado vinculado — negócios podem existir sem lead
          convertido.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {company.contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/crm/contatos?contact=${encodeURIComponent(contact.id)}&sheet=v2&returnTo=${encodeURIComponent(returnTo)}`}
              className="block"
            >
              <RecordRow accent="sky">
                <RecordRow.Body>
                  <RecordRow.Title>{contact.name}</RecordRow.Title>
                  <RecordRow.Subtitle>
                    {contact.email ?? contact.phone ?? "Sem canal registrado"}
                  </RecordRow.Subtitle>
                </RecordRow.Body>
                <RecordRow.Trailing>
                  <span className="crm-text-micro">{contact.lifecycle}</span>
                </RecordRow.Trailing>
              </RecordRow>
            </Link>
          ))}
        </div>
      )}
    </SectionPanel>
  )
}

type CompanyDealsSectionProps = {
  company: OperationalCompany
  returnTo: string
}

export function CompanyDealsSection({
  company,
  returnTo,
}: CompanyDealsSectionProps) {
  return (
    <SectionPanel
      title="Negócios vinculados"
      description={`${company.openDealCount} oportunidade(s) aberta(s) de ${company.dealCount} no total.`}
      tone="panel"
      bordered
    >
      {company.deals.length === 0 ? (
        <p className="crm-text-meta text-muted-foreground">
          Nenhum negócio registrado para esta empresa.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {company.deals.map((deal) => (
            <Link
              key={deal.id}
              href={buildEntitySheetHref({
                entityType: "deal",
                entityId: deal.id,
                returnTo,
                origin: "list",
              })}
              className="block"
            >
              <RecordRow accent={STAGE_ACCENT[deal.stage]}>
                <RecordRow.Body>
                  <RecordRow.Title>{deal.title}</RecordRow.Title>
                  <RecordRow.Subtitle>{deal.company}</RecordRow.Subtitle>
                </RecordRow.Body>
                <RecordRow.Trailing>
                  <span className="crm-text-meta tabular-nums">
                    {formatCurrency(deal.value)}
                  </span>
                  <span className="crm-text-micro">{stageLabelMap[deal.stage]}</span>
                </RecordRow.Trailing>
              </RecordRow>
            </Link>
          ))}
        </div>
      )}
    </SectionPanel>
  )
}
