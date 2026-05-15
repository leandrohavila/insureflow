export type CrmStageId =
  | "novo"
  | "qualificacao"
  | "proposta"
  | "negociacao"
  | "fechado"

export type CrmDeal = {
  id: string
  title: string
  company: string
  contact: string
  email?: string
  value: number
  stage: CrmStageId
  owner: string
  ownerInitials: string
  priority: "alta" | "media" | "baixa"
  product: string
  lastActivity: string
  tags: string[]
}

export type CrmActivity = {
  id: string
  type: "call" | "email" | "meeting" | "note" | "quote"
  title: string
  description: string
  time: string
  user: string
}

export const pipelineStages: {
  id: CrmStageId
  label: string
  accent: string
}[] = [
  { id: "novo", label: "Novo", accent: "sky" },
  { id: "qualificacao", label: "Qualificação", accent: "violet" },
  { id: "proposta", label: "Proposta", accent: "primary" },
  { id: "negociacao", label: "Negociação", accent: "amber" },
  { id: "fechado", label: "Fechado", accent: "emerald" },
]

export const crmDeals: CrmDeal[] = [
  {
    id: "d1",
    title: "Frota corporativa",
    company: "Transportes Sul",
    contact: "Ricardo Alves",
    email: "ricardo@sultrans.com.br",
    value: 67000,
    stage: "negociacao",
    owner: "Ana Costa",
    ownerInitials: "AC",
    priority: "alta",
    product: "Auto frota",
    lastActivity: "Há 2h",
    tags: ["Corporativo", "Renovação"],
  },
  {
    id: "d2",
    title: "Saúde empresarial",
    company: "Clínica Vida Plena",
    contact: "Dra. Helena M.",
    value: 22150,
    stage: "proposta",
    owner: "Pedro Lima",
    ownerInitials: "PL",
    priority: "media",
    product: "Saúde",
    lastActivity: "Ontem",
    tags: ["PME"],
  },
  {
    id: "d3",
    title: "Residencial premium",
    company: "Marina Costa",
    contact: "Marina Costa",
    value: 12400,
    stage: "qualificacao",
    owner: "Ana Costa",
    ownerInitials: "AC",
    priority: "media",
    product: "Residencial",
    lastActivity: "Há 4h",
    tags: ["Indicação"],
  },
  {
    id: "d4",
    title: "RC profissional",
    company: "Grupo Lopes Ltda.",
    contact: "Comercial",
    email: "comercial@lopes.com.br",
    value: 48900,
    stage: "proposta",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    priority: "alta",
    product: "RC",
    lastActivity: "Há 1d",
    tags: ["Corporativo"],
  },
  {
    id: "d5",
    title: "Vida individual",
    company: "Carlos Mendes",
    contact: "Carlos Mendes",
    value: 8900,
    stage: "novo",
    owner: "Pedro Lima",
    ownerInitials: "PL",
    priority: "baixa",
    product: "Vida",
    lastActivity: "Há 30min",
    tags: ["WhatsApp"],
  },
  {
    id: "d6",
    title: "Condomínio vertical",
    company: "Residencial Aurora",
    contact: "Síndico Paulo",
    value: 34200,
    stage: "qualificacao",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    priority: "alta",
    product: "Condomínio",
    lastActivity: "Há 6h",
    tags: ["Condomínio"],
  },
  {
    id: "d7",
    title: "Equipamentos industriais",
    company: "Metalúrgica Norte",
    contact: "Eng. Fernanda",
    value: 156000,
    stage: "negociacao",
    owner: "Ana Costa",
    ownerInitials: "AC",
    priority: "alta",
    product: "Patrimonial",
    lastActivity: "Há 3h",
    tags: ["Industrial"],
  },
  {
    id: "d8",
    title: "Odontológico PME",
    company: "Odonto+ Care",
    contact: "Dr. André",
    value: 18700,
    stage: "novo",
    owner: "Pedro Lima",
    ownerInitials: "PL",
    priority: "media",
    product: "Odonto",
    lastActivity: "Há 1h",
    tags: ["Inbound"],
  },
  {
    id: "d9",
    title: "Cyber seguradora",
    company: "TechSecure SA",
    contact: "CTO Marina",
    value: 52000,
    stage: "fechado",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    priority: "media",
    product: "Cyber",
    lastActivity: "Há 2d",
    tags: ["Tech"],
  },
  {
    id: "d10",
    title: "Viagem corporativa",
    company: "Agência Horizonte",
    contact: "Lucas Ferreira",
    value: 9800,
    stage: "fechado",
    owner: "Ana Costa",
    ownerInitials: "AC",
    priority: "baixa",
    product: "Viagem",
    lastActivity: "Há 5d",
    tags: ["Fechado"],
  },
  {
    id: "d11",
    title: "Agronegócio safra",
    company: "Fazenda Boa Vista",
    contact: "João Silveira",
    value: 89000,
    stage: "qualificacao",
    owner: "Pedro Lima",
    ownerInitials: "PL",
    priority: "alta",
    product: "Rural",
    lastActivity: "Há 8h",
    tags: ["Rural"],
  },
  {
    id: "d12",
    title: "D&O executivos",
    company: "Holdings Alpha",
    contact: "CFO Roberto",
    value: 112000,
    stage: "negociacao",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    priority: "alta",
    product: "D&O",
    lastActivity: "Há 45min",
    tags: ["Corporativo"],
  },
]

