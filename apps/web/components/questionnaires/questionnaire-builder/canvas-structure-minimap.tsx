"use client"

import { memo, useState } from "react"
import { ChevronDown, Map } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { builderSurfaces } from "./builder-surfaces"
import { canvasSectionDomId, scrollToCanvasSection } from "./canvas-empty-state"

type CanvasStructureMinimapProps = {
  sections: string[]
  activeSection?: string | null
  className?: string
}

export const CanvasStructureMinimap = memo(function CanvasStructureMinimap({
  sections,
  activeSection,
  className,
}: CanvasStructureMinimapProps) {
  const [open, setOpen] = useState(true)

  if (sections.length < 4) return null

  return (
    <div
      className={cn(
        builderSurfaces.level2,
        "overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-[var(--if-space-3)] py-[var(--if-space-2)] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <Map className="size-3.5" />
          Estrutura
        </span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <nav
          className="max-h-48 space-y-0.5 overflow-y-auto border-t border-white/[0.06] p-[var(--if-space-2)]"
          aria-label="Navegação rápida de seções"
        >
          {sections.map((section) => (
            <Button
              key={section}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-full justify-start truncate px-2 text-xs font-normal",
                activeSection === section && "bg-primary/10 text-primary",
              )}
              onClick={() => scrollToCanvasSection(section)}
            >
              {section}
            </Button>
          ))}
        </nav>
      ) : null}
    </div>
  )
})

export { canvasSectionDomId }
