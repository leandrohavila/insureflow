"use client"

import { motion, useReducedMotion } from "framer-motion"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { AppTopbar } from "@/components/dashboard/app-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { SessionPayload } from "@repo/auth"
import { easeOut } from "@/lib/motion"

type DashboardShellProps = {
  children: React.ReactNode
  session: SessionPayload
}

export function DashboardShell({ children, session }: DashboardShellProps) {
  const reduce = useReducedMotion()

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar session={session} />
      <SidebarInset className="insure-main-surface relative min-h-svh overflow-x-hidden">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: easeOut }}
        >
          <motion.div
            className="absolute -left-1/4 top-0 size-[500px] rounded-full bg-primary/10 blur-[100px]"
            animate={
              reduce
                ? undefined
                : {
                    x: [0, 40, 0],
                    y: [0, 20, 0],
                    opacity: [0.35, 0.5, 0.35],
                  }
            }
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-1/4 top-1/3 size-[400px] rounded-full bg-chart-2/8 blur-[90px]"
            animate={
              reduce
                ? undefined
                : {
                    x: [0, -30, 0],
                    opacity: [0.2, 0.35, 0.2],
                  }
            }
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        <motion.div
          className="relative flex min-h-svh flex-col"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: easeOut }}
        >
          <AppTopbar session={session} />
          <motion.div className="flex flex-1 flex-col">{children}</motion.div>
        </motion.div>
      </SidebarInset>
    </SidebarProvider>
  )
}
