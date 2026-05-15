"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Shield } from "lucide-react"

import type { SessionPayload } from "@repo/auth"
import { filterNavBySession, mainNav } from "@/lib/navigation"
import { RoleBadge } from "@/components/auth/role-badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { easeOut, slideInLeft, springSnappy } from "@/lib/motion"
import { cn } from "@/lib/utils"

function isNavActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname === ""
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

type AppSidebarProps = {
  session: SessionPayload
}

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const navItems = filterNavBySession(mainNav, session)

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="glass-sidebar z-30 border-r-0"
    >
      <SidebarHeader className="gap-3 border-b border-white/[0.06] px-3 py-5">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easeOut }}
        >
          <Link
            href="/"
            className="group/logo flex items-center gap-3 rounded-xl px-1.5 py-0.5 outline-none ring-sidebar-ring transition-colors hover:bg-white/[0.04] focus-visible:ring-2"
          >
            <motion.div
              whileHover={reduce ? undefined : { scale: 1.04, rotate: -2 }}
              transition={springSnappy}
              className={cn(
                "relative flex size-10 shrink-0 items-center justify-center rounded-xl",
                "bg-gradient-to-br from-[oklch(0.68_0.19_252)] to-[oklch(0.52_0.16_258)]",
                "text-white shadow-lg shadow-primary/30 ring-1 ring-white/20"
              )}
            >
              <Shield className="size-[22px]" strokeWidth={1.25} aria-hidden />
            </motion.div>
            <motion.div
              className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden"
              initial={false}
            >
              <span className="truncate text-[15px] font-semibold tracking-[-0.02em] text-sidebar-foreground">
                InsureFlow
              </span>
              <span className="truncate text-[10px] font-medium tracking-[0.08em] text-sidebar-foreground/45 uppercase">
                Enterprise
              </span>
            </motion.div>
          </Link>
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="gap-0.5">
        <SidebarGroup className="py-3">
          <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-sidebar-foreground/35 uppercase">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-2">
              {navItems.map((item, index) => {
                const active = isNavActive(pathname, item.href)
                return (
                  <SidebarMenuItem key={item.href} className="relative">
                    <motion.div
                      variants={slideInLeft}
                      initial={reduce ? false : "hidden"}
                      animate="visible"
                      transition={{ delay: 0.03 * index, duration: 0.35, ease: easeOut }}
                      className="relative"
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active-pill"
                          className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/25 via-primary/12 to-transparent shadow-[inset_0_1px_0_0_oklch(1_0_0/0.08)] ring-1 ring-primary/20"
                          transition={springSnappy}
                        />
                      )}
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "relative z-[1] h-9 rounded-lg px-2.5 text-[13px] font-medium tracking-[-0.01em]",
                          "text-sidebar-foreground/75 transition-colors duration-200",
                          "hover:bg-white/[0.04] hover:text-sidebar-foreground",
                          "data-[active=true]:bg-transparent data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-none"
                        )}
                        render={(props) => <Link href={item.href} {...props} />}
                      >
                        <motion.span
                          whileHover={reduce ? undefined : { scale: 1.08 }}
                          transition={{ duration: 0.2 }}
                          className="flex shrink-0"
                        >
                          <item.icon
                            className={cn(
                              "size-[17px] transition-colors duration-200",
                              active ? "text-primary" : "opacity-70"
                            )}
                            strokeWidth={active ? 2 : 1.5}
                            aria-hidden
                          />
                        </motion.span>
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-4 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <SidebarFooter className="border-t border-white/[0.05] p-2.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <motion.div whileHover={reduce ? undefined : { scale: 1.01 }} transition={springSnappy}>
              <SidebarMenuButton
                size="lg"
                className="h-12 rounded-xl border border-transparent transition-colors hover:border-white/[0.08] hover:bg-white/[0.04]"
                render={(props) => <Link href="/configuracoes" {...props} />}
              >
                <Avatar className="size-9 rounded-lg border border-white/10 shadow-md ring-2 ring-primary/20">
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-[oklch(0.52_0.16_258)] text-[11px] font-semibold text-white">
                    {session.initials}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
                  initial={false}
                >
                  <span className="truncate font-semibold tracking-[-0.02em]">
                    {session.name}
                  </span>
                  <span className="truncate text-[11px] text-sidebar-foreground/45">
                    {session.email}
                  </span>
                  <span className="mt-1 group-data-[collapsible=icon]:hidden">
                    <RoleBadge role={session.role} label={session.roleLabel} className="scale-90" />
                  </span>
                </motion.div>
              </SidebarMenuButton>
            </motion.div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
