"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const tabs = [
  { href: "/questionarios/templates", label: "Templates" },
  { href: "/questionarios/respostas", label: "Respostas" },
] as const

export function QuestionnaireNavTabs() {
  const pathname = usePathname()

  return (
    <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
