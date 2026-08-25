"use client"

import { GRUPO_AVILA_BUSINESS_UNITS, hasPermission, type SessionPayload } from "@repo/auth"

import { GlassCard } from "@/components/dashboard/glass-card"
import { BusinessUnitsManager } from "@/components/settings/business-units-manager"
import { Badge } from "@/components/ui/badge"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import { useGovernanceUsers } from "@/lib/data-access/modules/governance"

type GovernanceCompaniesWorkspaceProps = {
  session: SessionPayload
}

export function GovernanceCompaniesWorkspace({
  session,
}: GovernanceCompaniesWorkspaceProps) {
  const unitsQuery = useBusinessUnits()
  const canManage = hasPermission(session, "settings:manage")
  const usersQuery = useGovernanceUsers(hasPermission(session, "users:manage"))

  const units = unitsQuery.data ?? []

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {GRUPO_AVILA_BUSINESS_UNITS.map((catalog) => {
          const live = units.find((u) => u.slug === catalog.slug)
          return (
            <GlassCard key={catalog.slug} className="p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-semibold">{catalog.name}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {catalog.type === "INSURANCE" ? "Seguros" : "Imobiliária"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{catalog.description}</p>
              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                <p>Slug: {catalog.slug}</p>
                {live ? (
                  <p className="text-emerald-300/90">Cadastrada · ID {live.id.slice(0, 8)}…</p>
                ) : (
                  <p className="text-amber-200/90">Aguardando sincronização com API</p>
                )}
              </div>
            </GlassCard>
          )
        })}
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-2 text-sm font-semibold">Separação por Business Unit</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Corretora Ávila (seguros) e Ávila Imóveis operam com escopo isolado via membership em{" "}
          <code className="text-xs">user_business_units</code> e filtros ACL na API. Usuários
          sem vínculo não enxergam dados de nenhuma empresa.
        </p>
        <MembershipPreview users={usersQuery.data} />
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Unidades cadastradas</h3>
            <p className="text-xs text-muted-foreground">
              {canManage
                ? "Edição disponível para administradores (API: settings:manage)."
                : "Somente leitura — edição requer permissão de administrador."}
            </p>
          </div>
          <Badge variant="secondary">Fase 2A</Badge>
        </div>
        {canManage ? (
          <BusinessUnitsManager />
        ) : (
          <div className="space-y-2">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="rounded-lg border border-white/[0.06] px-4 py-3"
              >
                <p className="font-medium">{unit.name}</p>
                <p className="text-xs text-muted-foreground">
                  {unit.type} · {unit.slug}
                </p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

function MembershipPreview({
  users,
}: {
  users: Awaited<ReturnType<typeof import("@/lib/data-access/modules/governance").fetchUsers>> | undefined
}) {
  if (!users?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Vínculos usuário × empresa requerem permissão de listar usuários. Estado conhecido em prod:
        apenas admin@ vinculado às duas empresas (pós-limpeza demo).
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
            <th className="pb-2 font-medium">Usuário</th>
            <th className="pb-2 text-center font-medium">Corretora Ávila</th>
            <th className="pb-2 text-center font-medium">Ávila Imóveis</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-white/[0.04]">
              <td className="py-2 text-muted-foreground">{user.email}</td>
              <td className="py-2 text-center text-muted-foreground">—</td>
              <td className="py-2 text-center text-muted-foreground">—</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[11px] text-muted-foreground">
        API de memberships (user_business_units) prevista para Fase 2B — colunas exibirão vínculos
        reais.
      </p>
    </div>
  )
}
