"use client"

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
}

export function PaginationControls({
  meta,
  onPageChange,
  previousLabel = "Anterior",
  nextLabel = "Próxima",
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
        Página {currentPage} de {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          {previousLabel}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
