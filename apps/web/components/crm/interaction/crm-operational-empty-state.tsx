"use client"

import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

export type CrmOperationalEmptyStateProps = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  hint?: string
  action?: ReactNode
  variant?: "default" | "filtered" | "success"
  className?: string
}

/**
 * Empty state operacional premium — contextual, útil, nunca genérico.
 */
export function CrmOperationalEmptyState({
  icon: Icon,
  title,
  hint,
  action,
  variant = "default",
  className,
}: CrmOperationalEmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "crm-empty-state",
        variant === "filtered" && "crm-empty-state--filtered",
        variant === "success" && "crm-empty-state--success",
        className,
      )}
    >
      <div className="crm-empty-state__icon-wrap" aria-hidden>
        <Icon className="crm-empty-state__icon" strokeWidth={1.5} />
      </div>
      <div className="crm-empty-state__copy">
        <p className="crm-empty-state__title">{title}</p>
        {hint ? <p className="crm-empty-state__hint crm-text-meta">{hint}</p> : null}
      </div>
      {action ? <div className="crm-empty-state__action">{action}</div> : null}
    </div>
  )
}
