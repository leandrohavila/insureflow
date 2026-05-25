import type { SessionPayload } from "@repo/auth"

import { apiClient } from "@/lib/data-access/api-client"

export function fetchCurrentSession() {
  return apiClient.get<SessionPayload>("/api/auth/me")
}
