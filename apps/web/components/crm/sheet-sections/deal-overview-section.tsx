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
function missing(value: string | null | undefined) {
  const text = value?.trim()
  return text || "Não informado"
}

export function DealOverviewSection({ deal }: DealOverviewSectionProps) {
  const phoneRaw = deal.commercialContext?.phone ?? null
  const phone = phoneRaw ? formatPhoneBrMask(formatStoredPhone(phoneRaw)) : null
  const cell = "bg-white"

  return (
    <div className="flex flex-col gap-5">
      <SectionPanel title="Propriedades do negócio" tone="panel" bordered>
        <PropertyGrid>
          <PropertyCell icon={Building2} label="Empresa" value={missing(deal.company)} wrap className={cell} />
          <PropertyCell icon={User} label="Contato" value={missing(deal.contact)} wrap className={cell} />
          <PropertyCell icon={Mail} label="E-mail" value={missing(deal.email)} wrap className={cell} />
          <PropertyCell icon={Phone} label="Telefone" value={missing(phone)} wrap className={cell} />
          <PropertyCell icon={Package} label="Produto" value={missing(deal.product)} wrap className={cell} />
          <PropertyCell
            icon={User}
            label="Proprietário"
            value={
              <span className="flex items-center gap-2">
                <Avatar className="size-5">
                  <AvatarFallback className="bg-[var(--avila-navy-900)] text-[8px] text-[var(--avila-ivory)]">
                    {deal.ownerInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="break-words">{deal.owner?.trim() || "Não informado"}</span>
              </span>
            }
            wrap
            className={cell}
          />
          <PropertyCell
            icon={Tag}
            label="Origem do lead"
            value={missing(deal.convertedLead?.name)}
            wrap
            className={cell}
          />
          <PropertyCell
            icon={Hash}
            label="ID do negócio"
            value={<code className="font-mono text-[11px] break-all">{deal.id}</code>}
            wrap
            className={cell}
          />
        </PropertyGrid>
      </SectionPanel>

      <SectionPanel title="Tags" tone="panel" bordered>
        {deal.tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 px-1.5 pb-1">
            {deal.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-[#e4ddd2] bg-[#f6f1e8] px-2.5 text-xs font-medium text-[var(--avila-navy-900)]"
              >
                <Hash className="size-3 opacity-60" strokeWidth={1.75} />
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="px-1.5 pb-1 text-sm text-[#5c6578]">Nenhuma tag informada.</p>
        )}
      </SectionPanel>
    </div>
  )
}
