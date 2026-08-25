export type PermissionRecord = {
  id: string
  key: string
  description?: string | null
  createdAt: string
}

export type RolePermissionLink = {
  roleId: string
  permissionId: string
  permission: PermissionRecord
}

export type RoleWithPermissions = {
  id: string
  tenantId: string
  name: string
  slug: string
  description?: string | null
  isSystem: boolean
  defaultDataScope: string
  createdAt: string
  updatedAt: string
  rolePermissions: RolePermissionLink[]
}

export type GovernanceUserRole = {
  userId: string
  roleId: string
  role: {
    id: string
    name: string
    slug: string
  }
}

export type GovernanceUser = {
  id: string
  email: string
  name: string
  initials: string
  title: string
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
  userRoles: GovernanceUserRole[]
}

export type AuditLogRecord = {
  id: string
  tenantId: string
  userId?: string | null
  action: string
  resource: string
  resourceId?: string | null
  metadata?: unknown
  severity: string
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
  createdAt: string
  user?: {
    id: string
    email: string
    name: string
  } | null
}

export type GovernanceBuFilter = "todas" | "corretora-avila" | "avila-imoveis"