export const crmActivities: CrmActivity[] = [
  {
    id: "a1",
    type: "call",
    title: "Ligação com Transportes Sul",
    description: "Alinhamento de condições da frota — próximo passo: envio de proposta revisada.",
    time: "14:32",
    user: "Ana Costa",
  },
  {
    id: "a2",
    type: "email",
    title: "Proposta enviada — Grupo Lopes",
    description: "RC profissional com cobertura ampliada. Aguardando retorno jurídico.",
    time: "11:15",
    user: "Julia Mendes",
  },
  {
    id: "a3",
    type: "meeting",
    title: "Reunião Clínica Vida Plena",
    description: "Apresentação do plano saúde PME para 45 vidas.",
    time: "09:00",
    user: "Pedro Lima",
  },
  {
    id: "a4",
    type: "quote",
    title: "Cotação Metalúrgica Norte",
    description: "Patrimonial industrial — valor pré-aprovado pela seguradora.",
    time: "Ontem",
    user: "Ana Costa",
  },
  {
    id: "a5",
    type: "note",
    title: "Lead WhatsApp qualificado",
    description: "Carlos Mendes — interesse em vida individual com cobertura internacional.",
    time: "Ontem",
    user: "Pedro Lima",
  },
]

export const crmMetrics = {
  pipelineValue: 1_247_500,
  openDeals: 42,
  winRate: 34,
  avgCycleDays: 18,
  newThisWeek: 14,
} as const

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

export function getDealsByStage(stage: CrmStageId): CrmDeal[] {
  return crmDeals.filter((d) => d.stage === stage)
}

export function getStageTotal(stage: CrmStageId): number {
  return getDealsByStage(stage).reduce((sum, d) => sum + d.value, 0)
}

export function getDealById(id: string): CrmDeal | undefined {
  return crmDeals.find((d) => d.id === id)
}

export type CrmContact = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  role: string
  owner: string
  ownerInitials: string
  lifecycle: "Lead" | "MQL" | "SQL" | "Cliente"
  lastActivity: string
  createdAt: string
}

export type CrmCompany = {
  id: string
  name: string
  domain: string
  industry: string
  size: string
  owner: string
  ownerInitials: string
  deals: number
  revenue: string
  lastActivity: string
}

export type CrmTask = {
  id: string
  title: string
  due: string
  dueLabel: "today" | "tomorrow" | "overdue" | "upcoming"
  priority: "alta" | "media" | "baixa"
  relatedTo: string
  type: "call" | "email" | "meeting" | "task"
  owner: string
  ownerInitials: string
  completed: boolean
}

export const crmContacts: CrmContact[] = [
  {
    id: "c1",
    name: "Marina Costa",
    email: "marina@email.com",
    phone: "(11) 99876-4321",
    company: "Marina Costa",
    role: "Titular",
    owner: "Ana Costa",
    ownerInitials: "AC",
    lifecycle: "SQL",
    lastActivity: "Há 4h",
    createdAt: "10/05/2026",
  },
  {
    id: "c2",
    name: "Ricardo Alves",
    email: "ricardo@sultrans.com.br",
    phone: "(47) 3333-2211",
    company: "Transportes Sul",
    role: "Diretor",
    owner: "Ana Costa",
    ownerInitials: "AC",
    lifecycle: "SQL",
    lastActivity: "Há 2h",
    createdAt: "08/05/2026",
  },
  {
    id: "c3",
    name: "Carlos Mendes",
    email: "carlos.m@gmail.com",
    phone: "(21) 98765-2211",
    company: "—",
    role: "—",
    owner: "Pedro Lima",
    ownerInitials: "PL",
    lifecycle: "Lead",
    lastActivity: "Há 30min",
    createdAt: "12/05/2026",
  },
  {
    id: "c4",
    name: "Dra. Helena Martins",
    email: "helena@vidaplena.com.br",
    phone: "(47) 3033-8899",
    company: "Clínica Vida Plena",
    role: "Sócia",
    owner: "Pedro Lima",
    ownerInitials: "PL",
    lifecycle: "MQL",
    lastActivity: "Ontem",
    createdAt: "05/05/2026",
  },
  {
    id: "c5",
    name: "Roberto CFO",
    email: "roberto@holdingsalpha.com",
    phone: "(11) 4000-1122",
    company: "Holdings Alpha",
    role: "CFO",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    lifecycle: "SQL",
    lastActivity: "Há 45min",
    createdAt: "01/05/2026",
  },
  {
    id: "c6",
    name: "Fernanda Eng.",
    email: "fernanda@metalnorte.com",
    phone: "(31) 3555-9000",
    company: "Metalúrgica Norte",
    role: "Eng. Segurança",
    owner: "Ana Costa",
    ownerInitials: "AC",
    lifecycle: "Cliente",
    lastActivity: "Há 3h",
    createdAt: "22/04/2026",
  },
]

