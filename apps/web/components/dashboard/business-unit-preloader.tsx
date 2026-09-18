"use client"

import { useBusinessUnitContext, useBusinessUnits } from "@/lib/data-access/modules/business-units"

/** Warm React Query cache so CRM and Imobiliário share the same BU payload. */
export function BusinessUnitPreloader() {
  useBusinessUnits()
  useBusinessUnitContext()
  return null
}
