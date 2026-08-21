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
        "min-w-0 rounded-[var(--if-radius-md)] bg-white/[0.02] px-2 py-1.5",
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
      <p className="mt-1 truncate text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
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
        "grid grid-cols-2 gap-1.5 sm:grid-cols-3",
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
        "flex min-w-0 items-center gap-[var(--if-space-2)] rounded-[var(--if-radius-md)] px-1 py-1",
        className,
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-[var(--if-radius-md)] bg-white/[0.04] text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-base font-semibold leading-none tabular-nums",
            placeholder || loading ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {loading ? "—" : value}
        </p>
        <p className="mt-0.5 truncate text-[0.625rem] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  )
}
