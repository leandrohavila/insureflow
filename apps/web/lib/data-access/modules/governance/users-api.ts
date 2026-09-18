import { apiClient } from "@/lib/data-access/api-client"

import type {
  AssignableRole,
  CreateUserInput,
  GovernanceUser,
  UpdateUserInput,
} from "./types"

const USERS_PATH = "/api/users"

export async function fetchUsers(): Promise<GovernanceUser[]> {
  return apiClient.get<GovernanceUser[]>(USERS_PATH)
}

export async function fetchUser(id: string): Promise<GovernanceUser> {
  return apiClient.get<GovernanceUser>(`${USERS_PATH}/${id}`)
}

export async function fetchAssignableRoles(): Promise<AssignableRole[]> {
  const response = await apiClient.get<{ data: AssignableRole[] }>(
    `${USERS_PATH}/assignable-roles`,
  )
  return response.data ?? []
}

export async function createUser(input: CreateUserInput): Promise<GovernanceUser> {
  return apiClient.post<GovernanceUser>(USERS_PATH, input)
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<GovernanceUser> {
  return apiClient.patch<GovernanceUser>(`${USERS_PATH}/${id}`, input)
}

export async function setUserStatus(
  id: string,
  isActive: boolean,
): Promise<GovernanceUser> {
  return apiClient.patch<GovernanceUser>(`${USERS_PATH}/${id}/status`, {
    isActive,
  })
}

export async function changeUserPassword(
  id: string,
  password: string,
): Promise<{ ok: boolean }> {
  return apiClient.patch<{ ok: boolean }>(`${USERS_PATH}/${id}/password`, {
    password,
  })
}

export async function setUserRoles(
  id: string,
  roleIds: string[],
): Promise<GovernanceUser> {
  return apiClient.put<GovernanceUser>(`${USERS_PATH}/${id}/roles`, { roleIds })
}

export async function setUserBusinessUnits(
  id: string,
  input: { businessUnitIds: string[]; primaryBusinessUnitId?: string | null },
): Promise<GovernanceUser> {
  return apiClient.put<GovernanceUser>(
    `${USERS_PATH}/${id}/business-units`,
    input,
  )
}
