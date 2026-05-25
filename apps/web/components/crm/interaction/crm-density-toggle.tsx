"use client"

import { AlignJustify, LayoutList } from "lucide-react"

import { useCrmWorkspacePreferences } from "@/lib/hooks/use-crm-workspace-preferences"
import { cn } from "@/lib/utils"

/**
 * Toggle compact / comfortable — persistido no workspace CRM.
 */
export function CrmDensityToggle({ className }: { className?: string }) {
  const { density, setDensity } = useCrmWorkspacePreferences()

  return (
    <div
      className={cn("crm-density-toggle", className)}
      role="group"
      aria-label="Densidade operacional"
    >
      <button
        type="button"
        aria-pressed={density === "compact"}
        title="Compacto — alta densidade"
        className={cn(
          "crm-density-toggle__btn",
          density === "compact" && "crm-density-toggle__btn--active",
        )}
        onClick={() => setDensity("compact")}
      >
        <AlignJustify className="size-3.5" strokeWidth={1.75} />
        <span className="sr-only sm:not-sr-only sm:inline">Compacto</span>
      </button>
      <button
        type="button"
        aria-pressed={density === "comfortable"}
        title="Confortável — mais respiro"
        className={cn(
          "crm-density-toggle__btn",
          density === "comfortable" && "crm-density-toggle__btn--active",
        )}
        onClick={() => setDensity("comfortable")}
      >
        <LayoutList className="size-3.5" strokeWidth={1.75} />
        <span className="sr-only sm:not-sr-only sm:inline">Confortável</span>
      </button>
    </div>
  )
}
