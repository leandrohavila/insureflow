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
  Radar,
  UserCog,
  KeyRound,
} from "lucide-react"

import {
  hasPermission,
  type Permission,
  type SessionPayload,
} from "@repo/auth"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  /** URL segment after `/` for permission lookup */
  segment: string
  /** Path prefix for active state (defaults to href) */
  activePrefix?: string
  /** If true, active only on the prefix itself (not children). */
  exact?: boolean
  permission: Permission
}

export type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

const ADMIN_MASTER_ROLES = new Set(["admin", "super_admin"])

/** Admin Master se `admin` ou `super_admin` aparecer em qualquer posição. */
export function isAdminMaster(
  roles: ReadonlyArray<string> | string | null | undefined,
): boolean {
  if (roles == null) return false
  const list = typeof roles === "string" ? [roles] : roles
  return list.some((role) => ADMIN_MASTER_ROLES.has(role))
}

const dashboardItem: NavItem = {
  title: "Dashboard",
  href: "/",
  icon: LayoutDashboard,
  segment: "",
  permission: "dashboard:view",
}

const leadsItem: NavItem = {
  title: "Leads",
  href: "/leads",
  icon: UserPlus,
  segment: "leads",
  permission: "leads:view",
}

const pipelineItem: NavItem = {
  title: "Pipeline",
  href: "/crm/negocios",
  icon: Kanban,
  segment: "crm",
  activePrefix: "/crm/negocios",
  permission: "crm:view",
}

const clientesItem: NavItem = {
  title: "Clientes",
  href: "/clientes",
  icon: Users,
  segment: "clientes",
  permission: "clients:view",
}

const customer360Item: NavItem = {
  title: "Customer 360",
  href: "/crm/dashboard-360",
  icon: Radar,
  segment: "crm",
  activePrefix: "/crm/dashboard-360",
  permission: "crm:view",
}

const questionariosItem: NavItem = {
  title: "Questionários",
  href: "/questionarios/templates",
  icon: ClipboardList,
  segment: "questionarios",
  permission: "questionnaires:view",
}

const cotacoesItem: NavItem = {
  title: "Cotações",
  href: "/cotacoes",
  icon: FileSpreadsheet,
  segment: "cotacoes",
  permission: "quotes:view",
}

const propostasItem: NavItem = {
  title: "Propostas",
  href: "/propostas",
  icon: FileText,
  segment: "propostas",
  permission: "quotes:view",
}

const automacaoItem: NavItem = {
  title: "Automação",
  href: "/automacao",
  icon: Workflow,
  segment: "automacao",
  permission: "automation:view",
}

const configuracoesItem: NavItem = {
  title: "Configurações",
  href: "/configuracoes",
  icon: Settings,
  segment: "configuracoes",
  permission: "settings:view",
}

const imoveisItem: NavItem = {
  title: "Imóveis",
  href: "/real-estate/properties",
  icon: Building2,
  segment: "real-estate-properties",
  activePrefix: "/real-estate/properties",
  permission: "properties:view",
}

const proprietariosItem: NavItem = {
  title: "Proprietários",
  href: "/real-estate/owners",
  icon: UserCircle,
  segment: "real-estate-owners",
  activePrefix: "/real-estate/owners",
  permission: "properties:view",
}

const leadsImobiliariosItem: NavItem = {
  title: "Leads Imobiliários",
  href: "/real-estate/leads",
  icon: UserPlus,
  segment: "real-estate-leads",
  activePrefix: "/real-estate/leads",
  permission: "properties:view",
}

const portalItem: NavItem = {
  title: "Portal",
  href: "/real-estate/portal",
  icon: Globe,
  segment: "real-estate-portal",
  activePrefix: "/real-estate/portal",
  permission: "properties:view",
}

/** Itens ocultos do menu de produção — rotas e ACL permanecem. */
export const hiddenNavItems: NavItem[] = [
  {
    title: "CRM",
    href: "/crm",
    icon: Kanban,
    segment: "crm",
    permission: "crm:view",
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
    title: "Visitas",
    href: "/real-estate/visits",
    icon: CalendarDays,
    segment: "real-estate-visits",
    activePrefix: "/real-estate/visits",
    permission: "properties:view",
  },
]

