import { apiClient } from "@/lib/data-access/api-client"

import type { GovernanceUser } from "./types"

const USERS_PATH = "/api/users"

export async function fetchUsers(): Promise<GovernanceUser[]> {
  return apiClient.get<GovernanceUser[]>(USERS_PATH)
}

export async function fetchUser(id: string): Promise<GovernanceUser> {
  return apiClient.get<GovernanceUser>(`${USERS_PATH}/${id}`)
}
