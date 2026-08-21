"use client"

import { memo } from "react"
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { fieldLibraryItems, type FieldLibraryItem } from "./field-library"
import { builderSurfaces } from "./builder-surfaces"

type FieldLibraryPanelProps = {
  collapsed: boolean
  onToggle: () => void
  onInsert: (item: FieldLibraryItem) => void
  disabled?: boolean
}

export const FieldLibraryPanel = memo(function FieldLibraryPanel({
  collapsed,
  onToggle,
  onInsert,
  disabled,
}: FieldLibraryPanelProps) {
  if (collapsed) {
    return (
      <div className="flex shrink-0 flex-col items-center border-r border-white/[0.06] py-[var(--if-space-3)]">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-9"
                onClick={onToggle}
                aria-label="Expandir biblioteca de campos"
              />
            }
          >
            <LayoutGrid className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="right">Biblioteca de Campos</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        "flex w-52 shrink-0 flex-col border-r border-white/[0.06]",
        builderSurfaces.level1,
        "rounded-none border-y-0 border-l-0",
      )}
      aria-label="Biblioteca de campos"
    >
      <header className="flex items-center justify-between border-b border-white/[0.06] px-[var(--if-space-3)] py-[var(--if-space-3)]">
        <div>
          <p className="text-sm font-semibold tracking-[-0.02em]">
            Biblioteca
          </p>
          <p className="text-[10px] text-muted-foreground">Clique para inserir</p>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={onToggle}
          aria-label="Recolher biblioteca"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-[var(--if-space-2)]">
        <div className="grid grid-cols-1 gap-[var(--if-space-1)]">
          {fieldLibraryItems.map((item) => {
            const Icon = item.icon
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      disabled={disabled}
                      data-library-field={item.id}
                      onClick={() => onInsert(item)}
                      className={cn(
                        "flex w-full items-center gap-[var(--if-space-2)] rounded-lg px-[var(--if-space-2)] py-[var(--if-space-2)] text-left text-xs transition-colors",
                        "hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        "disabled:cursor-not-allowed disabled:opacity-40",
                      )}
                    />
                  }
                >
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{item.label}</span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Inserir campo {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>

      <footer className="border-t border-white/[0.06] px-[var(--if-space-3)] py-[var(--if-space-2)]">
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ChevronRight className="size-3" />
          Arrastar em breve
        </p>
      </footer>
    </aside>
  )
})
