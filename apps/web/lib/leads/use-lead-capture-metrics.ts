"use client"

import { useMemo } from "react"

import {
  resolveInsuranceBusinessUnitId,
  resolveRealEstateBusinessUnitId,
} from "@/lib/business-units/nav-context"
import { useBusinessUnitContext } from "@/lib/data-access/modules/business-units"
import { useCustomers } from "@/lib/data-access/modules/customers"
import { useLeads } from "@/lib/data-access/modules/leads"

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

  const totalsQuery = useLeads(COUNT_FILTER, { enabled })
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

  const metrics = useMemo(
    () =>
      computeLeadCaptureMetrics({
        total: totalsQuery.data?.meta.total ?? 0,
        insurance: insuranceQuery.data?.meta.total ?? 0,
        realEstate: realEstateQuery.data?.meta.total ?? 0,
        customersInsurance: insuranceCustomers.data?.meta.total ?? 0,
        customersRealEstate: realEstateCustomers.data?.meta.total ?? 0,
        counts: totalsQuery.data?.meta.counts,
        insuranceCounts: insuranceQuery.data?.meta.counts,
        realEstateCounts: realEstateQuery.data?.meta.counts,
      }),
    [
      insuranceCustomers.data?.meta.total,
      insuranceQuery.data?.meta.counts,
      insuranceQuery.data?.meta.total,
      realEstateCustomers.data?.meta.total,
      realEstateQuery.data?.meta.counts,
      realEstateQuery.data?.meta.total,
      totalsQuery.data?.meta.counts,
      totalsQuery.data?.meta.total,
    ],
  )

  const waitingForUnits = enabled && context.isLoading && !context.data
  const isLoading =
    waitingForUnits ||
    (enabled && totalsQuery.isLoading) ||
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
