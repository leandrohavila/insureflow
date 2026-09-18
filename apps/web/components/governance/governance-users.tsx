"use client"

import { useState } from "react"

import { hasPermission, type SessionPayload } from "@repo/auth"

import { GlassCard } from "@/components/dashboard/glass-card"
import { GovernanceUserFormDialog } from "@/components/governance/governance-user-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  useGovernanceUsers,
  useSetUserStatus,
} from "@/lib/data-access/modules/governance"
import type { GovernanceUser } from "@/lib/data-access/modules/governance"

type GovernanceUsersWorkspaceProps = {
  session: SessionPayload
}

export function GovernanceUsersWorkspace({ session }: GovernanceUsersWorkspaceProps) {
  const canManage = hasPermission(session, "users:manage")
  const usersQuery = useGovernanceUsers(canManage)
  const setStatus = useSetUserStatus()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedUser, setSelectedUser] = useState<GovernanceUser | null>(null)

  if (!canManage) {
    return (
      <GlassCard className="p-6 md:p-8">
        <h3 className="text-sm font-semibold">Acesso restrito</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          A gestão de usuários exige a permissão <code>users:manage</code>.
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

  function openCreate() {
    setDialogMode("create")
    setSelectedUser(null)
    setDialogOpen(true)
  }

  function openEdit(user: GovernanceUser) {
    setDialogMode("edit")
    setSelectedUser(user)
    setDialogOpen(true)
  }

  async function toggleActive(user: GovernanceUser) {
    await setStatus.mutateAsync({ id: user.id, isActive: !user.isActive })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Gerencie usuários, perfis e empresas sem scripts. Todas as ações são
          auditadas.
        </p>
        <Button type="button" size="sm" onClick={openCreate}>
          Adicionar usuário
        </Button>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Perfis</th>
                <th className="px-4 py-3 font-medium">Empresas</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
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
                    <div className="text-xs text-muted-foreground">
                      {user.title || "—"}
                    </div>
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
                    <div className="flex flex-wrap gap-1">
                      {(user.businessUnits ?? []).map((link) => (
                        <Badge
                          key={link.businessUnitId}
                          variant="outline"
                          className="text-[10px]"
                        >
                          {link.businessUnit.name}
                          {user.currentBusinessUnitId === link.businessUnitId
                            ? " · principal"
                            : ""}
                        </Badge>
                      ))}
                      {(user.businessUnits ?? []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleString("pt-BR")}
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(user)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          setStatus.isPending || user.id === session.id
                        }
                        onClick={() => void toggleActive(user)}
                      >
                        {user.isActive ? "Inativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum usuário cadastrado. Use &quot;Adicionar usuário&quot; para começar.
        </p>
      ) : null}

      <GovernanceUserFormDialog
        open={dialogOpen}
        mode={dialogMode}
        user={selectedUser}
        session={session}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
