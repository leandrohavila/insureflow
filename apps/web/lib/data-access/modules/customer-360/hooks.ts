"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import {
  fetchCustomer360,
  fetchDashboard360,
  generateCustomer360,
} from "./api"
import type { Dashboard360Filters } from "./types"

export function useCustomer360(id: string | null) {
  return useQuery({
    queryKey: id
      ? queryKeys.customer360.detail(id)
      : queryKeys.customer360.details(),
    queryFn: () => fetchCustomer360(id as string),
    enabled: Boolean(id),
  })
}

export function useDashboard360(filters: Dashboard360Filters = {}) {
  return useQuery({
    queryKey: queryKeys.dashboard360.list(filters),
    queryFn: () => fetchDashboard360(filters),
  })
}

export function useGenerateCustomer360() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateCustomer360,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customer360.detail(id),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard360.all,
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.all,
      })
    },
  })
}
