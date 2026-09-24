"use client"

import { AlignJustify, LayoutList } from "lucide-react"

import { useCrmWorkspacePreferences } from "@/lib/hooks/use-crm-workspace-preferences"
import { cn } from "@/lib/utils"

/**
 * Toggle compact / comfortable — persistido no workspace CRM.
 */
export function CrmDensityToggle({
  className,
  variant = "default",
}: {
  className?: string
  /** Visual utilitário no cabeçalho — segmented control discreto. */
  variant?: "default" | "header"
}) {
  const { density, setDensity } = useCrmWorkspacePreferences()

  return (
    <div
      className={cn(
        "crm-density-toggle",
        variant === "header" && "crm-density-toggle--header",
        className,
      )}
      role="group"
      aria-label="Densidade operacional"
      data-density={density}
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
        <span>Compacto</span>
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
        <span>Confortável</span>
      </button>
    </div>
  )
}
