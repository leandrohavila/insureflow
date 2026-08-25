"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const GOVERNANCE_LINKS = [
  { href: "/configuracoes/governanca", label: "Visão Geral", exact: true },
  { href: "/configuracoes/governanca/perfis", label: "Perfis" },
  { href: "/configuracoes/governanca/matriz", label: "Matriz de Permissões" },
  { href: "/configuracoes/governanca/usuarios", label: "Usuários" },
  { href: "/configuracoes/governanca/empresas", label: "Empresas" },
  { href: "/configuracoes/governanca/auditoria", label: "Auditoria" },
] as const

export function GovernanceSubnav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2">
      {GOVERNANCE_LINKS.map((item) => {
        const active =
          "exact" in item && item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-primary/40 bg-primary/12 text-primary"
                : "border-white/[0.08] text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
