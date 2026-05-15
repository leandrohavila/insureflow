"use client"

import { usePathname } from "next/navigation"

import { getNavTitle } from "@/lib/navigation"

export function useDashboardBreadcrumbs(): { label: string; href?: string }[] {
  const pathname = usePathname()
  const segment = pathname.split("/").filter(Boolean)[0] ?? ""

  const base = [{ label: "InsureFlow", href: "/" }]

  if (!segment) {
    return [...base, { label: "Dashboard" }]
  }

  const title = getNavTitle(segment)
  return [...base, { label: title ?? "Página", href: `/${segment}` }]
}
