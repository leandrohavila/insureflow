"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  resolveInsuranceBusinessUnitId,
  resolveRealEstateBusinessUnitId,
} from "@/lib/business-units/nav-context"
import { fetchCommercialAgenda } from "@/lib/data-access/modules/commercial-agenda/api"
import { useBusinessUnitContext } from "@/lib/data-access/modules/business-units"
import { useCustomers } from "@/lib/data-access/modules/customers"
import { useLeads } from "@/lib/data-access/modules/leads"
import { queryKeys } from "@/lib/data-access/query-keys"

import {
  computeLeadCaptureMetrics,
  type LeadCaptureMetrics,
} from "./lead-capture-metrics"

const COUNT_FILTER = { page: 1, limit: 1 } as const

export function useLeadCaptureMetrics(options?: { enabled?: boolean }): {
  metrics: LeadCaptureMetrics
  isLoading: boolean
  insuranceBusinessUnitId: string | null
  realEstateBusinessUnitId: string | null
} {
  const enabled = options?.enabled ?? true
  const context = useBusinessUnitContext()
  const insuranceBusinessUnitId = useMemo(
    () => resolveInsuranceBusinessUnitId(context.data),
    [context.data],
  )
  const realEstateBusinessUnitId = useMemo(
    () => resolveRealEstateBusinessUnitId(context.data),
    [context.data],
  )

  const insuranceQuery = useLeads(
    { ...COUNT_FILTER, businessUnitId: insuranceBusinessUnitId ?? undefined },
    { enabled: enabled && Boolean(insuranceBusinessUnitId) },
  )
  const realEstateQuery = useLeads(
    { ...COUNT_FILTER, businessUnitId: realEstateBusinessUnitId ?? undefined },
    { enabled: enabled && Boolean(realEstateBusinessUnitId) },
  )
  const insuranceCustomers = useCustomers(
    { ...COUNT_FILTER, businessUnitId: insuranceBusinessUnitId ?? undefined },
    { enabled: enabled && Boolean(insuranceBusinessUnitId) },
  )
  const realEstateCustomers = useCustomers(
    { ...COUNT_FILTER, businessUnitId: realEstateBusinessUnitId ?? undefined },
    { enabled: enabled && Boolean(realEstateBusinessUnitId) },
  )
  const agendaQuery = useQuery({
    queryKey: queryKeys.commercialAgenda.list({ window: "today" }),
    queryFn: () => fetchCommercialAgenda({ window: "today" }),
    enabled,
    staleTime: 60_000,
  })

  const metrics = useMemo(
    () => ({
      ...computeLeadCaptureMetrics({
        total: 0,
        insurance: insuranceQuery.data?.meta.total ?? 0,
        realEstate: realEstateQuery.data?.meta.total ?? 0,
        customersInsurance: insuranceCustomers.data?.meta.total ?? 0,
        customersRealEstate: realEstateCustomers.data?.meta.total ?? 0,
        insuranceCounts: insuranceQuery.data?.meta.counts,
        realEstateCounts: realEstateQuery.data?.meta.counts,
      }),
      followUps: agendaQuery.data?.metrics.followUpsPending ?? 0,
    }),
    [
      agendaQuery.data?.metrics.followUpsPending,
      insuranceCustomers.data?.meta.total,
      insuranceQuery.data?.meta.counts,
      insuranceQuery.data?.meta.total,
      realEstateCustomers.data?.meta.total,
      realEstateQuery.data?.meta.counts,
      realEstateQuery.data?.meta.total,
    ],
  )

  const waitingForUnits = enabled && context.isLoading && !context.data
  const isLoading =
    waitingForUnits ||
    (enabled && Boolean(insuranceBusinessUnitId) && insuranceQuery.isLoading) ||
    (enabled && Boolean(realEstateBusinessUnitId) && realEstateQuery.isLoading) ||
    (enabled && Boolean(insuranceBusinessUnitId) && insuranceCustomers.isLoading) ||
    (enabled &&
      Boolean(realEstateBusinessUnitId) &&
      realEstateCustomers.isLoading)

  return {
    metrics,
    isLoading,
    insuranceBusinessUnitId,
    realEstateBusinessUnitId,
  }
}
