"use client"

import { isRealEstateContext } from "@/lib/business-units/nav-context"
import { useBusinessUnitContext } from "@/lib/data-access/modules/business-units"
import { DashboardHome } from "@/components/dashboard/dashboard-home"
import { RealEstateDashboard } from "@/components/real-estate/real-estate-dashboard"

export function DashboardEntry() {
  const context = useBusinessUnitContext()
  const realEstate = isRealEstateContext(context.data)

  if (realEstate) {
    return <RealEstateDashboard />
  }

  return <DashboardHome />
}
