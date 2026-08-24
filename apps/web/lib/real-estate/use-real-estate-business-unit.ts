"use client"

import { useMemo } from "react"

import { resolveRealEstateBusinessUnitId } from "@/lib/business-units/nav-context"
import { useBusinessUnitContext } from "@/lib/data-access/modules/business-units"

export function useRealEstateBusinessUnitId() {
  const context = useBusinessUnitContext()
  return useMemo(
    () => resolveRealEstateBusinessUnitId(context.data),
    [context.data],
  )
}
