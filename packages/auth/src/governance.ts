import type { DataScope, Permission } from "./types"

/** Domínios oficiais da UI de Governança RBAC. */
export const GOVERNANCE_DOMAINS = [
  "dashboard",
  "crm",
  "seguros",
  "comunicacao",
  "governanca",
  "imobiliaria",
  "parceiros",
] as const

export type GovernanceDomainId = (typeof GOVERNANCE_DOMAINS)[number]

export type GovernanceDomain = {
  id: GovernanceDomainId
  label: string
  description: string
}

export const GOVERNANCE_DOMAIN_META: Record<GovernanceDomainId, GovernanceDomain> = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    description: "Visão executiva e indicadores",
  },
  crm: {
    id: "crm",
    label: "CRM",
    description: "Leads, clientes, negócios, questionários",
  },
  seguros: {
    id: "seguros",
    label: "Seguros",
    description: "Cotações, propostas, apólices e sinistros",
  },
  comunicacao: {
    id: "comunicacao",
    label: "Comunicação",
    description: "Automação, templates e WhatsApp",
  },
  governanca: {
    id: "governanca",
    label: "Governança",
    description: "Configurações, empresas, usuários e auditoria",
  },
  imobiliaria: {
    id: "imobiliaria",
    label: "Imobiliária",
    description: "Imóveis, visitas, portal e leads imobiliários",
  },
  parceiros: {
    id: "parceiros",
    label: "Parceiros",
    description: "Indicações, comissões e portal do parceiro (em preparação)",
  },
}

export type GovernancePermissionMeta = {
  key: Permission
  domain: GovernanceDomainId
  label: string
  action: "Ver" | "Editar" | "Compartilhar" | "Administrar"
  moduleNote?: string
}

/** Catálogo de apresentação — chaves RBAC existentes, labels de negócio. */
export const GOVERNANCE_PERMISSION_CATALOG: GovernancePermissionMeta[] = [
  { key: "dashboard:view", domain: "dashboard", label: "Painel principal", action: "Ver" },
  { key: "crm:view", domain: "crm", label: "Negócios e pipeline", action: "Ver" },
  { key: "crm:manage", domain: "crm", label: "Negócios e pipeline", action: "Editar" },
  { key: "clients:view", domain: "crm", label: "Clientes", action: "Ver" },
  { key: "clients:manage", domain: "crm", label: "Clientes", action: "Editar" },
  { key: "leads:view", domain: "crm", label: "Leads", action: "Ver" },
  { key: "leads:manage", domain: "crm", label: "Leads", action: "Editar" },
  { key: "leads:share", domain: "parceiros", label: "Compartilhar leads", action: "Compartilhar" },
  { key: "questionnaires:view", domain: "crm", label: "Questionários", action: "Ver" },
  { key: "questionnaires:manage", domain: "crm", label: "Questionários", action: "Editar" },
  { key: "quotes:view", domain: "seguros", label: "Cotações e propostas", action: "Ver" },
  { key: "quotes:manage", domain: "seguros", label: "Cotações e propostas", action: "Editar" },
  { key: "policies:view", domain: "seguros", label: "Apólices", action: "Ver" },
  { key: "policies:manage", domain: "seguros", label: "Apólices", action: "Editar" },
  {
    key: "claims:view",
    domain: "seguros",
    label: "Sinistros",
    action: "Ver",
    moduleNote: "Módulo em preparação",
  },
  {
    key: "claims:manage",
    domain: "seguros",
    label: "Sinistros",
    action: "Editar",
    moduleNote: "Módulo em preparação",
  },
  { key: "automation:view", domain: "comunicacao", label: "Automação e templates", action: "Ver" },
  { key: "automation:manage", domain: "comunicacao", label: "Automação e templates", action: "Editar" },
  {
    key: "whatsapp:view",
    domain: "comunicacao",
    label: "WhatsApp",
    action: "Ver",
    moduleNote: "Módulo em preparação",
  },
  {
    key: "whatsapp:manage",
    domain: "comunicacao",
    label: "WhatsApp",
    action: "Editar",
    moduleNote: "Módulo em preparação",
  },
  { key: "settings:view", domain: "governanca", label: "Configurações", action: "Ver" },
  { key: "settings:manage", domain: "governanca", label: "Configurações", action: "Editar" },
  { key: "business-units:view-all", domain: "governanca", label: "Ver todas as empresas", action: "Ver" },
  { key: "business-units:manage", domain: "governanca", label: "Escopo multiempresa", action: "Administrar" },
  { key: "users:manage", domain: "governanca", label: "Usuários", action: "Administrar" },
  { key: "audit:view", domain: "governanca", label: "Trilha de auditoria", action: "Ver" },
  { key: "properties:view", domain: "imobiliaria", label: "Imóveis, visitas e portal", action: "Ver" },
  { key: "properties:manage", domain: "imobiliaria", label: "Imóveis, visitas e portal", action: "Editar" },
  {
    key: "tenants:manage",
    domain: "governanca",
    label: "Gestão de tenant (plataforma)",
    action: "Administrar",
    moduleNote: "Reservado super-admin",
  },
]

