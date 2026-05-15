import {
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type AppRole,
  type Permission,
  type SessionPayload,
} from "@repo/auth"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/dashboard/glass-card"
import { RoleBadge } from "@/components/auth/role-badge"
import { cn } from "@/lib/utils"

const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard:view": "Dashboard",
  "crm:view": "CRM (leitura)",
  "crm:manage": "CRM (edição)",
  "clients:view": "Clientes (leitura)",
  "clients:manage": "Clientes (edição)",
  "leads:view": "Leads (leitura)",
  "leads:manage": "Leads (edição)",
  "questionnaires:view": "Questionários (leitura)",
  "questionnaires:manage": "Questionários (edição)",
  "quotes:view": "Cotações (leitura)",
  "quotes:manage": "Cotações (edição)",
  "policies:view": "Apólices (leitura)",
  "policies:manage": "Apólices (edição)",
  "claims:view": "Sinistros (leitura)",
  "claims:manage": "Sinistros (edição)",
  "whatsapp:view": "WhatsApp (leitura)",
  "whatsapp:manage": "WhatsApp (edição)",
  "automation:view": "Automação (leitura)",
  "automation:manage": "Automação (edição)",
  "settings:view": "Configurações (leitura)",
  "settings:manage": "Configurações (edição)",
  "users:manage": "Gestão de usuários",
  "audit:view": "Auditoria",
}

type PermissionsPanelProps = {
  session: SessionPayload
}

export function PermissionsPanel({ session }: PermissionsPanelProps) {
  const granted = new Set(session.permissions)

  return (
    <GlassCard className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em]">Controle de acesso (RBAC)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permissões efetivas do seu perfil neste workspace
          </p>
        </div>
        <RoleBadge role={session.role} label={session.roleLabel} />
      </div>

      <div className="mb-6 grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            Organização
          </p>
          <p className="mt-1 text-sm font-medium">{session.organizationName}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            Cargo
          </p>
          <p className="mt-1 text-sm font-medium">{session.title}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {session.permissions.map((permission) => (
          <Badge
            key={permission}
            variant="outline"
            className="rounded-full border-emerald-400/30 bg-emerald-500/10 text-[10px] text-emerald-200"
          >
            {PERMISSION_LABELS[permission]}
          </Badge>
        ))}
      </div>

      <details className="mt-8 group">
        <summary className="cursor-pointer text-sm font-medium text-primary">
          Comparar perfis do sistema
        </summary>
        <div className="mt-4 space-y-4">
          {(Object.keys(ROLE_PERMISSIONS) as AppRole[]).map((role) => (
            <div
              key={role}
              className={cn(
                "rounded-lg border border-white/[0.06] p-4",
                role === session.role && "border-primary/30 bg-primary/5"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <RoleBadge role={role} label={ROLE_LABELS[role]} />
                <span className="text-xs text-muted-foreground">
                  {ROLE_PERMISSIONS[role].length} permissões
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {ROLE_PERMISSIONS[role].map((p) => (
                  <span
                    key={p}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px]",
                      granted.has(p)
                        ? "bg-white/[0.06] text-muted-foreground"
                        : "text-muted-foreground/40"
                    )}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </GlassCard>
  )
}
