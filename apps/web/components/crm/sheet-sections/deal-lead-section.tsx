"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  Calendar,
  Mail,
  Phone,
  User,
  UserMinus,
  UserPlus,
} from "lucide-react"

import { SectionPanel, StatusPill } from "@/components/crm/primitives"
import { buttonVariants } from "@/components/ui/button"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import { cn } from "@/lib/utils"

import { PropertyCell, PropertyGrid } from "./deal-shared"

type DealLeadSectionProps = {
  deal: CrmDeal
}

/**
 * Lead de origem deste negócio. Em corretora enterprise, ter rastreabilidade
 * de qual lead virou qual deal é operacional (vendedor abre o histórico do
 * lead direto daqui — não precisa navegar para `/leads?lead=ID` manualmente).
 *
 * Quando o negócio não tem lead vinculado (criação direta no CRM), exibimos
 * um empty state semântico — sem CTA enganoso de "converter" (já é um deal).
 */
export function DealLeadSection({ deal }: DealLeadSectionProps) {
  const lead = deal.convertedLead ?? null

  if (!lead) {
    return (
      <SectionPanel title="Lead de origem" tone="default">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center"
          style={{ borderColor: "var(--crm-stroke-faint)" }}
        >
          <UserMinus
            className="size-7 text-foreground/35"
            strokeWidth={1.5}
          />
          <p className="crm-text-meta max-w-xs">
            Este negócio foi criado diretamente no CRM, sem lead vinculado.
          </p>
        </div>
      </SectionPanel>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionPanel
        title="Lead de origem"
        tone="default"
        action={
          <Link
            href={`/leads?lead=${lead.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            Abrir lead
            <ArrowUpRight className="size-3.5" />
          </Link>
        }
      >
        <PropertyGrid>
          <PropertyCell
            icon={UserPlus}
            label="Nome"
            value={lead.name}
            className="bg-[var(--crm-surface-panel)]"
            span={2}
          />
          {lead.status ? (
            <PropertyCell
              label="Status do lead"
              value={
                <StatusPill tone="info" variant="soft" size="sm">
                  {lead.status}
                </StatusPill>
              }
              className="bg-[var(--crm-surface-panel)]"
            />
          ) : null}
          {lead.assignedTo ? (
            <PropertyCell
              icon={User}
              label="Responsável"
              value={lead.assignedTo}
              className="bg-[var(--crm-surface-panel)]"
            />
          ) : null}
          {lead.email ? (
            <PropertyCell
              icon={Mail}
              label="E-mail"
              value={lead.email}
              className="bg-[var(--crm-surface-panel)]"
            />
          ) : null}
          {lead.phone ? (
            <PropertyCell
              icon={Phone}
              label="Telefone"
              value={lead.phone}
              className="bg-[var(--crm-surface-panel)]"
            />
          ) : null}
          <PropertyCell
            icon={Calendar}
            label="Último contato"
            value={formatLastInteraction(lead.lastContactAt)}
            className="bg-[var(--crm-surface-panel)]"
            span={2}
          />
        </PropertyGrid>
      </SectionPanel>
    </div>
  )
}
