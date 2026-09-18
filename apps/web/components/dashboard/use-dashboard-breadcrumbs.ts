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

const CRM_LABELS: Record<string, string> = {
  negocios: "Pipeline",
  "dashboard-360": "Customer 360",
  "customer-360": "Customer 360",
  importacoes: "Importações",
}

const GOVERNANCE_LABELS: Record<string, string> = {
  usuarios: "Usuários",
  perfis: "Perfis",
  matriz: "ACL",
  empresas: "Empresas",
  auditoria: "Auditoria",
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
    const crumbs: { label: string; href?: string }[] = [
      ...base,
      { label: "Imobiliário", href: "/real-estate/properties" },
    ]
    if (sub) {
      crumbs.push({
        label: REAL_ESTATE_LABELS[sub] ?? sub,
        href: `/real-estate/${sub}`,
      })
    }
    if (parts[2] === "new") {
      crumbs.push({ label: "Novo" })
    } else if (parts[2] && sub === "properties") {
      crumbs.push({ label: "Detalhe" })
    }
    return crumbs
  }

  if (segment === "crm") {
    const sub = parts[1] ?? ""
    const crumbs: { label: string; href?: string }[] = [
      ...base,
      { label: "CRM", href: "/crm" },
    ]
    if (sub) {
      crumbs.push({
        label: CRM_LABELS[sub] ?? getNavTitle(sub) ?? sub,
        href: `/crm/${sub}`,
      })
    }
    return crumbs
  }

  if (segment === "configuracoes") {
    const crumbs: { label: string; href?: string }[] = [
      ...base,
      { label: "Configurações", href: "/configuracoes" },
    ]
    if (parts[1] === "governanca") {
      crumbs.push({ label: "Governança", href: "/configuracoes/governanca" })
      const leaf = parts[2]
      if (leaf) {
        crumbs.push({
          label: GOVERNANCE_LABELS[leaf] ?? leaf,
          href: `/configuracoes/governanca/${leaf}`,
        })
      }
      return crumbs
    }
    if (parts[1] === "comunicacao") {
      crumbs.push({ label: "Comunicação", href: "/configuracoes/comunicacao" })
      return crumbs
    }
    if (parts[1] === "crm" && parts[2] === "motivos-perda") {
      crumbs.push({ label: "Motivos de perda", href: "/configuracoes/crm/motivos-perda" })
      return crumbs
    }
    return crumbs
  }

  const title = getNavTitle(segment)
  return [...base, { label: title ?? "Página", href: `/${segment}` }]
}
