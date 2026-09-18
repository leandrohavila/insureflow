"use client"

import { Search } from "lucide-react"

import { FilterChip } from "@/components/crm/primitives"
import { Input } from "@/components/ui/input"
import { CRM_FILTER_INPUT } from "@/lib/crm/crm-layout-classes"
import { cn } from "@/lib/utils"

import {
  TASK_FILTER_ACCENT,
  TASK_FILTER_LABELS,
  type TaskFilter,
} from "./task-workspace-utils"

type TaskToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  activeFilter: TaskFilter
  onFilterChange: (filter: TaskFilter) => void
  counts: Record<TaskFilter, number>
  className?: string
}

export function TaskToolbar({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  counts,
  className,
}: TaskToolbarProps) {
  return (
    <div
      className={cn(
        "task-toolbar flex min-w-0 shrink-0 flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-4",
        className,
      )}
    >
      <div className="relative min-w-0 flex-1 lg:max-w-sm xl:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar tarefas, negócios ou responsáveis…"
          className={cn(
            CRM_FILTER_INPUT,
            "h-9 w-full min-w-0 rounded-lg pl-9",
          )}
          aria-label="Buscar tarefas"
        />
      </div>

      <nav
        aria-label="Filtrar tarefas"
        className="task-toolbar__filters flex min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain rounded-lg p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:shrink-0 lg:overflow-visible"
      >
        {(Object.keys(TASK_FILTER_LABELS) as TaskFilter[]).map((filter) => (
          <FilterChip
            key={filter}
            isActive={activeFilter === filter}
            label={TASK_FILTER_LABELS[filter]}
            count={counts[filter] > 0 ? counts[filter] : undefined}
            accentVar={TASK_FILTER_ACCENT[filter]}
            onClick={() => onFilterChange(filter)}
          />
        ))}
      </nav>
    </div>
  )
}
