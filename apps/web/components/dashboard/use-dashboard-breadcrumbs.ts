"use client"

import { usePathname } from "next/navigation"

import { getNavTitle } from "@/lib/navigation"

const REAL_ESTATE_LABELS: Record<string, string> = {
  properties: "Imóveis",
  leads: "Leads Imobiliários",
  owners: "Proprietários",
  visits: "Visitas",
  portal: "Portal",
}

export function useDashboardBreadcrumbs(): { label: string; href?: string }[] {
  const pathname = usePathname()
  const parts = pathname.split("/").filter(Boolean)
  const segment = parts[0] ?? ""

  const base = [{ label: "Grupo Ávila", href: "/" }]

  if (!segment) {
    return [...base, { label: "Dashboard" }]
  }

  if (segment === "real-estate") {
    const sub = parts[1] ?? ""
    const crumbs = [...base, { label: "Imobiliário", href: "/real-estate/properties" }]
    if (sub) {
      crumbs.push({
        label: REAL_ESTATE_LABELS[sub] ?? sub,
        href: `/real-estate/${sub}`,
      })
    }
    return crumbs
  }

  const title = getNavTitle(segment)
  return [...base, { label: title ?? "Página", href: `/${segment}` }]
}
