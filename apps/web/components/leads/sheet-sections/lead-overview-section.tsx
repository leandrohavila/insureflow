"use client"

import {
  Building2,
  Compass,
  FileText,
  Mail,
  Phone,
  User,
  UserCog,
} from "lucide-react"

import { SectionPanel } from "@/components/crm/primitives"
import {
  PropertyCell,
  PropertyGrid,
} from "@/components/crm/sheet-sections/sheet-shared"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  formatCnpjMask,
  formatCpfMask,
  formatPhoneBrMask,
  formatStoredPhone,
} from "@/lib/documents/document"
import type { Lead } from "@/lib/data-access/modules/leads"

type LeadOverviewSectionProps = {
  lead: Lead
}

/**
 * Visão geral do lead — identidade + canais de contato em grid scannable.
 *
 * NÃO inclui métricas hero (status / última interação) — essas vivem no
 * header sticky do `EntitySheetShell` para máxima visibilidade durante todo
 * o scroll. Aqui é a fotografia "quem é esse lead, como falo com ele".
 */
export function LeadOverviewSection({ lead }: LeadOverviewSectionProps) {
  const phoneRaw = lead.phone ?? null
  const phone = phoneRaw ? formatPhoneBrMask(formatStoredPhone(phoneRaw)) : null

  const documentLabel = lead.documentType
    ? lead.documentType === "cpf"
      ? "CPF"
      : "CNPJ"
    : "Documento"
  const documentValue = lead.document
    ? lead.documentType === "cpf"
      ? formatCpfMask(lead.document)
      : formatCnpjMask(lead.document)
    : null

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
    <div className="flex flex-col gap-4">
      <SectionPanel title="Identidade" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={User}
            label="Nome"
            value={lead.name}
            className="bg-[var(--crm-surface-panel)]"
            span={2}
          />
          <PropertyCell
            icon={Building2}
            label="Empresa"
            value={lead.company || "—"}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Compass}
            label="Origem"
            value={lead.source || "Não informada"}
            className="bg-[var(--crm-surface-panel)]"
          />
        </PropertyGrid>
      </SectionPanel>

      <SectionPanel title="Canais de contato" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={Mail}
            label="E-mail"
            value={lead.email || "—"}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Phone}
            label="Telefone"
            value={phone || "—"}
            className="bg-[var(--crm-surface-panel)]"
          />
          {documentValue ? (
            <PropertyCell
              icon={FileText}
              label={documentLabel}
              value={
                <code className="font-mono text-[11px] tabular-nums text-foreground/80">
                  {documentValue}
                </code>
              }
              className="bg-[var(--crm-surface-panel)]"
              span={2}
            />
          ) : null}
        </PropertyGrid>
      </SectionPanel>

      <SectionPanel title="Responsável" tone="default" density="compact">
        <PropertyGrid>
          <PropertyCell
            icon={UserCog}
            label="Quem está cuidando"
            value={
              <span className="flex items-center gap-1.5">
                <Avatar className="size-5">
                  <AvatarFallback className="bg-primary/20 text-[8px] text-primary">
                    {ownerInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {ownerName || "Sem responsável"}
                </span>
              </span>
            }
            className="bg-[var(--crm-surface-panel)]"
            span={2}
          />
        </PropertyGrid>
      </SectionPanel>
    </div>
  )
}