export type GovernanceBusinessUnitScope = "corretora-avila" | "avila-imoveis" | "ambas" | "nenhuma"

export type GovernanceRoleProfile = {
  slug: string
  name: string
  description: string
  dataScope: DataScope
  businessUnitScope: GovernanceBusinessUnitScope
  permissions: readonly Permission[]
  legacy?: boolean
  /** Perfil definido no catálogo mas ainda não seedado no banco. */
  planned?: boolean
}

/** Matriz de referência para UI (Fase 2A). Runtime continua usando DB no login. */
export const GOVERNANCE_ROLE_PROFILES: GovernanceRoleProfile[] = [
  {
    slug: "admin",
    name: "Administrador",
    description: "Acesso total ao tenant e a todas as empresas do Grupo Ávila",
    dataScope: "tenant",
    businessUnitScope: "ambas",
    permissions: GOVERNANCE_PERMISSION_CATALOG.map((p) => p.key),
  },
  {
    slug: "gerencia",
    name: "Gerência comercial",
    description: "Supervisão da equipe comercial — Corretora Ávila",
    dataScope: "team",
    businessUnitScope: "corretora-avila",
    permissions: [
      "dashboard:view", "crm:view", "crm:manage", "clients:view", "clients:manage",
      "leads:view", "leads:manage", "leads:share", "questionnaires:view", "questionnaires:manage",
      "quotes:view", "quotes:manage", "policies:view", "audit:view", "settings:view",
      "business-units:view-all", "properties:view",
    ],
  },
  {
    slug: "comercial",
    name: "Comercial",
    description: "Carteira individual — seguros (Corretora Ávila)",
    dataScope: "own",
    businessUnitScope: "corretora-avila",
    permissions: [
      "dashboard:view", "crm:view", "crm:manage", "clients:view", "leads:view", "leads:manage",
      "leads:share", "questionnaires:view", "questionnaires:manage", "quotes:view", "quotes:manage",
      "settings:view",
    ],
  },
  {
    slug: "corretor_imobiliario",
    name: "Corretor Imobiliário",
    description: "Operação imobiliária — Ávila Imóveis, sem acesso a seguros",
    dataScope: "own",
    businessUnitScope: "avila-imoveis",
    planned: true,
    permissions: [
      "dashboard:view",
      "properties:view",
      "properties:manage",
      "leads:view",
      "leads:manage",
    ],
  },
  {
    slug: "operacional",
    name: "Operacional",
    description: "Pós-venda e apólices — Corretora Ávila",
    dataScope: "team",
    businessUnitScope: "corretora-avila",
    permissions: [
      "dashboard:view", "clients:view", "clients:manage", "leads:view",
      "policies:view", "policies:manage", "claims:view", "claims:manage",
      "questionnaires:view", "settings:view",
    ],
  },
  {
    slug: "financeiro",
    name: "Financeiro",
    description: "Leitura financeira — Corretora Ávila",
    dataScope: "tenant",
    businessUnitScope: "corretora-avila",
    permissions: ["dashboard:view", "clients:view", "policies:view", "audit:view", "settings:view"],
  },
  {
    slug: "parceiro",
    name: "Parceiro externo",
    description: "Acesso a leads compartilhados e portal do parceiro",
    dataScope: "shared",
    businessUnitScope: "nenhuma",
    permissions: ["dashboard:view", "leads:view"],
  },
  {
    slug: "leitura",
    name: "Somente leitura",
    description: "Visualização do tenant",
    dataScope: "tenant",
    businessUnitScope: "ambas",
    permissions: GOVERNANCE_PERMISSION_CATALOG.filter((p) => p.action === "Ver").map((p) => p.key),
  },
  {
    slug: "sales",
    name: "Comercial (legado)",
    description: "Alias legado — preferir perfil Comercial",
    dataScope: "own",
    businessUnitScope: "corretora-avila",
    legacy: true,
    permissions: [
      "dashboard:view", "crm:view", "crm:manage", "clients:view", "leads:view", "leads:manage",
      "leads:share", "questionnaires:view", "questionnaires:manage", "quotes:view", "quotes:manage",
      "settings:view",
    ],
  },
  {
    slug: "viewer",
    name: "Visualizador (legado)",
    description: "Alias legado — preferir Somente leitura",
    dataScope: "tenant",
    businessUnitScope: "ambas",
    legacy: true,
    permissions: GOVERNANCE_PERMISSION_CATALOG.filter((p) => p.action === "Ver").map((p) => p.key),
  },
]

