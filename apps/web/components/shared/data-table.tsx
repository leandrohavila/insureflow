"use client"

import { useReducedMotion } from "framer-motion"
import { MoreHorizontal } from "lucide-react"

import { GlassCard } from "@/components/dashboard/glass-card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getErrorMessage } from "@/lib/data-access"
import { cn } from "@/lib/utils"

import { EmptyState, ErrorState, LoadingState } from "./list-states"
import {
  PaginationControls,
  type PaginationControlsProps,
} from "./pagination-controls"

export type DataTableColumn<T> = {
  key: string
  header: React.ReactNode
  className?: string
  headerClassName?: string
  hideOnMobile?: boolean
  render: (row: T, index: number) => React.ReactNode
}

export type DataTableRowAction<T> = {
  key: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "destructive"
  disabled?: boolean | ((row: T) => boolean)
  hidden?: boolean | ((row: T) => boolean)
  // Metadata reserved for the upcoming ACL layer without changing this API.
  permission?: string
  onSelect: (row: T) => void
}

export type DataTableStateProps = {
  loading?: boolean
  loadingLabel?: React.ReactNode
  error?: unknown
  errorTitle?: React.ReactNode
  emptyTitle?: React.ReactNode
  emptyDescription?: React.ReactNode
  emptyIcon?: React.ComponentType<{ className?: string }>
  emptyAction?: React.ReactNode
  onRetry?: () => void
}

export type DataTableProps<T> = DataTableStateProps & {
  data: T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  rowActions?: DataTableRowAction<T>[]
  title?: React.ReactNode
  subtitle?: React.ReactNode
  selectable?: boolean
  pagination?: PaginationControlsProps
  className?: string
  tableClassName?: string
  cardDelay?: number
}

function isRowActionVisible<T>(action: DataTableRowAction<T>, row: T) {
  return typeof action.hidden === "function" ? !action.hidden(row) : !action.hidden
}

function isRowActionDisabled<T>(action: DataTableRowAction<T>, row: T) {
  return typeof action.disabled === "function"
    ? action.disabled(row)
    : Boolean(action.disabled)
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  rowActions,
  title,
  subtitle,
  selectable = false,
  pagination,
  loading,
  loadingLabel,
  error,
  errorTitle,
  emptyTitle = "Nenhum registro encontrado.",
  emptyDescription,
  emptyIcon,
  emptyAction,
  onRetry,
  className,
  tableClassName,
  cardDelay = 0.1,
}: DataTableProps<T>) {
  const reduce = useReducedMotion()

  if (loading) {
    return <LoadingState label={loadingLabel} />
  }

  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        description={getErrorMessage(error, "Erro ao carregar registros")}
        onRetry={onRetry}
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  const hasActions = Boolean(rowActions?.length)

  return (
    <div className={cn("space-y-4", className)}>
      <GlassCard delay={cardDelay} hover={false} className="overflow-hidden p-0">
        {(title || subtitle) && (
          <div className="border-b border-white/[0.06] px-5 py-4 md:px-6">
            {title ? (
              <p className="text-sm font-semibold tracking-[-0.02em]">
                {title}
              </p>
            ) : null}
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        )}
        <Table className={tableClassName}>
          <TableHeader>
            <TableRow className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.02]">
              {selectable ? (
                <TableHead className="w-10 pl-5 md:pl-6">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-white/20"
                    aria-label="Selecionar todos"
                  />
                </TableHead>
              ) : null}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-11 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase",
                    column.hideOnMobile && "hidden md:table-cell",
                    column.headerClassName,
                    column.className,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
              {hasActions ? (
                <TableHead className="h-11 pr-5 text-right text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase md:pr-6">
                  Ações
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const visibleActions =
                rowActions?.filter((action) => isRowActionVisible(action, row)) ??
                []

              return (
                <TableRow
                  key={getRowId(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-white/[0.05] transition-colors",
                    onRowClick && "cursor-pointer hover:bg-primary/[0.06]",
                    index % 2 === 1 && "bg-white/[0.015]",
                    !reduce && "animate-in fade-in duration-500",
                  )}
                  style={
                    reduce
                      ? undefined
                      : { animationDelay: `${60 + index * 40}ms` }
                  }
                >
                  {selectable ? (
                    <TableCell
                      className="pl-5 md:pl-6"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="size-3.5 rounded border-white/20"
                        aria-label="Selecionar linha"
                      />
                    </TableCell>
                  ) : null}
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        "py-3.5",
                        column.hideOnMobile && "hidden md:table-cell",
                        column.className,
                      )}
                    >
                      {column.render(row, index)}
                    </TableCell>
                  ))}
                  {hasActions ? (
                    <TableCell
                      className="py-3.5 pr-5 text-right md:pr-6"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        {visibleActions.length > 0 ? (
                          visibleActions.map((action) => {
                            const Icon = action.icon ?? MoreHorizontal
                            return (
                              <Button
                                key={action.key}
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "size-8 p-0",
                                  action.variant === "destructive" &&
                                    "text-destructive hover:text-destructive",
                                )}
                                disabled={isRowActionDisabled(action, row)}
                                onClick={() => action.onSelect(row)}
                              >
                                <Icon className="size-3.5" />
                                <span className="sr-only">{action.label}</span>
                              </Button>
                            )
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </GlassCard>

      {pagination ? <PaginationControls {...pagination} /> : null}
    </div>
  )
}
