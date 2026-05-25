import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Building2,
  CalendarDays,
  CheckSquare,
  Kanban,
  LayoutGrid,
  Shield,
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
    title: "Agenda",
    href: "/crm/agenda",
    icon: CalendarDays,
    description: "Follow-ups e compromissos do dia",
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
