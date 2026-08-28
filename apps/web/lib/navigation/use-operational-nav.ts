"use client"

import { useMemo } from "react"

import type { SessionPayload } from "@repo/auth"
import { isRealEstateContext } from "@/lib/business-units/nav-context"
import { useBusinessUnitContext } from "@/lib/data-access/modules/business-units"
import { resolveOperationalNav, type NavGroup } from "@/lib/navigation"

export function useOperationalNav(session: SessionPayload): NavGroup[] {
  const context = useBusinessUnitContext()
  const realEstate = isRealEstateContext(context.data)

  return useMemo(
    () => resolveOperationalNav(session, realEstate),
    [realEstate, session],
  )
}
