"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  patchListItem,
  removeListItem,
  rollbackQuery,
  snapshotQuery,
  upsertListItem,
  type OptimisticSnapshot,
} from "@/lib/data-access/optimistic"
import { queryKeys } from "@/lib/data-access/query-keys"

import {
  createCustomer,
  deleteCustomer,
  fetchCustomer,
  fetchCustomers,
  updateCustomer,
} from "./api"
import type {
  Customer,
  CustomerListFilters,
  CustomerListResponse,
  UpdateCustomerInput,
} from "./types"

export function useCustomers(filters: CustomerListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.customers.list(filters),
    queryFn: () => fetchCustomers(filters),
  })
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: id
      ? queryKeys.customers.detail(id)
      : queryKeys.customers.details(),
    queryFn: () => fetchCustomer(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      queryClient.setQueryData<Customer>(
        queryKeys.customers.detail(customer.id),
        customer,
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
    },
  })
}

export function useUpdateCustomer(filters: CustomerListFilters = {}) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.customers.list(filters)

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      updateCustomer(id, input),
    onMutate: async ({ id, input }) => {
      const snapshot = await snapshotQuery<CustomerListResponse>(
        queryClient,
        listKey,
      )
      queryClient.setQueryData<CustomerListResponse>(listKey, (current) => {
        if (!current) return current
        return {
          ...current,
          data:
            patchListItem(current.data, id, input as Partial<Customer>) ??
            current.data,
        }
      })
      return snapshot
    },
    onError: (_error, _variables, snapshot) => {
      rollbackQuery(
        queryClient,
        snapshot as OptimisticSnapshot<CustomerListResponse> | undefined,
      )
    },
    onSuccess: (customer) => {
      queryClient.setQueryData<CustomerListResponse>(listKey, (current) => {
        if (!current) return current
        return { ...current, data: upsertListItem(current.data, customer) }
      })
      queryClient.setQueryData<Customer>(
        queryKeys.customers.detail(customer.id),
        customer,
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
    },
  })
}

export function useDeleteCustomer(filters: CustomerListFilters = {}) {
  const queryClient = useQueryClient()
  const listKey = queryKeys.customers.list(filters)

  return useMutation({
    mutationFn: deleteCustomer,
    onMutate: async (id) => {
      const snapshot = await snapshotQuery<CustomerListResponse>(
        queryClient,
        listKey,
      )
      queryClient.setQueryData<CustomerListResponse>(listKey, (current) => {
        if (!current) return current
        return {
          ...current,
          data: removeListItem(current.data, id) ?? current.data,
          meta: { ...current.meta, total: Math.max(0, current.meta.total - 1) },
        }
      })
      return snapshot
    },
    onError: (_error, _variables, snapshot) => {
      rollbackQuery(
        queryClient,
        snapshot as OptimisticSnapshot<CustomerListResponse> | undefined,
      )
    },
    onSettled: (_result, _error, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
    },
  })
}
