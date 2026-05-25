"use client"

import { useQuery } from "@tanstack/react-query"
import type { SessionPayload } from "@repo/auth"

import { queryKeys } from "@/lib/data-access/query-keys"

import { fetchCurrentSession } from "./api"

type UseSessionQueryOptions = {
  initialSession?: SessionPayload
}

export function useSessionQuery(options: UseSessionQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.session.current,
    queryFn: fetchCurrentSession,
    initialData: options.initialSession,
  })
}
