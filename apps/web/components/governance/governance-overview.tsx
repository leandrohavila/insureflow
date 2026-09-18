"use client"

import {
  ACQUISITION_CHANNELS,
  GOVERNANCE_DOMAIN_META,
  GRUPO_AVILA_BUSINESS_UNITS,
  groupPermissionsByDomain,
  type SessionPayload,
} from "@repo/auth"

import { RoleBadge } from "@/components/auth/role-badge"
import { GlassCard } from "@/components/dashboard/glass-card"
import { Badge } from "@/components/ui/badge"
import { useGovernanceRoles } from "@/lib/data-access/modules/governance"

import { mergeRoleProfiles } from "./governance-utils"

type GovernanceOverviewProps = {
  session: SessionPayload
}

export function GovernanceOverview({ session }: GovernanceOverviewProps) {
  const rolesQuery = useGovernanceRoles()
  const mergedRoles = mergeRoleProfiles(rolesQuery.data)
  const grouped = groupPermissionsByDomain(session.permissions)

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em]">
              Seu acesso neste workspace
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Resumo legível das permissões efetivas — sem tokens técnicos
            </p>
          </div>
          <RoleBadge role={session.role} label={session.roleLabel} />
        </div>

        <div className="mb-6 grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Organização
            </p>
            <p className="mt-1 text-sm font-medium">{session.organizationName}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Escopo de dados
            </p>
            <p className="mt-1 text-sm font-medium">{session.dataScope ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Permissões ativas
            </p>
            <p className="mt-1 text-sm font-medium">{session.permissions.length}</p>
          </div>
        </div>

        <div className="space-y-5">
          {Object.entries(grouped).map(([domainId, perms]) => {
            const meta = GOVERNANCE_DOMAIN_META[domainId as keyof typeof GOVERNANCE_DOMAIN_META]
            if (!meta || !perms?.length) return null
            return (
              <div key={domainId} className="rounded-lg border border-white/[0.06] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{meta.label}</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {perms.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {perms.map((perm) => (
                    <Badge
                      key={perm.key}
                      variant="outline"
                      className="rounded-full border-emerald-400/30 bg-emerald-500/10 text-[10px] text-emerald-200"
                    >
                      {perm.action} · {perm.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="mb-4 text-sm font-semibold">Grupo Ávila — empresas</h3>
          <div className="space-y-3">
            {GRUPO_AVILA_BUSINESS_UNITS.map((bu) => (
              <div
                key={bu.slug}
                className="rounded-lg border border-white/[0.06] px-4 py-3"
              >
                <p className="font-medium">{bu.name}</p>
                <p className="text-xs text-muted-foreground">{bu.description}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4 text-sm font-semibold">Perfis cadastrados</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {rolesQuery.isLoading
              ? "Carregando perfis do tenant…"
              : `${mergedRoles.filter((r) => !r.legacy).length} perfis · Fase 2A somente leitura`}
          </p>
          <div className="flex flex-wrap gap-2">
            {mergedRoles
              .filter((r) => !r.legacy)
              .slice(0, 8)
              .map((role) => (
                <Badge key={role.slug} variant="secondary" className="text-[10px]">
                  {role.name}
                  {role.planned ? " (planejado)" : ""}
                </Badge>
              ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-2 text-sm font-semibold">Growth Engine — canais → Lead</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Todos os canais de aquisição devem gerar Lead com origem rastreável e empresa
          (Business Unit) definida.
        </p>
        <div className="flex flex-wrap gap-2">
          {ACQUISITION_CHANNELS.map((channel) => (
            <Badge key={channel.id} variant="outline" className="text-[10px]">
              {channel.label}
            </Badge>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
