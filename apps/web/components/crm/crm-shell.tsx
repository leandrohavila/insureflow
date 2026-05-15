"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"

import { crmNavItems, isCrmNavActive } from "@/lib/crm-nav"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type CrmShellProps = {
  children: React.ReactNode
}

export function CrmShell({ children }: CrmShellProps) {
  const pathname = usePathname()
  const reduce = useReducedMotion()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
        className="sticky top-14 z-10 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl md:top-16"
      >
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              InsureFlow
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-medium text-foreground">CRM</span>
          </div>
          <nav
            className="-mx-1 flex gap-0.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Módulo CRM"
          >
            {crmNavItems.map((item) => {
              const active = isCrmNavActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="crm-nav-indicator"
                      className="absolute inset-0 rounded-lg border border-primary/20 bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <item.icon
                    className={cn("relative size-4", active && "text-primary")}
                    strokeWidth={active ? 2 : 1.5}
                  />
                  <span className="relative">{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </motion.div>
      <div className="mx-auto w-full max-w-[1600px] flex-1">{children}</div>
    </div>
  )
}
