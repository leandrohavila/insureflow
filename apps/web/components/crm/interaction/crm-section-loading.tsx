"use client"

import { Loader2 } from "lucide-react"

import { useDelayedLoading } from "@/lib/hooks/use-delayed-loading"
import { cn } from "@/lib/utils"

export type CrmSectionLoadingProps = {
  isLoading: boolean
  label?: string
  rows?: number
  delayMs?: number
  className?: string
  /** Skeleton compacto para listas inbox */
  variant?: "rows" | "inline"
}

/**
 * Loading progressivo — skeleton shimmer após delay; evita flicker em fetches rápidos.
 */
export function CrmSectionLoading({
  isLoading,
  label = "Carregando…",
  rows = 4,
  delayMs = 180,
  className,
  variant = "rows",
}: CrmSectionLoadingProps) {
  const showLoading = useDelayedLoading(isLoading, delayMs)

  if (!isLoading) return null

  if (!showLoading) {
    return (
      <div
        className={cn("crm-section-loading crm-section-loading--reserved", className)}
        aria-hidden
      />
    )
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "crm-section-loading crm-section-loading--inline",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-4 animate-spin text-muted-foreground/70" />
        <span className="crm-text-meta">{label}</span>
      </div>
    )
  }

  return (
    <div
      className={cn("crm-section-loading", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="crm-skeleton-stack">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="crm-skeleton-row"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <p className="crm-section-loading__label crm-text-meta">{label}</p>
    </div>
  )
}
