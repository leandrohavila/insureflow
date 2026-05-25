import { cn } from "@/lib/utils"

/**
 * Layout operacional desktop-first.
 * Topbar: manter `DASHBOARD_TOPBAR_HEIGHT` sincronizado com AppTopbar.
 */
export const DASHBOARD_TOPBAR_HEIGHT = "h-14 md:h-16"

/** Variável CSS derivada das mesmas utilities de altura da topbar. */
export const DASHBOARD_TOPBAR_HEIGHT_VAR =
  "[--insure-topbar-height:--spacing(14)] md:[--insure-topbar-height:--spacing(16)]"

export const DASHBOARD_INSET_FRAME =
  "insure-dashboard-inset relative flex h-svh max-h-svh min-h-0 w-full flex-col overflow-hidden"

export const DASHBOARD_MAIN_SLOT =
  "insure-dashboard-main relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"

export const CRM_WORKSPACE =
  "crm-workspace flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"

export const CRM_CHROME =
  "crm-chrome relative z-10 shrink-0 border-b border-white/10 bg-background"

export const CRM_CONTENT_RAIL =
  "crm-content-rail relative z-0 mx-auto flex min-h-0 w-full min-w-0 max-w-[1600px] flex-1 flex-col overflow-hidden"

/** Páginas com tabela/lista longa — scroll vertical no corpo da página. */
export const CRM_PAGE_SCROLL_BODY = "min-h-0 flex-1 overflow-y-auto overflow-x-hidden"

export function dashboardTopbarClassName(...extra: Parameters<typeof cn>) {
  return cn(
    "glass-topbar isolate z-30 flex shrink-0 items-center gap-2 px-3 md:gap-4 md:px-8",
    DASHBOARD_TOPBAR_HEIGHT,
    DASHBOARD_TOPBAR_HEIGHT_VAR,
    ...extra,
  )
}
