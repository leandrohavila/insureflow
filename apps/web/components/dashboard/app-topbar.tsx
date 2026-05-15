"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Bell, ChevronDown, LogOut, Search, Sparkles } from "lucide-react"

import type { SessionPayload } from "@repo/auth"
import { RoleBadge } from "@/components/auth/role-badge"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useDashboardBreadcrumbs } from "@/components/dashboard/use-dashboard-breadcrumbs"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

type AppTopbarProps = {
  session: SessionPayload
}

export function AppTopbar({ session }: AppTopbarProps) {
  const router = useRouter()
  const breadcrumbs = useDashboardBreadcrumbs()
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
      className="glass-topbar sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 px-3 md:h-16 md:gap-4 md:px-8"
    >
      <SidebarTrigger
        className="-ml-0.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
        aria-label="Alternar menu"
      />

      <Separator
        orientation="vertical"
        className="hidden h-7 bg-gradient-to-b from-transparent via-white/10 to-transparent md:block"
      />

      <nav className="hidden min-w-0 flex-1 items-center gap-2 text-[13px] text-muted-foreground md:flex">
        {breadcrumbs.map((crumb, i) => (
          <motion.span
            key={`${crumb.label}-${i}`}
            initial={reduce ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.35, ease: easeOut }}
            className="flex items-center gap-2"
          >
            {i > 0 && (
              <span className="text-muted-foreground/30" aria-hidden>
                /
              </span>
            )}
            {crumb.href && i < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="truncate transition-colors duration-200 hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={cn(
                  i === breadcrumbs.length - 1
                    ? "truncate font-medium tracking-[-0.02em] text-foreground"
                    : "truncate"
                )}
              >
                {crumb.label}
              </span>
            )}
          </motion.span>
        ))}
      </nav>

      <motion.div
        className="relative ml-auto flex min-w-0 flex-1 transition-transform duration-200 focus-within:scale-[1.005] md:max-w-md md:flex-none lg:max-w-xl"
      >
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60"
          strokeWidth={1.5}
        />
        <Input
          type="search"
          placeholder="Buscar em todo o workspace…"
          className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-[13px] shadow-inner shadow-black/20 transition-all duration-300 placeholder:text-muted-foreground/50 focus-visible:border-primary/35 focus-visible:bg-white/[0.06] focus-visible:shadow-[0_0_0_3px_oklch(0.64_0.19_252/0.12)] md:h-10"
          aria-label="Busca global"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60 md:inline">
          ⌘K
        </kbd>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.35, ease: easeOut }}
        className="flex items-center gap-1"
      >
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 text-[13px] text-muted-foreground hover:text-foreground lg:inline-flex"
        >
          <Sparkles className="size-3.5 text-primary" strokeWidth={1.5} />
          IA
        </Button>

        <motion.div whileTap={reduce ? undefined : { scale: 0.92 }}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative text-muted-foreground hover:text-foreground"
            aria-label="Notificações"
          >
            <Bell className="size-4" strokeWidth={1.5} />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.3 }}
            >
              <Badge className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center border-2 border-background bg-primary px-0.5 text-[10px] font-bold leading-none text-primary-foreground shadow-lg shadow-primary/40">
                3
              </Badge>
            </motion.span>
          </Button>
        </motion.div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "hidden h-10 shrink-0 items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 pr-3 text-[13px] font-medium outline-none",
              "transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06]",
              "focus-visible:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-primary/20 md:inline-flex"
            )}
          >
            <Avatar className="size-8 border border-white/10 shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-primary to-[oklch(0.52_0.16_258)] text-[11px] font-semibold text-white">
                {session.initials}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[100px] truncate tracking-[-0.02em]">{session.name}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="glass-panel w-56 border-white/[0.08] p-1"
          >
            <DropdownMenuLabel className="space-y-1 text-xs font-normal">
              <p className="font-medium text-foreground">{session.name}</p>
              <p className="text-muted-foreground">{session.email}</p>
              <RoleBadge role={session.role} label={session.roleLabel} />
            </DropdownMenuLabel>
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
