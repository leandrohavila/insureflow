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
  Settings,
  Building2,
  UserCircle,
  CalendarDays,
  Globe,
  Radar,
  UserCog,
  KeyRound,
  RefreshCw,
  CalendarCheck,
  RotateCcw,
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

const agendaComercialItem: NavItem = {
  title: "Agenda Comercial",
  href: "/crm/agenda",
  icon: CalendarDays,
  segment: "crm",
  activePrefix: "/crm/agenda",
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

const apolicesItem: NavItem = {
  title: "Apólices",
  href: "/apolices",
  icon: Shield,
  segment: "apolices",
  permission: "policies:view",
}

const renovacoesItem: NavItem = {
  title: "Renovações",
  href: "/crm/renovacoes",
  icon: RefreshCw,
  segment: "crm",
  activePrefix: "/crm/renovacoes",
  permission: "crm:view",
}

const followUpsItem: NavItem = {
  title: "Follow-ups",
  href: "/crm/follow-ups",
  icon: CalendarCheck,
  segment: "crm",
  activePrefix: "/crm/follow-ups",
  permission: "crm:view",
}

const reativacaoItem: NavItem = {
  title: "Reativação",
  href: "/automacao/reativacao",
  icon: RotateCcw,
  segment: "automacao",
  activePrefix: "/automacao/reativacao",
  permission: "automation:view",
}

const whatsappItem: NavItem = {
  title: "WhatsApp",
  href: "/whatsapp",
  icon: MessageCircle,
  segment: "whatsapp",
  permission: "whatsapp:view",
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

const crmNavItems: NavItem[] = [
  leadsItem,
  pipelineItem,
  agendaComercialItem,
  clientesItem,
  customer360Item,
]

const segurosNavItems: NavItem[] = [
  questionariosItem,
  cotacoesItem,
  propostasItem,
  apolicesItem,
  renovacoesItem,
]

const automacaoNavItems: NavItem[] = [
  followUpsItem,
  reativacaoItem,
  whatsappItem,
]

const imobiliarioNavItems: NavItem[] = [
  imoveisItem,
  proprietariosItem,
  leadsImobiliariosItem,
  portalItem,
]

const governancaNavItems: NavItem[] = [
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
]

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
    title: "Sinistros",
    href: "/sinistros",
    icon: AlertTriangle,
    segment: "sinistros",
    permission: "claims:view",
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
    title: "Automação",
    href: "/automacao",
    icon: RotateCcw,
    segment: "automacao",
    exact: true,
    permission: "automation:view",
  },
]

/** Menu operacional — Corretora Ávila (INSURANCE / Todas). */
export const mainNav: NavItem[] = [
  dashboardItem,
  ...crmNavItems,
  ...segurosNavItems,
  ...automacaoNavItems,
  configuracoesItem,
]

/** Menu operacional — Ávila Imóveis (REAL_ESTATE). */
export const realEstateNav: NavItem[] = [
  dashboardItem,
  ...imobiliarioNavItems,
  configuracoesItem,
]

const dashboardGroup: NavGroup = {
  id: "dashboard",
  label: "",
  items: [dashboardItem],
}

/** Menu consolidado — admin / super_admin (seguros + imóveis juntos). */
export const adminNavGroups: NavGroup[] = [
  dashboardGroup,
  {
    id: "crm",
    label: "CRM",
    items: crmNavItems,
  },
  {
    id: "seguros",
    label: "Seguros",
    items: segurosNavItems,
  },
  {
    id: "imobiliario",
    label: "Imobiliário",
    items: imobiliarioNavItems,
  },
  {
    id: "automacao",
    label: "Automação",
    items: automacaoNavItems,
  },
  {
    id: "governanca",
    label: "Governança",
    items: governancaNavItems,
  },
]

/** Menu agrupado — operador Corretora (ACL). */
export const insuranceNavGroups: NavGroup[] = [
  dashboardGroup,
  {
    id: "crm",
    label: "CRM",
    items: crmNavItems,
  },
  {
    id: "seguros",
    label: "Seguros",
    items: segurosNavItems,
  },
  {
    id: "automacao",
    label: "Automação",
    items: automacaoNavItems,
  },
  {
    id: "governanca",
    label: "Governança",
    items: [configuracoesItem],
  },
]

/** Menu agrupado — operador Ávila Imóveis (ACL). */
export const realEstateNavGroups: NavGroup[] = [
  dashboardGroup,
  {
    id: "imobiliario",
    label: "Imobiliário",
    items: imobiliarioNavItems,
  },
  {
    id: "governanca",
    label: "Governança",
    items: [configuracoesItem],
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
segmentToTitle.automacao = "Automação"
segmentToPermission.automacao = "automation:view"

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
  const groups = realEstate ? realEstateNavGroups : insuranceNavGroups
  return filterNavGroupsBySession(groups, session)
}
