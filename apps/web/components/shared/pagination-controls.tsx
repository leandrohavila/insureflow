"use client"

import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PaginationMeta = {
  page: number
  totalPages: number
  total?: number
}

export type PaginationControlsProps = {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  previousLabel?: string
  nextLabel?: string
  className?: string
  summary?: ReactNode
  pageSizeLabel?: string
}

export function PaginationControls({
  meta,
  onPageChange,
  previousLabel = "Anterior",
  nextLabel = "Próxima",
  summary,
  pageSizeLabel,
  className,
}: PaginationControlsProps) {
  const currentPage = Math.max(1, meta.page)
  const totalPages = Math.max(1, meta.totalPages)

  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span>
        {summary ?? (
          <>
            Página {currentPage} de {totalPages}
          </>
        )}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          {previousLabel}
        </Button>
        {summary ? (
          <span
            className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-primary px-2 text-sm font-medium text-primary-foreground"
            aria-current="page"
          >
            {currentPage}
          </span>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {nextLabel}
        </Button>
        {pageSizeLabel ? (
          <span className="inline-flex h-8 items-center rounded-md border border-border bg-card px-2.5 text-xs text-foreground">
            {pageSizeLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
