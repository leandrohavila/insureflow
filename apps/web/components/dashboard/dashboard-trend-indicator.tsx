"use client"

import { cn } from "@/lib/utils"

export type TrendDirection = "up" | "down" | "neutral"

export type DashboardTrendIndicatorProps = {
  direction: TrendDirection
  label: string
  className?: string
}

const directionSymbol: Record<TrendDirection, string> = {
  up: "▲",
  down: "▼",
  neutral: "—",
}

const directionTone: Record<TrendDirection, string> = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
}

export function DashboardTrendIndicator({
  direction,
  label,
  className,
}: DashboardTrendIndicatorProps) {
  return (
    <p
      className={cn(
        "text-xs tabular-nums transition-opacity duration-[var(--if-duration-base)]",
        directionTone[direction],
        className,
      )}
    >
      <span aria-hidden className="mr-0.5">
        {directionSymbol[direction]}
      </span>
      {label}
    </p>
  )
}