export const crmCompanies: CrmCompany[] = [
  {
    id: "co1",
    name: "Transportes Sul",
    domain: "sultrans.com.br",
    industry: "Logística",
    size: "200–500",
    owner: "Ana Costa",
    ownerInitials: "AC",
    deals: 2,
    revenue: "R$ 134k",
    lastActivity: "Há 2h",
  },
  {
    id: "co2",
    name: "Clínica Vida Plena",
    domain: "vidaplena.com.br",
    industry: "Saúde",
    size: "50–200",
    owner: "Pedro Lima",
    ownerInitials: "PL",
    deals: 1,
    revenue: "R$ 22k",
    lastActivity: "Ontem",
  },
  {
    id: "co3",
    name: "Grupo Lopes Ltda.",
    domain: "lopes.com.br",
    industry: "Serviços",
    size: "500+",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    deals: 3,
    revenue: "R$ 89k",
    lastActivity: "Há 1d",
  },
  {
    id: "co4",
    name: "Metalúrgica Norte",
    domain: "metalnorte.com",
    industry: "Indústria",
    size: "500+",
    owner: "Ana Costa",
    ownerInitials: "AC",
    deals: 1,
    revenue: "R$ 156k",
    lastActivity: "Há 3h",
  },
  {
    id: "co5",
    name: "Holdings Alpha",
    domain: "holdingsalpha.com",
    industry: "Holding",
    size: "200–500",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    deals: 2,
    revenue: "R$ 210k",
    lastActivity: "Há 45min",
  },
  {
    id: "co6",
    name: "TechSecure SA",
    domain: "techsecure.io",
    industry: "Tecnologia",
    size: "50–200",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    deals: 1,
    revenue: "R$ 52k",
    lastActivity: "Há 2d",
  },
]

export const crmTasks: CrmTask[] = [
  {
    id: "t1",
    title: "Ligar para Ricardo — Transportes Sul",
    due: "Hoje, 16:00",
    dueLabel: "today",
    priority: "alta",
    relatedTo: "Frota corporativa",
    type: "call",
    owner: "Ana Costa",
    ownerInitials: "AC",
    completed: false,
  },
  {
    id: "t2",
    title: "Enviar proposta revisada — Grupo Lopes",
    due: "Hoje, 18:00",
    dueLabel: "today",
    priority: "alta",
    relatedTo: "RC profissional",
    type: "email",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    completed: false,
  },
  {
    id: "t3",
    title: "Reunião de alinhamento — Vida Plena",
    due: "Amanhã, 10:00",
    dueLabel: "tomorrow",
    priority: "media",
    relatedTo: "Saúde empresarial",
    type: "meeting",
    owner: "Pedro Lima",
    ownerInitials: "PL",
    completed: false,
  },
  {
    id: "t4",
    title: "Follow-up WhatsApp — Carlos Mendes",
    due: "Atrasada",
    dueLabel: "overdue",
    priority: "media",
    relatedTo: "Vida individual",
    type: "call",
    owner: "Pedro Lima",
    ownerInitials: "PL",
    completed: false,
  },
  {
    id: "t5",
    title: "Documentação frota — anexar CRLV",
    due: "14/05/2026",
    dueLabel: "upcoming",
    priority: "baixa",
    relatedTo: "Transportes Sul",
    type: "task",
    owner: "Ana Costa",
    ownerInitials: "AC",
    completed: false,
  },
  {
    id: "t6",
    title: "Apresentação D&O — Holdings Alpha",
    due: "Hoje, 14:30",
    dueLabel: "today",
    priority: "alta",
    relatedTo: "D&O executivos",
    type: "meeting",
    owner: "Julia Mendes",
    ownerInitials: "JM",
    completed: true,
  },
]

export const stageLabelMap = Object.fromEntries(
  pipelineStages.map((s) => [s.id, s.label])
) as Record<CrmStageId, string>
