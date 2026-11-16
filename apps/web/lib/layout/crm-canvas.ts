/**
 * Rotas cujo miolo do dashboard usa a superfície clara do CRM.
 * A sidebar e o topbar ficam de fora. Seguros, Imobiliário,
 * Configurações e Portal não entram nesta lista.
 */
const CRM_CANVAS_EXCLUSIONS = [
  "/crm/follow-ups",
  "/crm/renovacoes",
  "/crm/renovacoes-carteira",
] as const

function matchesPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function isCrmCanvasPath(pathname: string) {
  const path = (pathname.split("?")[0] ?? pathname).replace(/\/+$/, "") || "/"

  if (matchesPrefix(path, "/leads") || matchesPrefix(path, "/clientes")) {
    return true
  }

  if (path !== "/crm" && !path.startsWith("/crm/")) return false

  return !CRM_CANVAS_EXCLUSIONS.some((prefix) => matchesPrefix(path, prefix))
}
