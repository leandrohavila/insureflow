export type LeadRow = {
  id: string
  nome: string
  contato: string
  origem: string
  estagio: string
  valor: string
  data: string
}

export const recentLeads: LeadRow[] = [
  {
    id: "1",
    nome: "Marina Costa",
    contato: "(11) 99876-4321",
    origem: "Site institucional",
    estagio: "Qualificação",
    valor: "R$ 12.400",
    data: "14/05/2026",
  },
  {
    id: "2",
    nome: "Grupo Lopes Ltda.",
    contato: "comercial@lopes.com.br",
    origem: "Indicação",
    estagio: "Proposta",
    valor: "R$ 48.900",
    data: "13/05/2026",
  },
  {
    id: "3",
    nome: "Carlos Mendes",
    contato: "(21) 98765-2211",
    origem: "WhatsApp",
    estagio: "Novo",
    valor: "—",
    data: "12/05/2026",
  },
  {
    id: "4",
    nome: "Clínica Vida Plena",
    contato: "(47) 3033-8899",
    origem: "LinkedIn",
    estagio: "Negociação",
    valor: "R$ 22.150",
    data: "11/05/2026",
  },
  {
    id: "5",
    nome: "Transportes Sul",
    contato: "contato@sultrans.com.br",
    origem: "Campanha e-mail",
    estagio: "Qualificação",
    valor: "R$ 67.000",
    data: "10/05/2026",
  },
]

export const performanceByMonth = [
  { month: "Jan", cotacoes: 42, fechamentos: 18 },
  { month: "Fev", cotacoes: 38, fechamentos: 22 },
  { month: "Mar", cotacoes: 55, fechamentos: 28 },
  { month: "Abr", cotacoes: 48, fechamentos: 24 },
  { month: "Mai", cotacoes: 62, fechamentos: 31 },
  { month: "Jun", cotacoes: 58, fechamentos: 29 },
]

export const kpiStats = {
  totalClientes: { value: "2.847", delta: "+4,2%", positive: true },
  leadsMes: { value: "186", delta: "+12%", positive: true },
  cotacoesAndamento: { value: "73", delta: "−3%", positive: false },
  apolicesAtivas: { value: "1.902", delta: "+2,1%", positive: true },
} as const
