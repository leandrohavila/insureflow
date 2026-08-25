"use client"

import { SettingsSubnav } from "./settings-subnav"

const AUTOMATION_LINKS = [
  { href: "/automacao", label: "Visão geral" },
  { href: "/automacao/reativacao", label: "Reativação" },
  { href: "/automacao/comunicacao", label: "Comunicação" },
  { href: "/automacao/templates", label: "Templates" },
  { href: "/automacao/cross-sell", label: "Cross-sell" },
]

export function AutomationNav() {
  return <SettingsSubnav items={AUTOMATION_LINKS} />
}
