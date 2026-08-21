"use client"

import { memo } from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

type PreviewSectionNavProps = {
  sections: string[]
  currentSection: string | null
  completedSections?: Set<string>
  onSelect: (section: string, index: number) => void
  className?: string
}

export const PreviewSectionNav = memo(function PreviewSectionNav({
  sections,
  currentSection,
  completedSections,
  onSelect,
  className,
}: PreviewSectionNavProps) {
  if (sections.length <= 1) return null

  return (
    <nav
      className={cn(
        "shrink-0 space-y-1 border-b border-white/[0.06] px-[var(--if-space-3)] py-[var(--if-space-3)]",
        className,
      )}
      aria-label="Seções do preview"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Seções
      </p>
      {sections.map((section, index) => {
        const isActive = section === currentSection
        const isDone = completedSections?.has(section)
        return (
          <button
            key={section}
            type="button"
            onClick={() => onSelect(section, index)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
              isActive
                ? "bg-primary/12 font-medium text-primary"
                : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px]",
                isDone
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                  : isActive
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-white/[0.12]",
              )}
              aria-hidden
            >
              {isDone ? <Check className="size-2.5" /> : "○"}
            </span>
            <span className="truncate">{section}</span>
          </button>
        )
      })}
    </nav>
  )
})
