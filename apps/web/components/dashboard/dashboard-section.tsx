"use client"

import type { ReactNode } from "react"

import { AppCard, type AppCardPadding, Inline, Stack } from "@/components/design-system"
import { cn } from "@/lib/utils"

import {
  dashboardSectionCardClassName,
  dashboardSectionSubtitleClassName,
  dashboardSectionTitleClassName,
} from "./dashboard-utils"

export type DashboardSectionProps = {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children?: ReactNode
  emptyState?: ReactNode
  loading?: boolean
  className?: string
  padding?: AppCardPadding
  fill?: boolean
  footer?: ReactNode
  interactive?: boolean
  dense?: boolean
}

export function DashboardSection({
  title,
  subtitle,
  action,
  children,
  emptyState,
  loading = false,
  className,
  padding = "compact",
  fill = false,
  footer,
  interactive = false,
  dense = false,
}: DashboardSectionProps) {
  const body = loading ? (
    <p className="text-sm text-muted-foreground">Carregando…</p>
  ) : emptyState != null && children == null ? (
    emptyState
  ) : (
    children
  )

  return (
    <AppCard
      padding={padding}
      interactive={interactive}
      className={cn(
        dashboardSectionCardClassName,
        dense && "[&]:p-[var(--if-space-3)]",
        "min-w-0",
        fill && "flex min-h-full flex-col",
        className,
      )}
    >
      <Stack
        gap="sm"
        className={cn(fill && "min-h-0 flex-1", dense && "gap-1.5")}
      >
        <Inline justify="between" align="start" className="w-full gap-[var(--if-space-2)]">
          <div className="min-w-0 space-y-0">
            <p className={dashboardSectionTitleClassName}>{title}</p>
            {subtitle ? (
              <p className={dashboardSectionSubtitleClassName}>{subtitle}</p>
            ) : null}
          </div>
          {action}
        </Inline>
        {body}
        {footer}
      </Stack>
    </AppCard>
  )
}
