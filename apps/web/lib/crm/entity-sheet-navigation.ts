/**
 * Origin-aware navigation for Entity Sheet V2.
 *
 * Preserva a superfície de origem ao abrir negócio/lead em overlay host
 * (`/crm/negocios`, `/crm/contatos`) e restaura o contexto ao fechar o sheet.
 *
 * Query params:
 * - `from` — origem semântica (tasks, agenda, timeline, …)
 * - `returnTo` — path interno explícito (prioridade sobre `from`)
 * - `sheet=v2` — feature flag existente (inalterada)
 */

export type EntitySheetEntityType = "deal" | "lead" | "contact" | "company" | "customer"

export type EntitySheetOrigin =
  | "kanban"
  | "list"
  | "tasks"
  | "agenda"
  | "timeline"
  | "inbox"
  | "notifications"
  | "command"
  | "search"
  | "assistant"

/** Paths padrão por origem — usados quando `returnTo` não é informado. */
export const ENTITY_SHEET_ORIGIN_PATHS: Record<EntitySheetOrigin, string> = {
  kanban: "/crm/negocios",
  list: "/crm/negocios",
  tasks: "/crm/tarefas",
  agenda: "/crm/agenda",
  timeline: "/crm/negocios",
  inbox: "/crm/tarefas",
  notifications: "/crm",
  command: "/crm",
  search: "/crm",
  assistant: "/crm",
}

export const ENTITY_SHEET_HOST_PATH: Record<EntitySheetEntityType, string> = {
  deal: "/crm/negocios",
  lead: "/crm/contatos",
  contact: "/crm/contatos",
  company: "/crm/empresas",
  customer: "/crm/clientes",
}

const ENTITY_PARAM: Record<EntitySheetEntityType, string> = {
  deal: "deal",
  lead: "lead",
  contact: "contact",
  company: "company",
  customer: "customer",
}

const NAVIGATION_CONTEXT_PARAMS = ["from", "returnTo"] as const

/**
 * Aceita apenas paths internos relativos (`/crm/...`).
 * Rejeita protocol-relative (`//`) e URLs absolutas.
 */
export function sanitizeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null
  let decoded = value
  try {
    decoded = decodeURIComponent(value)
  } catch {
    return null
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null
  if (decoded.includes("://")) return null
  return decoded
}

export function parseEntitySheetOrigin(
  value: string | null,
): EntitySheetOrigin | null {
  if (!value) return null
  if (Object.prototype.hasOwnProperty.call(ENTITY_SHEET_ORIGIN_PATHS, value)) {
    return value as EntitySheetOrigin
  }
  return null
}

export function resolveEntitySheetReturnHref(
  searchParams: Pick<URLSearchParams, "get">,
): string | null {
  const explicit = sanitizeReturnTo(searchParams.get("returnTo"))
  if (explicit) return explicit

  const origin = parseEntitySheetOrigin(searchParams.get("from"))
  if (origin) return ENTITY_SHEET_ORIGIN_PATHS[origin]

  return null
}

export type BuildEntitySheetHrefOptions = {
  entityType: EntitySheetEntityType
  entityId: string
  /** Default: v2 */
  sheetVersion?: "v2" | "legacy"
  origin?: EntitySheetOrigin
  /** Path interno para retorno ao fechar o sheet. */
  returnTo?: string
  extraParams?: Record<string, string>
}

export function buildEntitySheetHref({
  entityType,
  entityId,
  sheetVersion = "v2",
  origin,
  returnTo,
  extraParams,
}: BuildEntitySheetHrefOptions): string {
  const host = ENTITY_SHEET_HOST_PATH[entityType]
  const params = new URLSearchParams()

  params.set(ENTITY_PARAM[entityType], entityId)

  if (sheetVersion === "v2") {
    params.set("sheet", "v2")
  }

  if (origin) {
    params.set("from", origin)
  }

  const resolvedReturn =
    sanitizeReturnTo(returnTo) ??
    (origin ? ENTITY_SHEET_ORIGIN_PATHS[origin] : null)

  if (resolvedReturn) {
    params.set("returnTo", resolvedReturn)
  }

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value)
    }
  }

  return `${host}?${params.toString()}`
}

/**
 * Monta o `returnTo` a partir da localização atual (preserva filtros da superfície).
 */
export function buildReturnToFromCurrentLocation(
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString">,
  options?: { excludeParams?: readonly string[] },
): string {
  const params = new URLSearchParams(searchParams.toString())
  for (const key of options?.excludeParams ?? []) {
    params.delete(key)
  }
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

export type CloseEntitySheetNavigationOptions = {
  router: { replace: (href: string, options?: { scroll?: boolean }) => void }
  pathname: string
  searchParams: Pick<URLSearchParams, "get" | "toString">
  entityType: EntitySheetEntityType
}

/**
 * Fecha o Entity Sheet restaurando a superfície de origem quando houver
 * contexto (`returnTo` / `from`). Sem contexto, limpa params de entidade
 * e permanece no host (comportamento legado do kanban/contatos).
 */
export function closeEntitySheetNavigation({
  router,
  pathname,
  searchParams,
  entityType,
}: CloseEntitySheetNavigationOptions): void {
  const returnHref = resolveEntitySheetReturnHref(searchParams)

  if (returnHref) {
    router.replace(returnHref, { scroll: false })
    return
  }

  const params = new URLSearchParams(searchParams.toString())
  params.delete(ENTITY_PARAM[entityType])
  for (const key of NAVIGATION_CONTEXT_PARAMS) {
    params.delete(key)
  }

  const qs = params.toString()
  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
}

/** @deprecated Prefer `buildEntitySheetHref` — mantido para compatibilidade interna. */
export function crmEntitySheetHref(
  entityType: EntitySheetEntityType,
  entityId: string,
  options?: Pick<BuildEntitySheetHrefOptions, "origin" | "returnTo">,
): string {
  return buildEntitySheetHref({
    entityType,
    entityId,
    origin: options?.origin,
    returnTo: options?.returnTo,
  })
}
