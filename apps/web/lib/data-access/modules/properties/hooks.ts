"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/data-access/query-keys"
import { useRealEstateBusinessUnitId } from "@/lib/real-estate/use-real-estate-business-unit"

import {
  createProperty,
  deleteProperty,
  deletePropertyImage,
  fetchAllPropertyLeads,
  fetchPersons,
  fetchProperties,
  fetchProperty,
  fetchRealEstateDashboardStats,
  publishProperty,
  reorderPropertyImages,
  setPropertyCoverImage,
  unpublishProperty,
  updateProperty,
  uploadPropertyImages,
} from "./api"
import type {
  CreatePropertyInput,
  PropertyListFilters,
  UpdatePropertyInput,
} from "./types"

export function useProperties(filters: PropertyListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.properties.list(filters),
    queryFn: () => fetchProperties(filters),
  })
}

export function useProperty(id: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.properties.detail(id ?? ""),
    queryFn: () => fetchProperty(id!),
    enabled: Boolean(id),
  })
}

export function usePropertyLeadsInbox() {
  const businessUnitId = useRealEstateBusinessUnitId()
  return useQuery({
    queryKey: queryKeys.properties.leads(businessUnitId ?? undefined),
    queryFn: () => fetchAllPropertyLeads(businessUnitId ?? undefined),
  })
}

export function useRealEstateDashboardStats(businessUnitId?: string | null) {
  return useQuery({
    queryKey: queryKeys.properties.dashboardStats({ businessUnitId }),
    queryFn: () =>
      fetchRealEstateDashboardStats(businessUnitId ?? undefined),
  })
}

export function usePersons(search?: string) {
  return useQuery({
    queryKey: queryKeys.properties.persons(search),
    queryFn: () => fetchPersons(search),
  })
}

function invalidatePropertyQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.properties.all }),
  ])
}

export function useCreateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePropertyInput) => createProperty(input),
    onSettled: () => invalidatePropertyQueries(queryClient),
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePropertyInput }) =>
      updateProperty(id, input),
    onSettled: () => invalidatePropertyQueries(queryClient),
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSettled: () => invalidatePropertyQueries(queryClient),
  })
}

export function usePublishProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => publishProperty(id),
    onSettled: () => invalidatePropertyQueries(queryClient),
  })
}

export function useUnpublishProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => unpublishProperty(id),
    onSettled: () => invalidatePropertyQueries(queryClient),
  })
}

export function useUploadPropertyImages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      uploadPropertyImages(id, files),
    onSettled: () => invalidatePropertyQueries(queryClient),
  })
}

export function useReorderPropertyImages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, imageIds }: { id: string; imageIds: string[] }) =>
      reorderPropertyImages(id, imageIds),
    onSettled: () => invalidatePropertyQueries(queryClient),
  })
}

export function useSetPropertyCoverImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      propertyId,
      imageId,
    }: {
      propertyId: string
      imageId: string
    }) => setPropertyCoverImage(propertyId, imageId),
    onSettled: () => invalidatePropertyQueries(queryClient),
  })
}

export function useDeletePropertyImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      propertyId,
      imageId,
    }: {
      propertyId: string
      imageId: string
    }) => deletePropertyImage(propertyId, imageId),
    onSettled: () => invalidatePropertyQueries(queryClient),
  })
}
