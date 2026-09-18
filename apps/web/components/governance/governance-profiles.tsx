"use client"

import { useMemo, useState } from "react"

import {
  GOVERNANCE_DOMAIN_META,
  businessUnitScopeLabel,
  groupPermissionsByDomain,
} from "@repo/auth"

import { GlassCard } from "@/components/dashboard/glass-card"
import { Badge } from "@/components/ui/badge"
import { useGovernanceRoles } from "@/lib/data-access/modules/governance"
import { cn } from "@/lib/utils"

import {
  filterRolesByBusinessUnit,
  mergeRoleProfiles,
  type MergedRoleProfile,
} from "./governance-utils"

type BuFilter = "todas" | "corretora-avila" | "avila-imoveis"

export function GovernanceProfilesWorkspace() {
  const rolesQuery = useGovernanceRoles()
  const [selectedSlug, setSelectedSlug] = useState("gerencia")
  const [buFilter, setBuFilter] = useState<BuFilter>("todas")
  const [showTechnical, setShowTechnical] = useState(false)

  const roles = useMemo(() => {
    const merged = mergeRoleProfiles(rolesQuery.data)
    return filterRolesByBusinessUnit(merged, buFilter)
  }, [rolesQuery.data, buFilter])

  const selected =
    roles.find((r) => r.slug === selectedSlug) ?? roles[0] ?? null

  return (
    <div className="space-y-6">
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
          Mostrar chaves técnicas
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <GlassCard className="p-4 md:p-6">
          <h3 className="mb-4 text-sm font-semibold">Perfis</h3>
          <div className="space-y-2">
            {roles.map((role) => (
              <RoleListItem
                key={role.slug}
                role={role}
                active={selected?.slug === role.slug}
                onSelect={() => setSelectedSlug(role.slug)}
              />
            ))}
          </div>
        </GlassCard>

        {selected ? (
          <GlassCard className="p-4 md:p-6">
            <ProfileDetail role={selected} showTechnical={showTechnical} />
          </GlassCard>
        ) : null}
      </div>
    </div>
  )
}

function RoleListItem({
  role,
  active,
  onSelect,
}: {
  role: MergedRoleProfile
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border px-3 py-3 text-left transition-colors",
        active
          ? "border-primary/30 bg-primary/5"
          : "border-white/[0.06] hover:border-white/12",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{role.name}</span>
        {role.planned ? (
          <Badge variant="outline" className="text-[9px]">
            Planejado
          </Badge>
        ) : null}
        {role.legacy ? (
          <Badge variant="outline" className="text-[9px] text-amber-200">
            Legado
          </Badge>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
    </button>
  )
}

function ProfileDetail({
  role,
  showTechnical,
}: {
  role: MergedRoleProfile
  showTechnical: boolean
}) {
  const grouped = groupPermissionsByDomain(role.permissionKeys)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{role.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
        </div>
        <Badge variant="secondary">{role.permissionKeys.length} permissões</Badge>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Meta label="Escopo de dados" value={role.dataScope} />
        <Meta label="Empresa" value={businessUnitScopeLabel(role.businessUnitScope)} />
        <Meta
          label="Fonte"
          value={
            role.source === "merged"
              ? "Catálogo + banco (live)"
              : role.planned
                ? "Catálogo (ainda não no banco)"
                : "Catálogo / banco"
          }
        />
        <Meta label="Slug" value={showTechnical ? role.slug : "—"} />
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([domainId, perms]) => {
          const meta = GOVERNANCE_DOMAIN_META[domainId as keyof typeof GOVERNANCE_DOMAIN_META]
          if (!meta || !perms?.length) return null
          return (
            <div key={domainId} className="rounded-lg border border-white/[0.06] p-4">
              <h3 className="mb-3 text-sm font-semibold">{meta.label}</h3>
              <ul className="space-y-2">
                {perms.map((perm) => (
                  <li key={perm.key} className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-[9px]">
                      {perm.action}
                    </Badge>
                    <span>{perm.label}</span>
                    {showTechnical ? (
                      <code className="text-[10px] text-muted-foreground">{perm.key}</code>
                    ) : null}
                    {perm.moduleNote ? (
                      <span className="text-[10px] text-muted-foreground">
                        · {perm.moduleNote}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  )
}
