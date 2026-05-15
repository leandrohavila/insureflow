"use client"

import { useReducedMotion } from "framer-motion"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GlassCard } from "@/components/dashboard/glass-card"
import { cn } from "@/lib/utils"

export type CrmTableColumn<T> = {
  key: string
  header: string
  className?: string
  hideOnMobile?: boolean
  render: (row: T, index: number) => React.ReactNode
}

type CrmRecordTableProps<T> = {
  data: T[]
  columns: CrmTableColumn<T>[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  title?: string
  subtitle?: string
}

export function CrmRecordTable<T>({
  data,
  columns,
  getRowId,
  onRowClick,
  title,
  subtitle,
}: CrmRecordTableProps<T>) {
  const reduce = useReducedMotion()

  return (
    <GlassCard delay={0.1} hover={false} className="overflow-hidden p-0">
      {(title || subtitle) && (
        <div className="border-b border-white/[0.06] px-5 py-4 md:px-6">
          {title && <p className="text-sm font-semibold tracking-[-0.02em]">{title}</p>}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.02]">
              <TableHead className="w-10 pl-5 md:pl-6">
                <input type="checkbox" className="size-3.5 rounded border-white/20" aria-label="Selecionar todos" />
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-11 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase",
                    col.hideOnMobile && "hidden md:table-cell",
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-white/[0.05] transition-colors",
                  onRowClick && "cursor-pointer hover:bg-primary/[0.06]",
                  i % 2 === 1 && "bg-white/[0.015]",
                  !reduce && "animate-in fade-in duration-500"
                )}
                style={reduce ? undefined : { animationDelay: `${60 + i * 40}ms` }}
              >
                <TableCell className="pl-5 md:pl-6" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="size-3.5 rounded border-white/20" aria-label="Selecionar linha" />
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn("py-3.5", col.hideOnMobile && "hidden md:table-cell", col.className)}
                  >
                    {col.render(row, i)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </GlassCard>
  )
}

export function OwnerCell({ initials, name }: { initials: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-7 border border-white/10">
        <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="hidden text-xs text-muted-foreground lg:inline">{name}</span>
    </div>
  )
}

export function LifecycleBadge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    Lead: "border-sky-400/30 bg-sky-500/10 text-sky-300",
    MQL: "border-violet-400/30 bg-violet-500/10 text-violet-200",
    SQL: "border-primary/35 bg-primary/15 text-primary-foreground",
    Cliente: "border-emerald-400/35 bg-emerald-500/10 text-emerald-300",
  }
  return (
    <Badge variant="outline" className={cn("rounded-full text-[10px] font-semibold", styles[label] ?? "")}>
      {label}
    </Badge>
  )
}
