"use client"

import { useMemo } from "react"

import { TimelineEmptyState } from "@/components/activities/timeline-empty-state"
import { CrmSectionLoading } from "@/components/crm/interaction"
import { SectionPanel } from "@/components/crm/primitives"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import {
  buildOperationalTimeline,
  type OperationalTimelineItem,
} from "@/lib/crm/operational-timeline"
import { useActivityTimeline } from "@/lib/data-access/modules/activities"
import type { CrmDeal } from "@/lib/data-access/modules/crm"
import type { Customer } from "@/lib/data-access/modules/customers"
import { cn } from "@/lib/utils"

type OperationalTimelineLaneProps = {
  customer: Customer | null
  deals?: CrmDeal[]
  className?: string
  title?: string
  density?: "default" | "compact"
}

function OperationalTimelineEntry({ item }: { item: OperationalTimelineItem }) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{ borderColor: "var(--crm-stroke-faint)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{item.subject}</p>
          {item.description ? (
            <p className="crm-text-meta mt-1">{item.description}</p>
          ) : null}
        </div>
        <span className="crm-text-meta shrink-0 tabular-nums">
          {formatLastInteraction(item.occurredAt)}
        </span>
      </div>
    </div>
  )
}

export function OperationalTimelineLane({
  customer,
  deals = [],
  className,
  title = "Timeline operacional",
  density = "default",
}: OperationalTimelineLaneProps) {
  const activitiesQuery = useActivityTimeline({
    customerId: customer?.id ?? null,
  })

  const items = useMemo(
    () =>
      buildOperationalTimeline({
        customer,
        deals,
        activities: activitiesQuery.data?.data ?? [],
      }),
    [activitiesQuery.data?.data, customer, deals],
  )

  const isLoading = activitiesQuery.isLoading
  const isEmpty = !isLoading && items.length === 0

  return (
    <SectionPanel
      tone="panel"
      density={density}
      bordered
      dividedHeader
      className={cn("timeline-lane-v2", className)}
      title={
        <span className="flex items-center gap-2">
          {title}
          {!isLoading ? (
            <span className="crm-text-meta tabular-nums">
              · {items.length} {items.length === 1 ? "evento" : "eventos"}
            </span>
          ) : null}
        </span>
      }
      description={
        !isLoading && items[0]?.occurredAt ? (
          <span className="crm-text-meta">
            Último evento: {formatLastInteraction(items[0].occurredAt)}
          </span>
        ) : undefined
      }
    >
      {isLoading ? (
        <CrmSectionLoading
          isLoading
          label="Carregando timeline operacional…"
          variant="inline"
        />
      ) : null}
      {isEmpty ? <TimelineEmptyState /> : null}
      {!isLoading && items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <OperationalTimelineEntry key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </SectionPanel>
  )
}
