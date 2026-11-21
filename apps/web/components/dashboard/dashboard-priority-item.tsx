"use client"

import { cn } from "@/lib/utils"

import { dashboardInteractiveItemClassName } from "./dashboard-utils"

export type PriorityLevel = "high" | "medium" | "low"

const priorityMeta: Record<
  PriorityLevel,
  { label: string; badgeClass: string; dotClass: string }
> = {
  high: {
    label: "Alta",
    badgeClass: "bg-destructive/12 text-destructive",
    dotClass: "bg-destructive",
  },
  medium: {
    label: "Média",
    badgeClass: "bg-warning/18 text-warning-foreground",
    dotClass: "bg-warning",
  },
  low: {
    label: "Baixa",
    badgeClass: "bg-success/12 text-success",
    dotClass: "bg-success",
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
        <span
          aria-hidden
          className={cn("size-2 justify-self-center rounded-full", meta.dotClass)}
        />
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
