import {
  GOVERNANCE_PERMISSION_CATALOG,
  GOVERNANCE_ROLE_PROFILES,
  getGovernanceRoleProfile,
  type GovernanceRoleProfile,
} from "@repo/auth"

import type { Permission } from "@repo/auth"

import type { RoleWithPermissions } from "@/lib/data-access/modules/governance"

export type MergedRoleProfile = GovernanceRoleProfile & {
  source: "live" | "catalog" | "merged"
  liveId?: string
  permissionKeys: string[]
}

export function mergeRoleProfiles(
  liveRoles: RoleWithPermissions[] | undefined,
): MergedRoleProfile[] {
  const liveBySlug = new Map(
    (liveRoles ?? []).map((role) => [role.slug, role]),
  )
  const seen = new Set<string>()
  const merged: MergedRoleProfile[] = []

  for (const catalog of GOVERNANCE_ROLE_PROFILES) {
    const live = liveBySlug.get(catalog.slug)
    seen.add(catalog.slug)
    if (live) {
      merged.push({
        ...catalog,
        name: live.name,
        description: live.description ?? catalog.description,
        dataScope: (live.defaultDataScope as GovernanceRoleProfile["dataScope"]) ?? catalog.dataScope,
        source: "merged",
        liveId: live.id,
        permissionKeys: live.rolePermissions.map((rp) => rp.permission.key),
        planned: false,
      })
      continue
    }
    merged.push({
      ...catalog,
      source: catalog.planned ? "catalog" : "catalog",
      permissionKeys: [...catalog.permissions],
    })
  }

  for (const live of liveRoles ?? []) {
    if (seen.has(live.slug)) continue
    const fallback = getGovernanceRoleProfile(live.slug)
    merged.push({
      slug: live.slug,
      name: live.name,
      description: live.description ?? fallback?.description ?? live.slug,
      dataScope:
        (live.defaultDataScope as GovernanceRoleProfile["dataScope"]) ??
        fallback?.dataScope ??
        "tenant",
      businessUnitScope: fallback?.businessUnitScope ?? "ambas",
      permissions: live.rolePermissions.map(
        (rp) => rp.permission.key,
      ) as Permission[],
      permissionKeys: live.rolePermissions.map((rp) => rp.permission.key),
      legacy: live.slug === "sales" || live.slug === "viewer",
      source: "live",
      liveId: live.id,
    })
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
}

export function filterRolesByBusinessUnit(
  roles: MergedRoleProfile[],
  filter: "todas" | "corretora-avila" | "avila-imoveis",
): MergedRoleProfile[] {
  if (filter === "todas") return roles
  return roles.filter((role) => {
    if (role.businessUnitScope === "ambas") return true
    if (filter === "corretora-avila") {
      return role.businessUnitScope === "corretora-avila"
    }
    return role.businessUnitScope === "avila-imoveis"
  })
}

export function roleHasPermission(role: MergedRoleProfile, key: string): boolean {
  return role.permissionKeys.includes(key)
}

export const MATRIX_PERMISSION_ROWS = GOVERNANCE_PERMISSION_CATALOG
