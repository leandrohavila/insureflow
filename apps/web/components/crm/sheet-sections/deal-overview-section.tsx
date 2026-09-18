"use client"

import { Building2, Hash, Mail, Package, Phone, Tag, User } from "lucide-react"

import { SectionPanel } from "@/components/crm/primitives"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  formatPhoneBrMask,
  formatStoredPhone,
} from "@/lib/documents/document"
import type { CrmDeal } from "@/lib/data-access/modules/crm"

import { PropertyCell, PropertyGrid } from "./deal-shared"

type DealOverviewSectionProps = {
  deal: CrmDeal
}

/**
 * Visão geral do negócio — propriedades operacionais em grid scannable.
 *
 * Não inclui métricas hero (estágio/valor/última interação) — essas vivem no
 * header sticky do `EntitySheetShell` para máxima visibilidade durante todo
 * o scroll do workspace.
 */
export function DealOverviewSection({ deal }: DealOverviewSectionProps) {
  const phoneRaw = deal.commercialContext?.phone ?? null
  const phone = phoneRaw ? formatPhoneBrMask(formatStoredPhone(phoneRaw)) : null

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel title="Propriedades do negócio" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={Building2}
            label="Empresa"
            value={deal.company || "—"}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={User}
            label="Contato"
            value={deal.contact || "—"}
            className="bg-[var(--crm-surface-panel)]"
          />
          {deal.email ? (
            <PropertyCell
              icon={Mail}
              label="E-mail"
              value={deal.email}
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
          <PropertyCell
            icon={Package}
            label="Produto"
            value={deal.product || "—"}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={User}
            label="Proprietário"
            value={
              <span className="flex items-center gap-1.5">
                <Avatar className="size-5">
                  <AvatarFallback className="bg-primary/20 text-[8px] text-primary">
                    {deal.ownerInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{deal.owner || "Sem proprietário"}</span>
              </span>
            }
            className="bg-[var(--crm-surface-panel)]"
          />
        </PropertyGrid>
      </SectionPanel>

      {deal.tags.length > 0 ? (
        <SectionPanel title="Tags" tone="default">
          <div className="flex flex-wrap items-center gap-1.5 px-1.5 pb-1 pt-0.5">
            {deal.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-foreground/75"
                style={{
                  backgroundColor:
                    "color-mix(in oklch, var(--foreground) 5%, transparent)",
                }}
              >
                <Hash className="size-3 opacity-60" strokeWidth={1.75} />
                {tag}
              </span>
            ))}
          </div>
        </SectionPanel>
      ) : null}

      <SectionPanel title="Identificação" tone="default" density="compact">
        <PropertyGrid>
          <PropertyCell
            icon={Tag}
            label="ID do negócio"
            value={
              <code className="font-mono text-[11px] text-foreground/70">
                {deal.id}
              </code>
            }
            className="bg-[var(--crm-surface-panel)]"
            span={2}
          />
        </PropertyGrid>
      </SectionPanel>
    </div>
  )
}
