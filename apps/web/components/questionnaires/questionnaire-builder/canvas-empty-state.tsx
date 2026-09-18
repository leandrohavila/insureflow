"use client"

import { FileQuestion, Layers, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { builderSurfaces } from "./builder-surfaces"

type CanvasEmptyStateProps = {
  canManage: boolean
  onOpenWizard: () => void
  onInsertBlock: () => void
  onBlankTemplate: () => void
  className?: string
}

export function CanvasEmptyState({
  canManage,
  onOpenWizard,
  onInsertBlock,
  onBlankTemplate,
  className,
}: CanvasEmptyStateProps) {
  return (
    <div
      className={cn(
        builderSurfaces.level2,
        "flex flex-col items-center justify-center px-[var(--if-space-8)] py-[var(--if-space-12)] text-center",
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
        <FileQuestion className="size-8 text-primary" aria-hidden />
      </div>
      <h3 className="mt-[var(--if-space-5)] text-lg font-semibold tracking-[-0.03em]">
        Seu template ainda está vazio.
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Comece com o assistente inteligente para montar um questionário comercial
        completo em segundos — ou insira blocos manualmente no canvas.
      </p>
      {canManage ? (
        <div className="mt-[var(--if-space-6)] flex flex-wrap items-center justify-center gap-[var(--if-space-3)]">
          <Button type="button" className="gap-2" onClick={onOpenWizard}>
            <Sparkles className="size-4" />
            Criar com Assistente
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={onInsertBlock}
          >
            <Layers className="size-4" />
            Inserir Bloco
          </Button>
          <Button type="button" variant="ghost" onClick={onBlankTemplate}>
            Template em Branco
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function canvasSectionDomId(section: string) {
  return `canvas-section-${section
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`
}

export function scrollToCanvasSection(section: string) {
  const id = canvasSectionDomId(section)
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}
