import type { DashboardKpi, DashboardKpiKey } from "@/lib/data-access/modules/dashboard/hooks"

export function pickDashboardKpi(
  kpis: DashboardKpi[],
  key: DashboardKpiKey,
): DashboardKpi | undefined {
  return kpis.find((item) => item.key === key)
}

export function formatDashboardDate(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function getDashboardGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return "Bom dia."
  if (hour < 18) return "Boa tarde."
  return "Boa noite."
}

export function formatDashboardMetricValue(
  kpi: DashboardKpi | undefined,
  fallback = "—",
): string | number {
  if (!kpi || kpi.isLoading) return fallback
  if (kpi.isError) return fallback
  if (kpi.value == null) return fallback
  return kpi.value
}

export function parseDashboardMetricNumber(
  kpi: DashboardKpi | undefined,
): number {
  const value = formatDashboardMetricValue(kpi, "0")
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatAgendaTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export const dashboardCardLinkClassName =
  "h-7 shrink-0 px-2 text-xs text-muted-foreground"

export const dashboardSectionTitleClassName =
  "text-sm font-medium tracking-tight text-foreground"

export const dashboardSectionSubtitleClassName =
  "text-xs text-muted-foreground"

export const dashboardSectionCardClassName =
  "transition-[border-color,background-color,box-shadow] duration-[var(--if-duration-base)] hover:border-white/[0.12]"

export const dashboardInteractiveItemClassName =
  "transition-[background-color,color] duration-[var(--if-duration-base)] hover:bg-white/[0.03] rounded-[var(--if-radius-md)]"

export const dashboardFunnelBarClassName =
  "rounded-sm bg-primary/70 transition-[width,background-color,filter] duration-[var(--if-duration-base)] hover:brightness-110"

export const dashboardExecutiveGridClassName =
  "grid min-w-0 grid-cols-1 items-stretch gap-[var(--if-space-2)] lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]"

export const dashboardAnalyticsGridClassName =
  "grid min-w-0 grid-cols-1 items-stretch gap-[var(--if-space-2)] md:grid-cols-2 xl:grid-cols-3"

export const dashboardSectionGapClassName = "gap-1.5"

export const dashboardUniformCardClassName = "h-full"

export const dashboardInsightsGridClassName =
  "grid min-w-0 grid-cols-1 items-stretch gap-[var(--if-space-4)] lg:grid-cols-2"
