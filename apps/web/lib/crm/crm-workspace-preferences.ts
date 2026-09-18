/**
 * Persistência operacional do CRM V2 (localStorage).
 * Filtros, densidade, seções de sheet e preferências de visualização.
 */

export type CrmDensity = "compact" | "comfortable"

export type CrmWorkspacePreferences = {
  version: 1
  density: CrmDensity
  tasks: {
    filter: string
  }
  agenda: {
    filter: string
    typeFilter: string
  }
  deals: {
    view: "board" | "list"
  }
  dealSheetSection: string
  leadSheetSection: string
  contactSheetSection: string
  companySheetSection: string
  customerSheetSection: string
}

export const CRM_WORKSPACE_PREFS_KEY = "insureflow:crm-workspace-prefs-v1"

export const DEFAULT_CRM_WORKSPACE_PREFERENCES: CrmWorkspacePreferences = {
  version: 1,
  density: "compact",
  tasks: { filter: "all" },
  agenda: { filter: "all", typeFilter: "all" },
  deals: { view: "board" },
  dealSheetSection: "overview",
  leadSheetSection: "overview",
  contactSheetSection: "overview",
  companySheetSection: "overview",
  customerSheetSection: "overview",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function mergePreferences(
  stored: unknown,
): CrmWorkspacePreferences {
  if (!isRecord(stored) || stored.version !== 1) {
    return { ...DEFAULT_CRM_WORKSPACE_PREFERENCES }
  }

  return {
    version: 1,
    density:
      stored.density === "comfortable" ? "comfortable" : "compact",
    tasks: {
      filter:
        typeof (stored.tasks as Record<string, unknown>)?.filter === "string"
          ? ((stored.tasks as Record<string, unknown>).filter as string)
          : DEFAULT_CRM_WORKSPACE_PREFERENCES.tasks.filter,
    },
    agenda: {
      filter:
        typeof (stored.agenda as Record<string, unknown>)?.filter === "string"
          ? ((stored.agenda as Record<string, unknown>).filter as string)
          : DEFAULT_CRM_WORKSPACE_PREFERENCES.agenda.filter,
      typeFilter:
        typeof (stored.agenda as Record<string, unknown>)?.typeFilter ===
        "string"
          ? ((stored.agenda as Record<string, unknown>).typeFilter as string)
          : DEFAULT_CRM_WORKSPACE_PREFERENCES.agenda.typeFilter,
    },
    deals: {
      view:
        (stored.deals as Record<string, unknown>)?.view === "list"
          ? "list"
          : "board",
    },
    dealSheetSection:
      typeof stored.dealSheetSection === "string"
        ? stored.dealSheetSection
        : DEFAULT_CRM_WORKSPACE_PREFERENCES.dealSheetSection,
    leadSheetSection:
      typeof stored.leadSheetSection === "string"
        ? stored.leadSheetSection
        : DEFAULT_CRM_WORKSPACE_PREFERENCES.leadSheetSection,
    contactSheetSection:
      typeof stored.contactSheetSection === "string"
        ? stored.contactSheetSection
        : DEFAULT_CRM_WORKSPACE_PREFERENCES.contactSheetSection,
    companySheetSection:
      typeof stored.companySheetSection === "string"
        ? stored.companySheetSection
        : DEFAULT_CRM_WORKSPACE_PREFERENCES.companySheetSection,
    customerSheetSection:
      typeof stored.customerSheetSection === "string"
        ? stored.customerSheetSection
        : DEFAULT_CRM_WORKSPACE_PREFERENCES.customerSheetSection,
  }
}

export function readCrmWorkspacePreferences(): CrmWorkspacePreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CRM_WORKSPACE_PREFERENCES }
  }
  try {
    const raw = window.localStorage.getItem(CRM_WORKSPACE_PREFS_KEY)
    if (!raw) return { ...DEFAULT_CRM_WORKSPACE_PREFERENCES }
    return mergePreferences(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_CRM_WORKSPACE_PREFERENCES }
  }
}

export function writeCrmWorkspacePreferences(
  prefs: CrmWorkspacePreferences,
): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      CRM_WORKSPACE_PREFS_KEY,
      JSON.stringify(prefs),
    )
  } catch {
    // quota / private mode
  }
}

export type CrmPreferencePath =
  | "density"
  | "tasks.filter"
  | "agenda.filter"
  | "agenda.typeFilter"
  | "deals.view"
  | "dealSheetSection"
  | "leadSheetSection"
  | "contactSheetSection"
  | "companySheetSection"
  | "customerSheetSection"

export function patchCrmWorkspacePreferences(
  path: CrmPreferencePath,
  value: string,
): CrmWorkspacePreferences {
  const current = readCrmWorkspacePreferences()
  const next = { ...current }

  switch (path) {
    case "density":
      next.density = value === "comfortable" ? "comfortable" : "compact"
      break
    case "tasks.filter":
      next.tasks = { ...next.tasks, filter: value }
      break
    case "agenda.filter":
      next.agenda = { ...next.agenda, filter: value }
      break
    case "agenda.typeFilter":
      next.agenda = { ...next.agenda, typeFilter: value }
      break
    case "deals.view":
      next.deals = { view: value === "list" ? "list" : "board" }
      break
    case "dealSheetSection":
      next.dealSheetSection = value
      break
    case "leadSheetSection":
      next.leadSheetSection = value
      break
    case "contactSheetSection":
      next.contactSheetSection = value
      break
    case "companySheetSection":
      next.companySheetSection = value
      break
    case "customerSheetSection":
      next.customerSheetSection = value
      break
  }

  writeCrmWorkspacePreferences(next)
  return next
}
