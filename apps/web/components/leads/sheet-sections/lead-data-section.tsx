"use client"

import { Calendar, Clock, Database, Hash, StickyNote, Tag } from "lucide-react"

import { SectionPanel, StatusPill } from "@/components/crm/primitives"
import {
  PropertyCell,
  PropertyGrid,
} from "@/components/crm/sheet-sections/sheet-shared"
import type { Lead } from "@/lib/data-access/modules/leads"

import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "../lead-shared"

type LeadDataSectionProps = {
  lead: Lead
}

function formatBrDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

/**
 * Dados brutos do lead — campos técnicos para auditoria e debug operacional.
 *
 * Equivalente da seção "Identificação" do `DealOverviewSection`: aqui ficam
 * os IDs, timestamps, status técnico e notas longas. Existe para tirar
 * poluição das seções narrativas (Overview / Comercial / Origem) sem
 * esconder a verdade do dado.
 */
export function LeadDataSection({ lead }: LeadDataSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionPanel title="Estado técnico" tone="default">
        <PropertyGrid>
          <PropertyCell
            icon={Tag}
            label="Status atual"
            value={
              <StatusPill
                tone={LEAD_STATUS_TONE[lead.status]}
                variant="soft"
                size="sm"
                dot
              >
                {LEAD_STATUS_LABEL[lead.status]}
              </StatusPill>
            }
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Database}
            label="Negócio vinculado"
            value={
              lead.dealId ? (
                <code className="font-mono text-[11px] text-foreground/70">
                  {lead.dealId}
                </code>
              ) : (
                <span className="text-foreground/45">—</span>
              )
            }
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Calendar}
            label="Criado em"
            value={formatBrDateTime(lead.createdAt)}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Clock}
            label="Atualizado em"
            value={formatBrDateTime(lead.updatedAt)}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Calendar}
            label="Último contato registrado"
            value={formatBrDateTime(lead.lastContactAt)}
            className="bg-[var(--crm-surface-panel)]"
          />
          <PropertyCell
            icon={Clock}
            label="Última interação registrada"
            value={formatBrDateTime(lead.lastInteractionAt)}
            className="bg-[var(--crm-surface-panel)]"
          />
        </PropertyGrid>
      </SectionPanel>

      <SectionPanel title="Identificadores" tone="default" density="compact">
        <PropertyGrid>
          <PropertyCell
            icon={Hash}
            label="ID do lead"
            value={
              <code className="font-mono text-[11px] text-foreground/70">
                {lead.id}
              </code>
            }
            className="bg-[var(--crm-surface-panel)]"
            span={2}
          />
        </PropertyGrid>
      </SectionPanel>

      {lead.notes?.trim() ? (
        <SectionPanel title="Notas completas" tone="default" density="compact">
          <div className="flex items-start gap-2 px-3.5 py-2.5">
            <StickyNote
              className="size-3.5 shrink-0 text-foreground/45"
              strokeWidth={1.5}
            />
            <p className="crm-text-meta whitespace-pre-wrap text-foreground/85">
              {lead.notes}
            </p>
          </div>
        </SectionPanel>
      ) : null}
    </div>
  )
}
