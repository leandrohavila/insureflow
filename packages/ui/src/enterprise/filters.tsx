"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";

import { cn } from "../lib/cn";

export type FiltersBarProps = {
  children?: React.ReactNode;
  /** Number of active constraints (for badge). */
  activeCount?: number;
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
};

export function FiltersBar({
  children,
  activeCount = 0,
  onClear,
  clearLabel = "Limpar filtros",
  className,
}: FiltersBarProps) {
  const showClear = Boolean(onClear && activeCount > 0);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2.5 shadow-if-sm ring-1 ring-foreground/5 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="size-4 shrink-0" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide">
          Filtros
        </span>
        {activeCount > 0 ? (
          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
            {activeCount}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <X className="size-3.5" aria-hidden />
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}

export type FilterChipProps = {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
};

export function FilterChip({ children, onRemove, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted/50 py-1 pl-2.5 pr-1 text-xs text-foreground",
        className,
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          aria-label="Remover filtro"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </span>
  );
}
