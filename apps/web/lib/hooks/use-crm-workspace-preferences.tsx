"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import {
  DEFAULT_CRM_WORKSPACE_PREFERENCES,
  patchCrmWorkspacePreferences,
  readCrmWorkspacePreferences,
  type CrmDensity,
  type CrmPreferencePath,
  type CrmWorkspacePreferences,
} from "@/lib/crm/crm-workspace-preferences"

type CrmWorkspacePreferencesContextValue = {
  preferences: CrmWorkspacePreferences
  density: CrmDensity
  setPreference: (path: CrmPreferencePath, value: string) => void
  setDensity: (density: CrmDensity) => void
}

const CrmWorkspacePreferencesContext =
  createContext<CrmWorkspacePreferencesContextValue | null>(null)

const listeners = new Set<() => void>()
let cachedPrefs: CrmWorkspacePreferences = DEFAULT_CRM_WORKSPACE_PREFERENCES
let clientHydrated = false

function hydrateFromStorage() {
  if (typeof window === "undefined" || clientHydrated) return
  cachedPrefs = readCrmWorkspacePreferences()
  clientHydrated = true
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Deve retornar referência estável até o próximo `notify()`. */
function getSnapshot() {
  hydrateFromStorage()
  return cachedPrefs
}

function getServerSnapshot() {
  return DEFAULT_CRM_WORKSPACE_PREFERENCES
}

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

function updatePrefs(updater: () => CrmWorkspacePreferences) {
  cachedPrefs = updater()
  notify()
}

export function CrmWorkspacePreferencesProvider({
  children,
}: {
  children: ReactNode
}) {
  const preferences = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  const setPreference = useCallback(
    (path: CrmPreferencePath, value: string) => {
      updatePrefs(() => patchCrmWorkspacePreferences(path, value))
    },
    [],
  )

  const setDensity = useCallback((density: CrmDensity) => {
    setPreference("density", density)
  }, [setPreference])

  const value = useMemo(
    () => ({
      preferences,
      density: preferences.density,
      setPreference,
      setDensity,
    }),
    [preferences, setPreference, setDensity],
  )

  return (
    <CrmWorkspacePreferencesContext.Provider value={value}>
      {children}
    </CrmWorkspacePreferencesContext.Provider>
  )
}

export function useCrmWorkspacePreferences() {
  const ctx = useContext(CrmWorkspacePreferencesContext)
  if (!ctx) {
    throw new Error(
      "useCrmWorkspacePreferences deve ser usado dentro de CrmWorkspacePreferencesProvider",
    )
  }
  return ctx
}

/** Hook opcional fora do CRM shell — retorna defaults read-only. */
export function useCrmWorkspacePreferencesOptional() {
  return useContext(CrmWorkspacePreferencesContext)
}

export function useCrmPersistedValue<P extends CrmPreferencePath>(
  path: P,
  isValid: (value: string) => boolean,
): [string, (value: string) => void] {
  const { preferences, setPreference } = useCrmWorkspacePreferences()

  const value = useMemo(() => {
    switch (path) {
      case "density":
        return preferences.density
      case "tasks.filter":
        return preferences.tasks.filter
      case "agenda.filter":
        return preferences.agenda.filter
      case "agenda.typeFilter":
        return preferences.agenda.typeFilter
      case "deals.view":
        return preferences.deals.view
      case "dealSheetSection":
        return preferences.dealSheetSection
      case "leadSheetSection":
        return preferences.leadSheetSection
      case "contactSheetSection":
        return preferences.contactSheetSection
      case "companySheetSection":
        return preferences.companySheetSection
      case "customerSheetSection":
        return preferences.customerSheetSection
      default:
        return ""
    }
  }, [path, preferences])

  const setValue = useCallback(
    (next: string) => {
      if (!isValid(next)) return
      setPreference(path, next)
    },
    [isValid, path, setPreference],
  )

  return [value, setValue]
}
