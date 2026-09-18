"use client"

import { motion, useReducedMotion } from "framer-motion"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { AppTopbar } from "@/components/dashboard/app-topbar"
import { BusinessUnitPreloader } from "@/components/dashboard/business-unit-preloader"
import { SessionProvider } from "@/components/auth/session-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { SessionPayload } from "@repo/auth"
import {
  DASHBOARD_INSET_FRAME,
  DASHBOARD_MAIN_SLOT,
} from "@/lib/layout/operational-shell"
import { easeOut } from "@/lib/motion"

type DashboardShellProps = {
  children: React.ReactNode
  session: SessionPayload
}

export function DashboardShell({ children, session }: DashboardShellProps) {
  const reduce = useReducedMotion()

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
            <motion.div className={DASHBOARD_MAIN_SLOT}>{children}</motion.div>
          </motion.div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}
