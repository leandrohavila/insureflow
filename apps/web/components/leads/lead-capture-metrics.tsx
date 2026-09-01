"use client"

import {
  ArrowRightLeft,
  CalendarDays,
  Filter,
  PhoneOff,
  Users,
} from "lucide-react"

import {
  formatLeadConversionRate,
  type LeadCaptureMetrics,
} from "@/lib/leads/lead-capture-metrics"
import { cn } from "@/lib/utils"

type LeadCaptureMetricsGridProps = {
  metrics: LeadCaptureMetrics
  loading?: boolean
}

const items = [
  {
    key: "total",
    icon: Users,
    label: "Leads",
  },
  {
    key: "noContact",
    icon: PhoneOff,
    label: "Sem contato",
  },
  {
    key: "followUps",
    icon: CalendarDays,
    label: "Follow-ups",
  },
  {
    key: "conversion",
    icon: ArrowRightLeft,
    label: "Conversão",
  },
  {
    key: "pipeline",
    icon: Filter,
    label: "Pipeline",
  },
] as const

function metricValue(
  key: (typeof items)[number]["key"],
  metrics: LeadCaptureMetrics,
): string {
  switch (key) {
    case "total":
      return String(metrics.total)
    case "noContact":
      return String(metrics.noContact)
    case "followUps":
      return String(metrics.followUps)
    case "conversion":
      return formatLeadConversionRate(metrics.conversionRate)
    case "pipeline":
      return String(metrics.pipeline)
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
      aria-label="Indicadores de captação"
      className="flex h-9 min-w-0 items-stretch overflow-x-auto rounded-md border border-white/[0.08] bg-card/40 divide-x divide-white/[0.06]"
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.key}
            role="listitem"
            className="flex min-w-[5.5rem] flex-1 items-center gap-1.5 px-2 sm:min-w-0 sm:px-3"
          >
            <Icon
              className="size-3.5 shrink-0 text-muted-foreground/70"
              strokeWidth={1.5}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </span>
              <span
                className={cn(
                  "truncate text-[13px] font-semibold tabular-nums",
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
