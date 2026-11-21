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
    <div className="flex w-fit rounded-lg border border-[#e4ddd2] bg-[var(--avila-paper)] p-0.5 shadow-[0_1px_2px_rgb(16_41_75/0.04)]">
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
