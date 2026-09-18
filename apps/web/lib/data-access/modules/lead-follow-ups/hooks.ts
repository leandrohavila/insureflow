"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"

import { fetchLeadFollowUps, updateLeadFollowUp } from "./api"
import type {
  LeadFollowUpWindow,
  UpdateLeadFollowUpInput,
} from "./types"

export function useLeadFollowUps(filters: {
  window?: LeadFollowUpWindow
  assignedUserId?: string
  businessUnitId?: string
} = {}) {
  return useQuery({
    queryKey: queryKeys.leadFollowUps.list(filters),
    queryFn: () => fetchLeadFollowUps(filters),
  })
}

export function useUpdateLeadFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateLeadFollowUpInput
    }) => updateLeadFollowUp(id, input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.leadFollowUps.all }),
  })
}
