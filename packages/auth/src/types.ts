export const APP_ROLES = [
  "super_admin",
  "admin",
  "sales",
  "broker",
  "underwriter",
  "viewer",
] as const

export type AppRole = (typeof APP_ROLES)[number]

export const PERMISSIONS = [
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
  "tenants:manage",
  "audit:view",
] as const

export type Permission = (typeof PERMISSIONS)[number]

export type AuthUser = {
  id: string
  email: string
  name: string
  initials: string
  role: AppRole
  roleLabel: string
  organizationId: string
  organizationName: string
  title: string
  passwordHash: string
}

export type SessionUser = {
  id: string
  email: string
  name: string
  initials: string
  role: AppRole
  roleLabel: string
  organizationId: string
  organizationName: string
  title: string
}

export type SessionPayload = SessionUser & {
  permissions: Permission[]
  iat?: number
  exp?: number
}
