import { cn } from "@/lib/utils"

/** Shell padrão das páginas CRM — densidade operacional desktop-first. */
export const CRM_PAGE_SHELL =
  "crm-page-shell flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 pt-4 md:gap-4 md:px-6 md:pb-5 md:pt-5"

/** Corpo rolável em páginas de listagem (contatos, empresas, tarefas). */
export const CRM_PAGE_SHELL_SCROLL =
  "overflow-y-auto overflow-x-hidden"

export const CRM_TOOLBAR =
  "flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"

export const CRM_FILTER_INPUT =
  "h-9 w-full min-w-0 rounded-lg border-white/12 bg-white/[0.05] pl-9 text-sm text-foreground placeholder:text-muted-foreground/80"

export const CRM_VIEW_TOGGLE_WRAP =
  "flex shrink-0 rounded-md border border-white/12 bg-white/[0.04] p-0.5"

export function crmViewToggleButton(active: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-sm font-medium transition-colors",
    active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-foreground/75 hover:bg-white/[0.06] hover:text-foreground",
  )
}

export const CRM_SECTION_TITLE =
  "text-base font-semibold tracking-tight text-foreground"

export const CRM_SECTION_SUBTITLE = "text-sm text-foreground/65"

export const CRM_MUTED_LABEL = "text-xs font-medium text-foreground/60"
