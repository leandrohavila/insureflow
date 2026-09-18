"use client"

import { useMemo, useState } from "react"

import { GOVERNANCE_DOMAIN_META } from "@repo/auth"

import { GlassCard } from "@/components/dashboard/glass-card"
import { useGovernanceRoles } from "@/lib/data-access/modules/governance"
import { cn } from "@/lib/utils"

import {
  MATRIX_PERMISSION_ROWS,
  filterRolesByBusinessUnit,
  mergeRoleProfiles,
  roleHasPermission,
} from "./governance-utils"

type BuFilter = "todas" | "corretora-avila" | "avila-imoveis"

export function GovernanceMatrixWorkspace() {
  const rolesQuery = useGovernanceRoles()
  const [buFilter, setBuFilter] = useState<BuFilter>("todas")
  const [showTechnical, setShowTechnical] = useState(false)

  const roles = useMemo(() => {
    const merged = mergeRoleProfiles(rolesQuery.data).filter((r) => !r.legacy)
    return filterRolesByBusinessUnit(merged, buFilter).slice(0, 7)
  }, [rolesQuery.data, buFilter])

  const tableRows = useMemo(() => {
    const rows: Array<
      | { kind: "domain"; id: string; label: string }
      | { kind: "perm"; id: string; label: string; action: string; key: string }
    > = []
    let lastDomain = ""
    for (const perm of MATRIX_PERMISSION_ROWS) {
      const domainLabel = GOVERNANCE_DOMAIN_META[perm.domain].label
      if (perm.domain !== lastDomain) {
        rows.push({ kind: "domain", id: `domain-${perm.domain}`, label: domainLabel })
        lastDomain = perm.domain
      }
      rows.push({
        kind: "perm",
        id: perm.key,
        label: perm.label,
        action: perm.action,
        key: perm.key,
      })
    }
    return rows
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {(["todas", "corretora-avila", "avila-imoveis"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setBuFilter(value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs transition-colors",
              buFilter === value
                ? "border-primary/40 bg-primary/12 text-primary"
                : "border-white/[0.08] text-muted-foreground hover:text-foreground",
            )}
          >
            {value === "todas"
              ? "Grupo Ávila"
              : value === "corretora-avila"
                ? "Corretora Ávila"
                : "Ávila Imóveis"}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showTechnical}
            onChange={(e) => setShowTechnical(e.target.checked)}
            className="rounded border-white/20"
          />
          Chaves técnicas
        </label>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th className="px-4 py-3 font-medium">Permissão</th>
                {roles.map((role) => (
                  <th
                    key={role.slug}
                    className="px-3 py-3 text-center text-xs font-medium"
                  >
                    {role.name.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) =>
                row.kind === "domain" ? (
                  <tr key={row.id} className="bg-white/[0.03]">
                    <td
                      colSpan={roles.length + 1}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {row.label}
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{row.label}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {row.action}
                        {showTechnical ? ` · ${row.key}` : ""}
                      </div>
                    </td>
                    {roles.map((role) => (
                      <td key={role.slug} className="px-3 py-2.5 text-center">
                        {roleHasPermission(role, row.key) ? (
                          <span className="text-emerald-400">Sim</span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <p className="text-xs text-muted-foreground">
        Fase 2A — somente leitura. Perfil &quot;Corretor Imobiliário&quot; aparece como planejado
        até seed no banco (Fase 2B).
      </p>
    </div>
  )
}
