import { Badge } from "@/components/ui/badge"
import type { AppRole } from "@repo/auth"
import { cn } from "@/lib/utils"

const roleStyles: Record<AppRole, string> = {
  super_admin: "border-violet-400/35 bg-violet-500/15 text-violet-200",
  admin: "border-primary/35 bg-primary/15 text-primary",
  gerencia: "border-indigo-400/35 bg-indigo-500/10 text-indigo-200",
  comercial: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
  operacional: "border-cyan-400/35 bg-cyan-500/10 text-cyan-200",
  financeiro: "border-amber-400/35 bg-amber-500/10 text-amber-200",
  parceiro: "border-orange-400/35 bg-orange-500/10 text-orange-200",
  leitura: "border-white/20 bg-white/[0.05] text-muted-foreground",
  sales: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
  broker: "border-sky-400/35 bg-sky-500/10 text-sky-200",
  underwriter: "border-amber-400/35 bg-amber-500/10 text-amber-200",
  viewer: "border-white/20 bg-white/[0.05] text-muted-foreground",
}

type RoleBadgeProps = {
  role: AppRole
  label: string
  className?: string
}

export function RoleBadge({ role, label, className }: RoleBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full text-[10px] font-semibold", roleStyles[role], className)}
    >
      {label}
    </Badge>
  )
}
