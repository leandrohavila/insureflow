"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const SETTINGS_LINKS = [
  { href: "/configuracoes/governanca", label: "Governança" },
  { href: "/configuracoes/comunicacao", label: "Comunicação" },
  { href: "/configuracoes/crm/motivos-perda", label: "Motivos de perda" },
]

export function SettingsSubnav({
  items,
}: {
  items: { href: string; label: string }[]
}) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active =
          item.href === "/configuracoes/governanca"
            ? pathname.startsWith("/configuracoes/governanca")
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

export function SettingsNav() {
  return <SettingsSubnav items={SETTINGS_LINKS} />
}

export { AutomationNav } from "./settings-subnav-automation"
