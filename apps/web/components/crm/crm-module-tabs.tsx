"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

import { crmNavItems, isCrmNavActive } from "@/lib/crm-nav"
import { crmSpring } from "@/lib/crm/crm-motion"
import { cn } from "@/lib/utils"

export function CrmModuleTabs() {
  const pathname = usePathname()

  return (
    <nav
      className="crm-chrome__tabs flex min-h-9 w-full min-w-0 items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Navegação do CRM"
    >
      {crmNavItems.map((item) => {
        const active = isCrmNavActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            scroll={false}
            className={cn(
              "relative isolate flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium leading-none transition-colors",
              active
                ? "text-foreground"
                : "text-foreground/60 hover:bg-white/[0.05] hover:text-foreground/90",
            )}
          >
            {active ? (
              <motion.span
                layoutId="crm-nav-indicator"
                className="absolute inset-0 -z-10 rounded-md border border-primary/35 bg-primary/14"
                transition={crmSpring.snappy}
              />
            ) : null}
            <item.icon
              className={cn(
                "relative z-0 size-4 shrink-0",
                active ? "text-primary" : "text-foreground/55",
              )}
              strokeWidth={active ? 2 : 1.5}
            />
            <span className="relative z-0 whitespace-nowrap">{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
