"use client"

import { hasPermission, type SessionPayload } from "@repo/auth"

import { GlassCard } from "@/components/dashboard/glass-card"
import { Badge } from "@/components/ui/badge"
import { useGovernanceUsers } from "@/lib/data-access/modules/governance"

type GovernanceUsersWorkspaceProps = {
  session: SessionPayload
}

export function GovernanceUsersWorkspace({ session }: GovernanceUsersWorkspaceProps) {
  const canList = hasPermission(session, "users:manage")
  const usersQuery = useGovernanceUsers(canList)

  if (!canList) {
    return (
      <GlassCard className="p-6 md:p-8">
        <h3 className="text-sm font-semibold">Acesso restrito</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          A listagem de usuários exige a permissão de administrar usuários. Você ainda
          pode consultar perfis e matriz de permissões neste módulo.
        </p>
      </GlassCard>
    )
  }

  if (usersQuery.isLoading) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">Carregando usuários…</p>
      </GlassCard>
    )
  }

  if (usersQuery.isError) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar usuários. Verifique sua sessão ou permissões.
        </p>
      </GlassCard>
    )
  }

  const users = usersQuery.data ?? []

  return (
    <div className="space-y-4">
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Perfis</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Último login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.title}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.userRoles.map((ur) => (
                        <Badge key={ur.roleId} variant="outline" className="text-[10px]">
                          {ur.role.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        user.isActive
                          ? "border-emerald-400/30 text-emerald-200"
                          : "text-muted-foreground"
                      }
                    >
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <p className="text-xs text-muted-foreground">
        Fase 2A — somente leitura. Vínculos usuário × empresa serão exibidos na aba Empresas
        (Fase 2B).
      </p>
    </div>
  )
}