/** Menu operacional — Corretora Ávila (INSURANCE / Todas). */
export const mainNav: NavItem[] = [
  dashboardItem,
  leadsItem,
  pipelineItem,
  clientesItem,
  customer360Item,
  questionariosItem,
  cotacoesItem,
  propostasItem,
  automacaoItem,
  configuracoesItem,
]

/** Menu operacional — Ávila Imóveis (REAL_ESTATE). */
export const realEstateNav: NavItem[] = [
  dashboardItem,
  imoveisItem,
  proprietariosItem,
  leadsImobiliariosItem,
  portalItem,
  configuracoesItem,
]

/** Menu consolidado — admin / super_admin (seguros + imóveis juntos). */
export const adminNavGroups: NavGroup[] = [
  {
    id: "dashboard",
    label: "",
    items: [dashboardItem],
  },
  {
    id: "crm",
    label: "CRM",
    items: [leadsItem, pipelineItem, clientesItem, customer360Item],
  },
  {
    id: "seguros",
    label: "Seguros",
    items: [questionariosItem, cotacoesItem, propostasItem, automacaoItem],
  },
  {
    id: "imobiliario",
    label: "Imobiliário",
    items: [imoveisItem, proprietariosItem, leadsImobiliariosItem, portalItem],
  },
  {
    id: "governanca",
    label: "Governança",
    items: [
      {
        title: "Usuários",
        href: "/configuracoes/governanca/usuarios",
        icon: UserCog,
        segment: "configuracoes",
        activePrefix: "/configuracoes/governanca/usuarios",
        permission: "settings:view",
      },
      {
        title: "Perfis",
        href: "/configuracoes/governanca/perfis",
        icon: Shield,
        segment: "configuracoes",
        activePrefix: "/configuracoes/governanca/perfis",
        permission: "settings:view",
      },
      {
        title: "ACL",
        href: "/configuracoes/governanca/matriz",
        icon: KeyRound,
        segment: "configuracoes",
        activePrefix: "/configuracoes/governanca/matriz",
        permission: "settings:view",
      },
      {
        ...configuracoesItem,
        exact: true,
        href: "/configuracoes",
        activePrefix: "/configuracoes/governanca",
      },
    ],
  },
]

export function flattenNavGroups(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) => group.items)
}

const catalogItems: NavItem[] = [
  ...mainNav,
  ...realEstateNav,
  ...flattenNavGroups(adminNavGroups),
  ...hiddenNavItems,
]

const segmentToTitle = Object.fromEntries(
  catalogItems.map((item) => [item.segment, item.title]),
) as Record<string, string>

const segmentToPermission = Object.fromEntries(
  catalogItems.map((item) => [item.segment, item.permission]),
) as Record<string, Permission>

segmentToTitle.crm = "CRM"
segmentToPermission.crm = "crm:view"
segmentToTitle.configuracoes = "Configurações"
segmentToPermission.configuracoes = "settings:view"

export function getNavTitle(segment: string): string | undefined {
  return segmentToTitle[segment]
}

export function getNavPermission(segment: string): Permission | undefined {
  return segmentToPermission[segment]
}

export function filterNavBySession(
  items: NavItem[],
  session: SessionPayload | null | undefined,
): NavItem[] {
  if (!session) return []
  return items.filter((item) => hasPermission(session, item.permission))
}

export function filterNavGroupsBySession(
  groups: NavGroup[],
  session: SessionPayload | null | undefined,
): NavGroup[] {
  if (!session) return []
  return groups
    .map((group) => ({
      ...group,
      items: filterNavBySession(group.items, session),
    }))
    .filter((group) => group.items.length > 0)
}

export function asSingleNavGroup(id: string, label: string, items: NavItem[]): NavGroup[] {
  if (!items.length) return []
  return [{ id, label, items }]
}

/** Menu operacional (ACL) ou Admin Master (sem filtro de ACL). */
export function resolveOperationalNav(
  session: SessionPayload | null | undefined,
  realEstate: boolean,
): NavGroup[] {
  if (!session) return []
  if (isAdminMaster(session.roles?.length ? session.roles : session.role)) {
    return adminNavGroups
  }
  const items = realEstate ? realEstateNav : mainNav
  return asSingleNavGroup(
    "navegacao",
    "Navegação",
    filterNavBySession(items, session),
  )
}
