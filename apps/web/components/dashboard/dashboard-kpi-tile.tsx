"use client"

import type { ReactNode } from "react"

import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type DashboardKpiTileProps = {
  label: string
  value: string | number
  loading?: boolean
  placeholder?: boolean
  tone?: "default" | "success" | "danger" | "primary"
  className?: string
}

const toneClass = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  danger: "text-destructive",
} as const

export function DashboardKpiTile({
  label,
  value,
  loading = false,
  placeholder = false,
  tone = "default",
  className,
}: DashboardKpiTileProps) {
  return (
    <div
      className={cn(
        "dashboard-tile min-w-0 rounded-lg border border-[#e4ddd2] bg-[var(--avila-ivory)]",
        className,
      )}
    >
      <p
        className={cn(
          "text-lg font-semibold leading-none tracking-tight tabular-nums",
          placeholder || loading ? "text-muted-foreground" : toneClass[tone],
        )}
      >
        {loading ? "—" : value}
      </p>
      <p className="dashboard-tile-label mt-0.5 truncate text-[0.6875rem] font-medium leading-snug text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

export function DashboardKpiTileGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "dashboard-tile-grid grid grid-cols-2 sm:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  )
}

export type DashboardIconMetricProps = {
  icon: LucideIcon
  label: string
  value: string | number
  loading?: boolean
  placeholder?: boolean
  className?: string
}

export function DashboardIconMetric({
  icon: Icon,
  label,
  value,
  loading = false,
  placeholder = false,
  className,
}: DashboardIconMetricProps) {
  return (
    <div
      className={cn(
        "dashboard-tile flex h-full min-w-0 items-center gap-[var(--if-space-2)] rounded-lg border border-[#e4ddd2] bg-[var(--avila-ivory)]",
        className,
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-[#e4ddd2] bg-[var(--avila-paper)] text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "text-base font-semibold leading-none tabular-nums",
            placeholder || loading ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {loading ? "—" : value}
        </p>
        <p className="mt-0.5 text-[0.625rem] leading-snug text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}
