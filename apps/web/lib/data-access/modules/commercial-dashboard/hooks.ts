"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import { fetchCommercialDashboard } from "./api"
import type { CommercialDashboardFilters } from "./types"

export function useCommercialDashboard(
  filters: CommercialDashboardFilters = {},
) {
  return useQuery({
    queryKey: queryKeys.commercialDashboard.list(filters),
    queryFn: () => fetchCommercialDashboard(filters),
  })
}
