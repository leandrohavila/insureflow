"use client"

import {
  BadgeCheck,
  PhoneOff,
  Send,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react"

import type { LeadCaptureMetrics } from "@/lib/leads/lead-capture-metrics"
import { cn } from "@/lib/utils"

type LeadCaptureMetricsGridProps = {
  metrics: LeadCaptureMetrics
  loading?: boolean
}

const items = [
  { key: "novos", icon: UserPlus, label: "Leads Novos" },
  { key: "noContact", icon: PhoneOff, label: "Sem Contato" },
  { key: "emAtendimento", icon: Users, label: "Em Atendimento" },
  { key: "cotacaoEnviada", icon: Send, label: "Cotação Enviada" },
  { key: "fechados", icon: BadgeCheck, label: "Fechados" },
  { key: "perdidos", icon: XCircle, label: "Perdidos" },
] as const

function metricValue(
  key: (typeof items)[number]["key"],
  metrics: LeadCaptureMetrics,
): string {
  switch (key) {
    case "novos":
      return String(metrics.novos)
    case "noContact":
      return String(metrics.noContact)
    case "emAtendimento":
      return String(metrics.emAtendimento)
    case "cotacaoEnviada":
      return String(metrics.cotacaoEnviada)
    case "fechados":
      return String(metrics.fechados)
    case "perdidos":
      return String(metrics.perdidos)
  }
}

export function LeadCaptureMetricsGrid({
  metrics,
  loading = false,
}: LeadCaptureMetricsGridProps) {
  return (
    <div
      role="list"
      aria-busy={loading || undefined}
      aria-label="Indicadores operacionais de leads"
      className="grid h-9 min-w-0 grid-cols-6 overflow-hidden rounded-md border border-white/[0.08] bg-card/40 divide-x divide-white/[0.06]"
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.key}
            role="listitem"
            className="flex min-w-0 items-center gap-1 px-1.5 sm:gap-1.5 sm:px-2"
          >
            <Icon
              className="size-3 shrink-0 text-muted-foreground/70 sm:size-3.5"
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                {item.label}
              </span>
              <span
                className={cn(
                  "truncate text-[12px] font-semibold tabular-nums sm:text-[13px]",
                  loading ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {loading ? "—" : metricValue(item.key, metrics)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
