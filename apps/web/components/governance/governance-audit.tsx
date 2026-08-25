"use client"

import { hasPermission, type SessionPayload } from "@repo/auth"

import { GlassCard } from "@/components/dashboard/glass-card"
import { Badge } from "@/components/ui/badge"
import { useAuditLogs } from "@/lib/data-access/modules/governance"

type GovernanceAuditWorkspaceProps = {
  session: SessionPayload
}

export function GovernanceAuditWorkspace({ session }: GovernanceAuditWorkspaceProps) {
  const canView = hasPermission(session, "audit:view")
  const auditQuery = useAuditLogs({ take: 50 }, canView)

  if (!canView) {
    return (
      <GlassCard className="p-6 md:p-8">
        <h3 className="text-sm font-semibold">Acesso restrito</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          A trilha de auditoria exige permissão de visualização de auditoria.
        </p>
      </GlassCard>
    )
  }

  if (auditQuery.isLoading) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">Carregando eventos…</p>
      </GlassCard>
    )
  }

  if (auditQuery.isError) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar auditoria.
        </p>
      </GlassCard>
    )
  }

  const logs = auditQuery.data ?? []

  return (
    <div className="space-y-4">
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Quem</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Recurso</th>
                <th className="px-4 py-3 font-medium">Nível</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum evento registrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.user?.email ?? log.userId ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.resource}
                      {log.resourceId ? ` · ${log.resourceId.slice(0, 8)}…` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">
                        {log.severity}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <p className="text-xs text-muted-foreground">
        Fase 2A — somente leitura · últimos 50 eventos
      </p>
    </div>
  )
}