/** Canais de aquisição — todos devem gerar Lead (Growth Engine). */
export const ACQUISITION_CHANNELS = [
  { id: "site-imobiliaria", label: "Site Imobiliária", businessUnit: "avila-imoveis" as const },
  { id: "site-corretora", label: "Site Corretora", businessUnit: "corretora-avila" as const },
  { id: "google-ads", label: "Google Ads", businessUnit: "ambas" as const },
  { id: "meta-ads", label: "Meta Ads", businessUnit: "ambas" as const },
  { id: "instagram", label: "Instagram", businessUnit: "ambas" as const },
  { id: "whatsapp", label: "WhatsApp", businessUnit: "ambas" as const },
  { id: "landing-pages", label: "Landing Pages", businessUnit: "ambas" as const },
  { id: "parceiros", label: "Parceiros", businessUnit: "ambas" as const },
] as const

export const GRUPO_AVILA_BUSINESS_UNITS = [
  {
    slug: "corretora-avila",
    name: "Corretora Ávila",
    type: "INSURANCE" as const,
    description: "Operação de seguros e CRM comercial",
  },
  {
    slug: "avila-imoveis",
    name: "Ávila Imóveis",
    type: "REAL_ESTATE" as const,
    description: "Operação imobiliária — imóveis, visitas e portal",
  },
] as const

export function getGovernancePermissionMeta(key: Permission): GovernancePermissionMeta | undefined {
  return GOVERNANCE_PERMISSION_CATALOG.find((p) => p.key === key)
}

export function getGovernanceRoleProfile(slug: string): GovernanceRoleProfile | undefined {
  return GOVERNANCE_ROLE_PROFILES.find((r) => r.slug === slug)
}

export function groupPermissionsByDomain(
  permissionKeys: readonly string[],
): Partial<Record<GovernanceDomainId, GovernancePermissionMeta[]>> {
  const granted = new Set(permissionKeys)
  const grouped: Partial<Record<GovernanceDomainId, GovernancePermissionMeta[]>> = {}
  for (const meta of GOVERNANCE_PERMISSION_CATALOG) {
    if (!granted.has(meta.key)) continue
    const list = grouped[meta.domain] ?? []
    list.push(meta)
    grouped[meta.domain] = list
  }
  return grouped
}

export function businessUnitScopeLabel(scope: GovernanceBusinessUnitScope): string {
  switch (scope) {
    case "corretora-avila":
      return "Corretora Ávila"
    case "avila-imoveis":
      return "Ávila Imóveis"
    case "ambas":
      return "Corretora Ávila + Ávila Imóveis"
    case "nenhuma":
      return "Sem vínculo de empresa"
  }
}
