import type { Permission } from "./types"

/** Permissão mínima exigida por prefixo de rota (ordem: mais específico primeiro). */
const ROUTE_RULES: { prefix: string; permission: Permission }[] = [
  { prefix: "/crm", permission: "crm:view" },
  { prefix: "/clientes", permission: "clients:view" },
  { prefix: "/leads", permission: "leads:view" },
  { prefix: "/questionarios", permission: "questionnaires:view" },
  { prefix: "/cotacoes", permission: "quotes:view" },
  { prefix: "/apolices", permission: "policies:view" },
  { prefix: "/sinistros", permission: "claims:view" },
  { prefix: "/whatsapp", permission: "whatsapp:view" },
  { prefix: "/automacao", permission: "automation:view" },
  { prefix: "/configuracoes", permission: "settings:view" },
  { prefix: "/", permission: "dashboard:view" },
]

export function getRoutePermission(pathname: string): Permission | null {
  const path = pathname.split("?")[0] ?? pathname
  if (path === "/login" || path.startsWith("/api/auth")) return null
  if (path === "/unauthorized") return null

  for (const rule of ROUTE_RULES) {
    if (rule.prefix === "/") {
      if (path === "/" || path === "") return rule.permission
      continue
    }
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return rule.permission
    }
  }

  return "dashboard:view"
}

export const PUBLIC_PATHS = ["/login", "/unauthorized"] as const

export function isPublicPath(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
}
