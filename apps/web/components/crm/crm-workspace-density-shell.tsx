"use client"

import type { ReactNode } from "react"

import { useCrmWorkspacePreferences } from "@/lib/hooks/use-crm-workspace-preferences"
import { cn } from "@/lib/utils"

type CrmWorkspaceDensityShellProps = {
  children: ReactNode
  className?: string
}

/** Aplica classe de densidade operacional (`compact` | `comfortable`) ao workspace. */
export function CrmWorkspaceDensityShell({
  children,
  className,
}: CrmWorkspaceDensityShellProps) {
  const { density } = useCrmWorkspacePreferences()

  return (
    <div
      className={cn(
        className,
        density === "compact" ? "crm-density-compact" : "crm-density-comfortable",
      )}
      data-crm-density={density}
    >
      {children}
    </div>
  )
}
