import { apiClient } from "@/lib/data-access/api-client"

import type { PermissionRecord, RoleWithPermissions } from "./types"

const PERMISSIONS_PATH = "/api/permissions"

export async function fetchPermissions(): Promise<PermissionRecord[]> {
  return apiClient.get<PermissionRecord[]>(PERMISSIONS_PATH)
}

export async function fetchRolesWithPermissions(): Promise<RoleWithPermissions[]> {
  return apiClient.get<RoleWithPermissions[]>(`${PERMISSIONS_PATH}/roles`)
}
