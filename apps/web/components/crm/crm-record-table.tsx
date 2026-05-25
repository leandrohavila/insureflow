"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
} from "@/components/shared"
import { cn } from "@/lib/utils"

export type CrmTableColumn<T> = DataTableColumn<T>
export type CrmRecordTableProps<T> = DataTableProps<T>

export function CrmRecordTable<T>(props: CrmRecordTableProps<T>) {
  return <DataTable selectable {...props} />
}

export function OwnerCell({
  initials,
  name,
}: {
  initials: string
  name: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-7 border border-white/10">
        <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="hidden text-xs text-muted-foreground lg:inline">
        {name}
      </span>
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
    <Badge
      variant="outline"
      className={cn(
        "rounded-full text-[10px] font-semibold",
        styles[label] ?? "",
      )}
    >
      {label}
    </Badge>
  )
}
