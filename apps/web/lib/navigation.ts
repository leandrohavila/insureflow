import type { LucideIcon } from "lucide-react"
import {
  Kanban,
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  FileSpreadsheet,
  Shield,
  AlertTriangle,
  MessageCircle,
  Workflow,
  Settings,
} from "lucide-react"

import { hasPermission, type Permission, type SessionPayload } from "@repo/auth"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  /** URL segment after `/` for active matching; empty string = home */
  segment: string
  permission: Permission
}

export const mainNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    segment: "",
    permission: "dashboard:view",
  },
  {
    title: "CRM",
    href: "/crm",
    icon: Kanban,
    segment: "crm",
    permission: "crm:view",
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
    segment: "clientes",
    permission: "clients:view",
  },
  {
    title: "Leads",
    href: "/leads",
    icon: UserPlus,
    segment: "leads",
    permission: "leads:view",
  },
  {
    title: "Questionários",
    href: "/questionarios",
    icon: ClipboardList,
    segment: "questionarios",
    permission: "questionnaires:view",
  },
  {
    title: "Cotações",
    href: "/cotacoes",
    icon: FileSpreadsheet,
    segment: "cotacoes",
    permission: "quotes:view",
  },
  {
    title: "Apólices",
    href: "/apolices",
    icon: Shield,
    segment: "apolices",
    permission: "policies:view",
  },
  {
    title: "Sinistros",
    href: "/sinistros",
    icon: AlertTriangle,
    segment: "sinistros",
    permission: "claims:view",
  },
  {
    title: "WhatsApp",
    href: "/whatsapp",
    icon: MessageCircle,
    segment: "whatsapp",
    permission: "whatsapp:view",
  },
  {
    title: "Automação",
    href: "/automacao",
    icon: Workflow,
    segment: "automacao",
    permission: "automation:view",
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    segment: "configuracoes",
    permission: "settings:view",
  },
]

const segmentToTitle = Object.fromEntries(
  mainNav.map((item) => [item.segment, item.title])
) as Record<string, string>

const segmentToPermission = Object.fromEntries(
  mainNav.map((item) => [item.segment, item.permission])
) as Record<string, Permission>

export function getNavTitle(segment: string): string | undefined {
  return segmentToTitle[segment]
}

export function getNavPermission(segment: string): Permission | undefined {
  return segmentToPermission[segment]
}

export function filterNavBySession(
  items: NavItem[],
  session: SessionPayload | null | undefined
): NavItem[] {
  if (!session) return []
  return items.filter((item) => hasPermission(session, item.permission))
}
