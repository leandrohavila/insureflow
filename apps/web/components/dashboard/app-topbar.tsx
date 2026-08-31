"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Bell, ChevronDown, LogOut, Sparkles } from "lucide-react"

import type { SessionPayload } from "@repo/auth"
import { RoleBadge } from "@/components/auth/role-badge"
import { WorkspaceSearchTrigger } from "@/components/crm/workspace-search"
import { BusinessUnitSwitcher } from "@/components/dashboard/business-unit-switcher"

import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
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

      <div className="min-w-[140px] max-w-[240px] w-[160px] shrink-0 sm:w-[200px] lg:w-[220px]">
        <BusinessUnitSwitcher />
      </div>

      <div className="order-last min-w-[180px] max-w-[640px] flex-1 basis-full lg:order-none lg:basis-0">
        <WorkspaceSearchTrigger className="relative w-full min-w-0" />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.35, ease: easeOut }}
        className="ml-auto flex shrink-0 items-center gap-1"
      >
        <motion.div whileTap={reduce ? undefined : { scale: 0.92 }}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Notificações"
          >
            <Bell className="size-4" strokeWidth={1.5} />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.3 }}
            >
              <Badge className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center border-2 border-background bg-[#C09048] px-0.5 text-[10px] font-bold leading-none text-[#000C24] shadow-md">
                3
              </Badge>
            </motion.span>
          </Button>
        </motion.div>

        <Button
          variant="ghost"
          size="sm"
          className="hidden shrink-0 gap-1.5 text-[13px] text-muted-foreground hover:text-foreground lg:inline-flex"
        >
          <Sparkles className="size-3.5 text-[#DEAE5D]" strokeWidth={1.5} />
          IA
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 text-[13px] font-medium outline-none",
              "transition-all duration-200 hover:border-[#C09048]/30 hover:bg-white/[0.06]",
              "focus-visible:border-[#C09048]/40 focus-visible:ring-[3px] focus-visible:ring-[#C09048]/20",
              "md:pr-3",
            )}
          >
            <Avatar className="size-8 border border-white/10 shadow-md">
              <AvatarFallback className="bg-[#10294B] text-[11px] font-semibold text-[#DEAE5D]">
                {session.initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[100px] truncate tracking-[-0.02em] md:inline">
              {session.name}
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" strokeWidth={1.5} />
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
      </motion.div>
    </motion.header>
  )
}
