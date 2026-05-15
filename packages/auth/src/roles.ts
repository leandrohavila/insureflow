import type { AppRole, Permission } from "./types"
import { PERMISSIONS } from "./types"

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  broker: "Corretor",
  underwriter: "Subscritor",
  viewer: "Visualizador",
}

const ALL: Permission[] = [...PERMISSIONS]

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  super_admin: ALL,
  admin: [
    "dashboard:view",
    "crm:view",
    "crm:manage",
    "clients:view",
    "clients:manage",
    "leads:view",
    "leads:manage",
    "questionnaires:view",
    "questionnaires:manage",
    "quotes:view",
    "quotes:manage",
    "policies:view",
    "policies:manage",
    "claims:view",
    "claims:manage",
    "whatsapp:view",
    "whatsapp:manage",
    "automation:view",
    "automation:manage",
    "settings:view",
    "settings:manage",
    "users:manage",
    "audit:view",
  ],
  broker: [
    "dashboard:view",
    "crm:view",
    "crm:manage",
    "clients:view",
    "clients:manage",
    "leads:view",
    "leads:manage",
    "questionnaires:view",
    "questionnaires:manage",
    "quotes:view",
    "quotes:manage",
    "whatsapp:view",
    "whatsapp:manage",
    "settings:view",
  ],
  underwriter: [
    "dashboard:view",
    "clients:view",
    "quotes:view",
    "quotes:manage",
    "policies:view",
    "policies:manage",
    "claims:view",
    "claims:manage",
    "questionnaires:view",
    "settings:view",
  ],
  viewer: [
    "dashboard:view",
    "crm:view",
    "clients:view",
    "leads:view",
    "questionnaires:view",
    "quotes:view",
    "policies:view",
    "claims:view",
    "settings:view",
  ],
}

export function getPermissionsForRole(role: AppRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]]
}
