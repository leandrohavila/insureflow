import { apiClient } from "@/lib/data-access/api-client"

import type { AuditLogRecord } from "./types"

const AUDIT_PATH = "/api/audit-logs"

export type AuditLogsQuery = {
  take?: number
  skip?: number
}

export async function fetchAuditLogs(
  query: AuditLogsQuery = {},
): Promise<AuditLogRecord[]> {
  const params = new URLSearchParams()
  if (query.take != null) params.set("take", String(query.take))
  if (query.skip != null) params.set("skip", String(query.skip))
  const search = params.toString()
  return apiClient.get<AuditLogRecord[]>(
    search ? `${AUDIT_PATH}?${search}` : AUDIT_PATH,
  )
}
