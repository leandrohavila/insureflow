"use client"

import { StatusPill } from "@/components/crm/primitives"
import type { CommercialScore } from "@/lib/crm/commercial-journey"
import { cn } from "@/lib/utils"

const TIER_TONE: Record<
  CommercialScore["tier"],
  "success" | "info" | "warn" | "danger"
> = {
  excellent: "success",
  good: "info",
  regular: "warn",
  low: "danger",
}

export type CommercialScoreCardProps = {
  score: CommercialScore
  loading?: boolean
  className?: string
}

export function CommercialScoreCard({
  score,
  loading = false,
  className,
}: CommercialScoreCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border/60 p-3", className)}>
        <p className="crm-text-meta text-foreground/55">Calculando score…</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-[var(--crm-surface-panel)] p-3!",
        className,
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="crm-text-meta text-foreground/60">Commercial Score</p>
          <p className="crm-text-metric text-[1.75rem] leading-none font-semibold tracking-[-0.03em]">
            {score.value}
          </p>
        </div>
        <StatusPill tone={TIER_TONE[score.tier]} variant="soft" size="sm">
          {score.tierLabel}
        </StatusPill>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--crm-stroke-faint)]"
        role="progressbar"
        aria-valuenow={score.value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Commercial Score"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${score.value}%` }}
        />
      </div>

      <ul className="mt-3! flex flex-col gap-1.5">
        {score.criteria.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 text-xs text-[#5c6578]"
          >
            <span className="min-w-0 break-words">{item.label}</span>
            <span className="shrink-0 tabular-nums text-[var(--avila-navy-900)]">
              {item.met ? item.earned : 0}/{item.weight}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
