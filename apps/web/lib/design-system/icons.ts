import {
  AlertTriangle,
  Archive,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  Filter,
  Kanban,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  UserPlus,
  Users,
  Workflow,
  XCircle,
  type LucideIcon,
} from "lucide-react"

export type DsIconCategory =
  | "app"
  | "module"
  | "entity"
  | "status"
  | "action"

export const dsIconSize = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
  xl: "size-6",
} as const

export const appIcons = {
  brand: Shield,
  notification: Bell,
} satisfies Record<string, LucideIcon>

export const moduleIcons = {
  dashboard: LayoutDashboard,
  crm: Kanban,
  clients: Users,
  leads: UserPlus,
  questionnaires: ClipboardList,
  quotes: FileSpreadsheet,
  policies: Shield,
  claims: AlertTriangle,
  whatsapp: MessageCircle,
  automation: Workflow,
  settings: Settings,
} satisfies Record<string, LucideIcon>

export const entityIcons = {
  company: Building2,
  customer: Users,
  lead: UserPlus,
  activity: CalendarDays,
  policy: Shield,
  claim: AlertTriangle,
  document: FileSpreadsheet,
  archive: Archive,
} satisfies Record<string, LucideIcon>

export const statusIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} satisfies Record<string, LucideIcon>

export const actionIcons = {
  create: Plus,
  search: Search,
  filter: Filter,
  tune: SlidersHorizontal,
} satisfies Record<string, LucideIcon>
