import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "../lib/cn";

const kpiVariants = cva(
  "group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 text-card-foreground shadow-if-sm ring-1 ring-foreground/10 transition-shadow hover:shadow-if-md",
  {
    variants: {
      tone: {
        default: "border-border",
        primary: "border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card",
        success: "border-success/25 bg-gradient-to-br from-success/10 via-card to-card",
        warning: "border-warning/25 bg-gradient-to-br from-warning/10 via-card to-card",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export type KpiCardProps = {
  title: string;
  value: React.ReactNode;
  /** e.g. "+12% vs. mês anterior" */
  delta?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
} & VariantProps<typeof kpiVariants>;

export function KpiCard({
  title,
  value,
  delta,
  trend = "neutral",
  icon,
  footer,
  tone,
  className,
}: KpiCardProps) {
  const TrendGlyph =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    <div className={cn(kpiVariants({ tone }), className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        {icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-foreground ring-1 ring-border/60 [&_svg]:size-4">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="tabular-metric text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
      {delta ? (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            trend === "up" && "text-success",
            trend === "down" && "text-destructive",
            trend === "neutral" && "text-muted-foreground",
          )}
        >
          {TrendGlyph ? <TrendGlyph className="size-3.5 shrink-0" aria-hidden /> : null}
          <span>{delta}</span>
        </div>
      ) : null}
      {footer ? (
        <div className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
