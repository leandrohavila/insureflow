"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type DashboardCompactMetricProps = {
  label: string
  value: string | number
  loading?: boolean
  placeholder?: boolean
  tone?: "default" | "success" | "danger"
  className?: string
}

const toneClass = {
  default: "text-foreground",
  success: "text-success",
  danger: "text-destructive",
} as const

export function DashboardCompactMetric({
  label,
  value,
  loading = false,
  placeholder = false,
  tone = "default",
  className,
}: DashboardCompactMetricProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-baseline justify-between gap-[var(--if-space-2)] py-0.5",
        className,
      )}
    >
      <p className="min-w-0 truncate text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          placeholder || loading ? "text-muted-foreground" : toneClass[tone],
        )}
      >
        {loading ? "—" : value}
      </p>
    </div>
  )
}

export function DashboardCompactMetricGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-y-0.5 sm:grid-cols-2 sm:gap-x-[var(--if-space-3)]",
        className,
      )}
    >
      {children}
    </div>
  )
}
