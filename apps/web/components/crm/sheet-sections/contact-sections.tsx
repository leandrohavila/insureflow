"use client"

import Link from "next/link"
import {
  AlertTriangle,
  Building2,
  Hash,
  Mail,
  MessageCircle,
  Phone,
  User,
} from "lucide-react"

import {
  MetricStrip,
  SectionPanel,
  StatusPill,
} from "@/components/crm/primitives"
import { LifecycleBadge } from "@/components/crm/crm-record-table"
import {
  formatDocumentMask,
  formatPhoneBrMask,
  formatStoredPhone,
} from "@/lib/documents/document"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import type { OperationalContact } from "@/lib/crm/relationship"
import { buildEntitySheetHref } from "@/lib/crm/entity-sheet-navigation"

import { PropertyCell, PropertyGrid } from "./deal-shared"

type ContactOverviewSectionProps = {
  contact: OperationalContact
}

export function ContactOverviewSection({ contact }: ContactOverviewSectionProps) {
  const phone = contact.phone
    ? formatPhoneBrMask(formatStoredPhone(contact.phone))
    : null
  const whatsapp = contact.whatsapp
    ? formatPhoneBrMask(formatStoredPhone(contact.whatsapp))
    : null
  const documentLabel =
    contact.document && contact.documentType
      ? formatDocumentMask(contact.documentType, contact.document)
      : contact.document

  return (
    <div className="flex flex-col gap-4">
      <MetricStrip>
        <MetricStrip.Item
          label="Negócios"
          value={contact.dealCount}
          tone="brand"
        />
        <MetricStrip.Item label="Leads" value={contact.leadCount} tone="info" />
        <MetricStrip.Item
          label="Abertos"
          value={contact.openDealCount}
          tone={contact.openDealCount > 0 ? "warn" : "neutral"}
        />
        <MetricStrip.Item
          label="Lifecycle"
          value={<LifecycleBadge label={contact.lifecycle} />}
        />
      </MetricStrip>

      {contact.identityWarnings.length > 0 ? (
        <SectionPanel tone="panel" bordered title="Inteligência de identidade">
          <ul className="flex flex-col gap-2">
            {contact.identityWarnings.map((warning) => (
              <li
                key={warning}
                className="crm-text-meta flex items-start gap-2 text-amber-200/90"
              >
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {warning}
              </li>
            ))}
          </ul>
        </SectionPanel>
      ) : null}

      <SectionPanel title="Identidade operacional" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={User}
            label="Nome"
            value={contact.name}
            className="bg-[var(--crm-surface-panel)]"
          />
          {contact.email ? (
            <PropertyCell
              icon={Mail}
              label="E-mail"
              value={contact.email}
              className="bg-[var(--crm-surface-panel)]"
            />
          ) : null}
          {phone ? (
            <PropertyCell
              icon={Phone}
              label="Telefone"
              value={phone}
              className="bg-[var(--crm-surface-panel)]"
            />
          ) : null}
          {whatsapp ? (
            <PropertyCell
              icon={MessageCircle}
              label="WhatsApp"
              value={whatsapp}
              className="bg-[var(--crm-surface-panel)]"
            />
          ) : null}
          {documentLabel ? (
            <PropertyCell
              icon={Hash}
              label="Documento"
              value={documentLabel}
              className="bg-[var(--crm-surface-panel)]"
            />
          ) : null}
          <PropertyCell
            icon={Building2}
            label="Empresa principal"
            value={contact.companies[0] ?? "—"}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={User}
            label="Proprietário"
            value={contact.owner}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Phone}
            label="Última interação"
            value={formatLastInteraction(contact.lastInteractionAt)}
            className="bg-[var(--crm-surface-panel)]"
          />
        </PropertyGrid>
      </SectionPanel>

      {contact.companies.length > 1 ? (
        <SectionPanel title="Empresas vinculadas" tone="panel" bordered>
          <div className="flex flex-wrap gap-1.5">
            {contact.companies.map((company) => (
              <StatusPill key={company} tone="neutral" variant="outline" size="xs">
                {company}
              </StatusPill>
            ))}
          </div>
        </SectionPanel>
      ) : null}
    </div>
  )
}

type ContactRelationshipsSectionProps = {
  contact: OperationalContact
  returnTo: string
  dealLabels?: Record<string, string>
  leadLabels?: Record<string, string>
}

export function ContactRelationshipsSection({
  contact,
  returnTo,
  dealLabels = {},
  leadLabels = {},
}: ContactRelationshipsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionPanel
        title="Relacionamentos comerciais"
        description="Superfície operacional — links para negócios, leads e empresas sem duplicar domínio."
        tone="panel"
        bordered
      >
        <div className="flex flex-col gap-4">
          {contact.dealIds.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="crm-text-micro text-muted-foreground">Negócios</p>
              <div className="flex flex-col gap-1">
                {contact.dealIds.map((dealId) => (
                  <Link
                    key={dealId}
                    href={buildEntitySheetHref({
                      entityType: "deal",
                      entityId: dealId,
                      returnTo,
                      origin: "list",
                    })}
                    className="crm-surface-raised rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/[0.06]"
                  >
                    Abrir negócio · {dealLabels[dealId] ?? dealId.slice(0, 8)}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {contact.leadIds.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="crm-text-micro text-muted-foreground">Leads</p>
              <div className="flex flex-col gap-1">
                {contact.leadIds.map((leadId) => (
                  <Link
                    key={leadId}
                    href={buildEntitySheetHref({
                      entityType: "lead",
                      entityId: leadId,
                      returnTo,
                      origin: "list",
                    })}
                    className="crm-surface-raised rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/[0.06]"
                  >
                    Abrir lead · {leadLabels[leadId] ?? leadId.slice(0, 8)}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {contact.customerIds.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="crm-text-micro text-muted-foreground">Clientes</p>
              <div className="flex flex-col gap-1">
                {contact.customerIds.map((customerId) => (
                  <Link
                    key={customerId}
                    href={buildEntitySheetHref({
                      entityType: "customer",
                      entityId: customerId,
                      returnTo,
                    })}
                    className="crm-surface-raised rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/[0.06]"
                  >
                    Abrir cliente · {customerId.slice(0, 8)}…
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {contact.dealIds.length === 0 &&
          contact.leadIds.length === 0 &&
          contact.customerIds.length === 0 ? (
            <p className="crm-text-meta text-muted-foreground">
              Nenhum relacionamento comercial registrado para esta identidade.
            </p>
          ) : null}
        </div>
      </SectionPanel>
    </div>
  )
}
