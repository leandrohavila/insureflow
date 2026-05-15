"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "../lib/cn";

export type DataTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  /** When `cell` is omitted, `accessor` is stringified for display. */
  accessor?: (row: T) => unknown;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  caption?: string;
  className?: string;
  tableClassName?: string;
};

type SortDir = "asc" | "desc" | null;

function defaultAccessor<T>(row: T, column: DataTableColumn<T>): React.ReactNode {
  if (column.accessor) {
    const v = column.accessor(row);
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }
  return null;
}

function comparePrimitive(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

export function DataTable<T>({
  columns,
  data,
  getRowId = (_row, i) => String(i),
  onRowClick,
  empty,
  caption,
  className,
  tableClassName,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ id: string; dir: SortDir } | null>(null);

  const sortedData = useMemo(() => {
    if (!sort?.dir) return data;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortable || !col.accessor) return data;
    const dir = sort.dir;
    return [...data].sort((a, b) => {
      const cmp = comparePrimitive(col.accessor!(a), col.accessor!(b));
      return dir === "asc" ? cmp : -cmp;
    });
  }, [columns, data, sort]);

  const toggleSort = (id: string, sortable?: boolean) => {
    if (!sortable) return;
    setSort((prev) => {
      if (prev?.id !== id) return { id, dir: "asc" };
      if (prev.dir === "asc") return { id, dir: "desc" };
      return null;
    });
  };

  if (sortedData.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed bg-muted/20 p-10 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {empty ?? "Nenhum registro encontrado."}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-x-auto rounded-xl border bg-card ring-1 ring-foreground/10",
        className,
      )}
    >
      <table className={cn("w-full caption-bottom text-sm", tableClassName)}>
        {caption ? (
          <caption className="mt-3 px-4 text-left text-muted-foreground">
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr className="border-b bg-muted/40">
            {columns.map((col) => {
              const active = sort?.id === col.id;
              const dir = active ? sort?.dir : null;
              return (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(
                    "h-11 px-3 text-left font-medium text-foreground",
                    col.sortable &&
                      "cursor-pointer select-none hover:bg-muted/60",
                    col.headerClassName,
                  )}
                  onClick={() => toggleSort(col.id, col.sortable)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable ? (
                      <span className="text-muted-foreground">
                        {dir === "asc" ? (
                          <ArrowUp className="size-3.5" aria-hidden />
                        ) : dir === "desc" ? (
                          <ArrowDown className="size-3.5" aria-hidden />
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />
                        )}
                      </span>
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={getRowId(row, index)}
              className={cn(
                "border-b transition-colors hover:bg-muted/40",
                onRowClick && "cursor-pointer",
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.id} className={cn("p-3 align-middle", col.className)}>
                  {col.cell?.(row) ?? defaultAccessor(row, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
