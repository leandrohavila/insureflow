"use client"

import { cn } from "@/lib/utils"

import { dashboardInteractiveItemClassName } from "./dashboard-utils"

export type PriorityLevel = "high" | "medium" | "low"

const priorityMeta: Record<
  PriorityLevel,
  { emoji: string; label: string; badgeClass: string }
> = {
  high: {
    emoji: "🔴",
    label: "Alta",
    badgeClass: "bg-destructive/15 text-destructive",
  },
  medium: {
    emoji: "🟠",
    label: "Média",
    badgeClass: "bg-warning/15 text-warning",
  },
  low: {
    emoji: "🟢",
    label: "Baixa",
    badgeClass: "bg-success/15 text-success",
  },
}

export type DashboardPriorityItemProps = {
  id: string
  level: PriorityLevel
  count: number
  description: string
  disabled?: boolean
  placeholder?: boolean
}

export function DashboardPriorityItem({
  level,
  count,
  description,
  disabled = true,
  placeholder = false,
}: DashboardPriorityItemProps) {
  const meta = priorityMeta[level]

  return (
    <li className="border-b border-border/30 last:border-b-0">
      <button
        type="button"
        disabled={disabled}
        aria-label={`${meta.label}: ${description}`}
        className={cn(
          dashboardInteractiveItemClassName,
          "grid w-full min-w-0 grid-cols-[1.25rem_2rem_1fr_auto] items-center gap-2 px-0.5 py-1.5 text-left",
          disabled && "cursor-default",
        )}
      >
        <span aria-hidden className="text-[0.625rem] leading-none">
          {meta.emoji}
        </span>
        <span
          className={cn(
            "text-base font-semibold tabular-nums leading-none",
            placeholder ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {placeholder ? "—" : count}
        </span>
        <span
          className={cn(
            "min-w-0 truncate text-sm leading-snug",
            placeholder ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {description}
        </span>
        <span
          className={cn(
            "shrink-0 rounded px-1 py-0.5 text-[0.5625rem] font-medium uppercase tracking-wide",
            meta.badgeClass,
          )}
        >
          {meta.label}
        </span>
      </button>
    </li>
  )
}
