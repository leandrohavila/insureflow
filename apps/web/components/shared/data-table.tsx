"use client"

import { useReducedMotion } from "framer-motion"
import { MoreHorizontal } from "lucide-react"
import { hasPermission, type Permission } from "@repo/auth"

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
import { useSession } from "@/components/auth/session-provider"
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
  permission?: Permission
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
  /** Cabeçalho fixo quando a tabela está dentro de um container rolável. */
  stickyHeader?: boolean
  density?: "default" | "compact"
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
  stickyHeader = false,
  density = "default",
}: DataTableProps<T>) {
  const compact = density === "compact"
  const reduce = useReducedMotion()
  const { session } = useSession()

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

  const permittedRowActions =
    rowActions?.filter(
      (action) =>
        !action.permission || hasPermission(session, action.permission),
    ) ?? []
  const hasActions = permittedRowActions.length > 0

  return (
    <div className={cn("space-y-4", className)}>
      <GlassCard
        delay={cardDelay}
        hover={false}
        className={cn("overflow-hidden p-0", compact && "crm-data-table")}
      >
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
            <TableRow
              className={cn(
                "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.02]",
                stickyHeader &&
                  "sticky top-0 z-10 bg-card/95 shadow-[0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm",
              )}
            >
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
                    compact
                      ? "h-9 text-xs font-semibold tracking-wide text-foreground/70 uppercase"
                      : "h-11 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase",
                    column.hideOnMobile && "hidden md:table-cell",
                    column.headerClassName,
                    column.className,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
              {hasActions ? (
                <TableHead
                  className={cn(
                    "pr-5 text-right font-semibold uppercase md:pr-6",
                    compact
                      ? "h-9 text-xs tracking-wide text-foreground/70"
                      : "h-11 text-[10px] tracking-[0.12em] text-muted-foreground",
                  )}
                >
                  Ações
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const visibleActions =
                permittedRowActions.filter((action) =>
                  isRowActionVisible(action, row),
                )

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
                        compact ? "py-2.5" : "py-3.5",
                        column.hideOnMobile && "hidden md:table-cell",
                        column.className,
                      )}
                    >
                      {column.render(row, index)}
                    </TableCell>
                  ))}
                  {hasActions ? (
                    <TableCell
                      className={cn(
                        "pr-5 text-right md:pr-6",
                        compact ? "py-2.5" : "py-3.5",
                      )}
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
