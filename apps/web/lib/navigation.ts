import type { LucideIcon } from "lucide-react"
import {
  Kanban,
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Shield,
  AlertTriangle,
  MessageCircle,
  Workflow,
  Settings,
  Building2,
  UserCircle,
  CalendarDays,
  Globe,
} from "lucide-react"

import { hasPermission, type Permission, type SessionPayload } from "@repo/auth"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  /** URL segment after `/` for permission lookup */
  segment: string
  /** Path prefix for active state (defaults to href) */
  activePrefix?: string
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
    href: "/questionarios/templates",
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
    title: "Propostas",
    href: "/propostas",
    icon: FileText,
    segment: "propostas",
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

/** Menu operacional imobiliário (BU REAL_ESTATE). */
export const realEstateNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    segment: "",
    permission: "dashboard:view",
  },
  {
    title: "Imóveis",
    href: "/real-estate/properties",
    icon: Building2,
    segment: "real-estate-properties",
    activePrefix: "/real-estate/properties",
    permission: "properties:view",
  },
  {
    title: "Proprietários",
    href: "/real-estate/owners",
    icon: UserCircle,
    segment: "real-estate-owners",
    activePrefix: "/real-estate/owners",
    permission: "properties:view",
  },
  {
    title: "Leads Imobiliários",
    href: "/real-estate/leads",
    icon: UserPlus,
    segment: "real-estate-leads",
    activePrefix: "/real-estate/leads",
    permission: "properties:view",
  },
  {
    title: "Visitas",
    href: "/real-estate/visits",
    icon: CalendarDays,
    segment: "real-estate-visits",
    activePrefix: "/real-estate/visits",
    permission: "properties:view",
  },
  {
    title: "Portal",
    href: "/real-estate/portal",
    icon: Globe,
    segment: "real-estate-portal",
    activePrefix: "/real-estate/portal",
    permission: "properties:view",
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
  [...mainNav, ...realEstateNav].map((item) => [item.segment, item.title])
) as Record<string, string>

const segmentToPermission = Object.fromEntries(
  [...mainNav, ...realEstateNav].map((item) => [item.segment, item.permission])
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
