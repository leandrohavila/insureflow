"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { ChevronDown, LogOut } from "lucide-react"

import type { SessionPayload } from "@repo/auth"
import { RoleBadge } from "@/components/auth/role-badge"
import { WorkspaceSearchTrigger } from "@/components/crm/workspace-search"
import { AppNotifications } from "@/components/dashboard/app-notifications"
import { BusinessUnitSwitcher } from "@/components/dashboard/business-unit-switcher"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { dashboardTopbarClassName } from "@/lib/layout/operational-shell"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type AppTopbarProps = {
  session: SessionPayload
}

export function AppTopbar({ session }: AppTopbarProps) {
  const router = useRouter()
  const reduce = useReducedMotion()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className={dashboardTopbarClassName()}
    >
      <SidebarTrigger
        className="-ml-0.5 shrink-0 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
        aria-label="Alternar menu"
      />

      <div className="w-[min(180px,28vw)] min-w-[7.5rem] shrink-0 sm:w-[160px] lg:w-[180px]">
        <BusinessUnitSwitcher />
      </div>

      <div className="min-w-0 flex-1">
        <WorkspaceSearchTrigger className="relative w-full min-w-0 max-w-[520px]" />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <AppNotifications />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-white/[0.08] bg-transparent px-1.5 text-[13px] font-medium outline-none",
              "transition-colors duration-150 hover:border-white/[0.14] hover:bg-white/[0.04]",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
              "md:pr-2.5",
            )}
          >
            <Avatar className="size-7 border border-white/10">
              <AvatarFallback className="bg-white/[0.06] text-[10px] font-semibold text-foreground">
                {session.initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[88px] truncate tracking-[-0.02em] lg:inline">
              {session.name}
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" strokeWidth={1.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="glass-panel w-56 border-white/[0.08] p-1"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="space-y-1 text-xs font-normal">
                <p className="font-medium text-foreground">{session.name}</p>
                <p className="text-muted-foreground">{session.email}</p>
                <RoleBadge role={session.role} label={session.roleLabel} />
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem className="cursor-pointer rounded-lg" render={(props) => <Link href="/configuracoes" {...props} />}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg">Suporte</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer rounded-lg gap-2"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-3.5" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
