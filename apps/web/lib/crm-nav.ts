import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  Clock,
  Kanban,
  LayoutDashboard,
  LayoutGrid,
  Radar,
  RefreshCw,
  Shield,
  Trophy,
  Upload,
  Users,
} from "lucide-react"

export type CrmNavItem = {
  title: string
  href: string
  icon: LucideIcon
  description: string
}

export const crmNavItems: CrmNavItem[] = [
  {
    title: "Visão geral",
    href: "/crm",
    icon: LayoutGrid,
    description: "Resumo do pipeline e atividades",
  },
  {
    title: "Recuperação",
    href: "/crm/dashboard-comercial",
    icon: LayoutDashboard,
    description: "Indicadores de recuperação comercial",
  },
  {
    title: "Dashboard 360",
    href: "/crm/dashboard-360",
    icon: Radar,
    description: "Carteira, receita e oportunidades unificadas",
  },
  {
    title: "Executivo",
    href: "/crm/dashboard-executivo",
    icon: BarChart3,
    description: "Funil, conversão e produtividade por empresa",
  },
  {
    title: "SLA",
    href: "/crm/dashboard-sla",
    icon: Clock,
    description: "Alertas, atrasos e gargalos do funil",
  },
  {
    title: "Performance",
    href: "/crm/performance",
    icon: Trophy,
    description: "Metas, comissões e ranking comercial",
  },
  {
    title: "Negócios",
    href: "/crm/negocios",
    icon: Kanban,
    description: "Funil de vendas e oportunidades",
  },
  {
    title: "Contatos",
    href: "/crm/contatos",
    icon: Users,
    description: "Pessoas e leads qualificados",
  },
  {
    title: "Empresas",
    href: "/crm/empresas",
    icon: Building2,
    description: "Contas e carteira corporativa",
  },
  {
    title: "Clientes",
    href: "/crm/clientes",
    icon: Shield,
    description: "Carteira ativa, apólices e renovações",
  },
  {
    title: "Importações",
    href: "/crm/importacoes",
    icon: Upload,
    description: "Importar leads e carteira de clientes",
  },
  {
    title: "Agenda",
    href: "/crm/agenda",
    icon: CalendarDays,
    description: "Follow-ups e compromissos do dia",
  },
  {
    title: "Follow-ups",
    href: "/crm/follow-ups",
    icon: CalendarCheck,
    description: "Fila de próximos contatos",
  },
  {
    title: "Carteira de renovação",
    href: "/crm/renovacoes-carteira",
    icon: RefreshCw,
    description: "Vencimentos, status e ações comerciais",
  },
  {
    title: "Renovações",
    href: "/crm/renovacoes",
    icon: RefreshCw,
    description: "Fila comercial de apólices",
  },
  {
    title: "Tarefas",
    href: "/crm/tarefas",
    icon: CheckSquare,
    description: "Follow-ups e compromissos",
  },
  {
    title: "Atividades",
    href: "/crm/atividades",
    icon: Activity,
    description: "Histórico de interações",
  },
]

export function isCrmNavActive(pathname: string, href: string) {
  if (href === "/crm") {
    return pathname === "/crm" || pathname === "/crm/"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
