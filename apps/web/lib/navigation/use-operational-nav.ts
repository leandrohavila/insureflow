"use client"

import { useMemo } from "react"

import type { SessionPayload } from "@repo/auth"
import { isRealEstateContext } from "@/lib/business-units/nav-context"
import { useBusinessUnitContext } from "@/lib/data-access/modules/business-units"
import {
  filterNavBySession,
  mainNav,
  realEstateNav,
  type NavItem,
} from "@/lib/navigation"

export function useOperationalNav(session: SessionPayload): NavItem[] {
  const context = useBusinessUnitContext()
  const realEstate = isRealEstateContext(context.data)

  return useMemo(() => {
    const items = realEstate ? realEstateNav : mainNav
    return filterNavBySession(items, session)
  }, [realEstate, session])
}
