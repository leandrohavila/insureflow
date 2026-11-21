"use client"

import { useLayoutEffect } from "react"
import { motion, useReducedMotion } from "framer-motion"

import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { AppTopbar } from "@/components/dashboard/app-topbar"
import { BusinessUnitPreloader } from "@/components/dashboard/business-unit-preloader"
import { SessionProvider } from "@/components/auth/session-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { SessionPayload } from "@repo/auth"
import { isCrmCanvasPath } from "@/lib/layout/crm-canvas"
import {
  DASHBOARD_INSET_FRAME,
  DASHBOARD_MAIN_SLOT,
} from "@/lib/layout/operational-shell"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type DashboardShellProps = {
  children: React.ReactNode
  session: SessionPayload
}

export function DashboardShell({ children, session }: DashboardShellProps) {
  const reduce = useReducedMotion()
  const pathname = usePathname()
  const crmCanvas = isCrmCanvasPath(pathname ?? "")

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.add("avila-nav-chrome")
    root.classList.remove("avila-crm-chrome")
    return () => root.classList.remove("avila-nav-chrome")
  }, [])

  return (
    <SessionProvider initialSession={session}>
      <BusinessUnitPreloader />
      <SidebarProvider defaultOpen>
        <AppSidebar session={session} />
        <SidebarInset className={`insure-main-surface ${DASHBOARD_INSET_FRAME}`}>
          <motion.div
            className="relative z-[1] flex min-h-0 flex-1 flex-col"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: easeOut }}
          >
            <AppTopbar session={session} />
            <motion.div
              className={cn(
                DASHBOARD_MAIN_SLOT,
                crmCanvas && "avila-crm-canvas",
              )}
            >
              {children}
            </motion.div>
          </motion.div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}
