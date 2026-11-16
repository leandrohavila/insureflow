"use client"

import {
  BadgeCheck,
  Clock,
  PhoneOff,
  Send,
  UserPlus,
  XCircle,
} from "lucide-react"

import type { LeadCaptureMetrics } from "@/lib/leads/lead-capture-metrics"
import { cn } from "@/lib/utils"

type LeadCaptureMetricsGridProps = {
  metrics: LeadCaptureMetrics
  loading?: boolean
  unavailable?: boolean
}

const items = [
  {
    key: "novos",
    icon: UserPlus,
    label: "Leads novos",
    iconClass: "bg-[var(--avila-gold-600)]/15 text-[var(--avila-gold-600)]",
  },
  {
    key: "noContact",
    icon: PhoneOff,
    label: "Sem contato",
    iconClass: "bg-destructive/10 text-destructive",
  },
  {
    key: "emAtendimento",
    icon: Clock,
    label: "Em atendimento",
    iconClass: "bg-warning/15 text-warning-foreground",
  },
  {
    key: "cotacaoEnviada",
    icon: Send,
    label: "Cotação enviada",
    iconClass: "bg-info/12 text-info",
  },
  {
    key: "fechados",
    icon: BadgeCheck,
    label: "Fechados",
    iconClass: "bg-success/12 text-success",
  },
  {
    key: "perdidos",
    icon: XCircle,
    label: "Perdidos",
    iconClass: "bg-destructive/10 text-destructive",
  },
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
  unavailable = false,
}: LeadCaptureMetricsGridProps) {
  const showPlaceholder = loading || unavailable
  return (
    <div className="@container/leads-metrics w-full min-w-0 max-w-full">
    <div
      role="list"
      aria-busy={loading || undefined}
      aria-label="Indicadores operacionais de leads"
      className="grid w-full min-w-0 max-w-full grid-cols-2 gap-3 @min-[28rem]/leads-metrics:grid-cols-3 @min-[64rem]/leads-metrics:grid-cols-6"
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.key}
            role="listitem"
            className="flex min-h-[4.75rem] min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-3.5! py-3! shadow-[0_1px_2px_rgb(0_12_36/0.04)]"
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                item.iconClass,
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs text-muted-foreground">
                {item.label}
              </span>
              <span
                className={cn(
                  "truncate text-2xl font-semibold tabular-nums leading-none tracking-tight text-foreground",
                  showPlaceholder && "text-muted-foreground",
                )}
              >
                {showPlaceholder ? "—" : metricValue(item.key, metrics)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
    {unavailable && !loading ? (
      <p role="status" className="mt-2! text-xs font-medium text-destructive">
        Não foi possível carregar os indicadores de leads.
      </p>
    ) : null}
    </div>
  )
}
