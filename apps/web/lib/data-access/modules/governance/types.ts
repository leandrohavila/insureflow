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

export type GovernanceUserBusinessUnit = {
  businessUnitId: string
  createdAt: string
  businessUnit: {
    id: string
    name: string
    slug: string
    type: string
    isActive: boolean
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
  updatedAt?: string
  currentBusinessUnitId?: string | null
  userRoles: GovernanceUserRole[]
  businessUnits?: GovernanceUserBusinessUnit[]
}

export type AssignableRole = {
  id: string
  name: string
  slug: string
  description?: string | null
  isSystem: boolean
  defaultDataScope: string
}

export type CreateUserInput = {
  email: string
  password: string
  name: string
  title?: string
  roleIds: string[]
  businessUnitIds: string[]
  primaryBusinessUnitId?: string
}

export type UpdateUserInput = {
  email?: string
  name?: string
  title?: string
  initials?: string
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
