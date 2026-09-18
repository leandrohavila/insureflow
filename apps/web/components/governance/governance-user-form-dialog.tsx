"use client"

import { useEffect, useMemo, useState } from "react"

import type { SessionPayload } from "@repo/auth"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useBusinessUnits } from "@/lib/data-access/modules/business-units"
import {
  useAssignableRoles,
  useChangeUserPassword,
  useCreateUser,
  useSetUserBusinessUnits,
  useSetUserRoles,
  useUpdateUser,
} from "@/lib/data-access/modules/governance"
import type { GovernanceUser } from "@/lib/data-access/modules/governance"

type Mode = "create" | "edit"

type GovernanceUserFormDialogProps = {
  open: boolean
  mode: Mode
  user?: GovernanceUser | null
  session: SessionPayload
  onOpenChange: (open: boolean) => void
}

export function GovernanceUserFormDialog({
  open,
  mode,
  user,
  onOpenChange,
}: GovernanceUserFormDialogProps) {
  const rolesQuery = useAssignableRoles(open)
  const unitsQuery = useBusinessUnits()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const changePassword = useChangeUserPassword()
  const setRoles = useSetUserRoles()
  const setBusinessUnits = useSetUserBusinessUnits()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [businessUnitIds, setBusinessUnitIds] = useState<string[]>([])
  const [primaryBusinessUnitId, setPrimaryBusinessUnitId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<"profile" | "access">("profile")

  const roles = rolesQuery.data ?? []
  const units = unitsQuery.data ?? []

  useEffect(() => {
    if (!open) return
    setError(null)
    setTab("profile")
    if (mode === "edit" && user) {
      setEmail(user.email)
      setName(user.name)
      setTitle(user.title ?? "")
      setPassword("")
      setNewPassword("")
      setRoleIds(user.userRoles.map((ur) => ur.roleId))
      const buIds = user.businessUnits?.map((l) => l.businessUnitId) ?? []
      setBusinessUnitIds(buIds)
      setPrimaryBusinessUnitId(user.currentBusinessUnitId ?? buIds[0] ?? "")
    } else {
      setEmail("")
      setName("")
      setTitle("")
      setPassword("")
      setNewPassword("")
      setRoleIds([])
      setBusinessUnitIds([])
      setPrimaryBusinessUnitId("")
    }
  }, [open, mode, user])

  const isPending =
    createUser.isPending ||
    updateUser.isPending ||
    changePassword.isPending ||
    setRoles.isPending ||
    setBusinessUnits.isPending

  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        id: r.id,
        label: `${r.name} (${r.slug})`,
        slug: r.slug,
      })),
    [roles],
  )

  function toggleRole(id: string) {
    setRoleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleUnit(id: string) {
    setBusinessUnitIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
      if (!next.includes(primaryBusinessUnitId)) {
        setPrimaryBusinessUnitId(next[0] ?? "")
      }
      return next
    })
  }

  async function handleSubmit() {
    setError(null)
    try {
      if (mode === "create") {
        if (roleIds.length === 0) {
          setError("Selecione ao menos um perfil")
          return
        }
        if (businessUnitIds.length === 0) {
          setError("Selecione ao menos uma empresa")
          return
        }
        await createUser.mutateAsync({
          email,
          password,
          name,
          title: title || undefined,
          roleIds,
          businessUnitIds,
          primaryBusinessUnitId: primaryBusinessUnitId || undefined,
        })
      } else if (user) {
        if (businessUnitIds.length === 0) {
          setError("Usuário deve manter ao menos uma empresa vinculada")
          return
        }
        await updateUser.mutateAsync({
          id: user.id,
          input: { email, name, title: title || undefined },
        })
        if (newPassword.trim().length >= 8) {
          await changePassword.mutateAsync({
            id: user.id,
            password: newPassword,
          })
        }
        if (roleIds.length > 0) {
          await setRoles.mutateAsync({ id: user.id, roleIds })
        }
        await setBusinessUnits.mutateAsync({
          id: user.id,
          businessUnitIds,
          primaryBusinessUnitId: primaryBusinessUnitId || null,
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar o usuário",
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto border-white/[0.08] bg-background/95 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo usuário" : "Editar usuário"}
          </DialogTitle>
          <DialogDescription>
            Criação e gestão de acesso sem scripts. Alterações geram auditoria.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b border-white/[0.06] pb-2">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${tab === "profile" ? "bg-white/10" : "text-muted-foreground"}`}
            onClick={() => setTab("profile")}
          >
            Dados
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${tab === "access" ? "bg-white/10" : "text-muted-foreground"}`}
            onClick={() => setTab("access")}
          >
            Perfis e empresas
          </button>
        </div>

        {tab === "profile" ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="gov-user-name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="gov-user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="gov-user-email" className="text-sm font-medium">
                E-mail
              </label>
              <Input
                id="gov-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="gov-user-title" className="text-sm font-medium">
                Cargo / título
              </label>
              <Input
                id="gov-user-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {mode === "create" ? (
              <div className="space-y-2">
                <label htmlFor="gov-user-password" className="text-sm font-medium">
                  Senha inicial
                </label>
                <Input
                  id="gov-user-password"
                  type="password"
                  value={password}
                  minLength={8}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="gov-user-new-password" className="text-sm font-medium">
                  Nova senha (opcional)
                </label>
                <Input
                  id="gov-user-new-password"
                  type="password"
                  value={newPassword}
                  minLength={8}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Deixe vazio para manter"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <span className="text-sm font-medium">Perfis</span>
              <div className="flex flex-col gap-2 rounded-lg border border-white/[0.08] p-3">
                {roleOptions.map((role) => (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={roleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                    />
                    {role.label}
                  </label>
                ))}
                {roleOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Carregando perfis…
                  </p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Empresas</span>
              <div className="flex flex-col gap-2 rounded-lg border border-white/[0.08] p-3">
                {units.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={businessUnitIds.includes(unit.id)}
                      onChange={() => toggleUnit(unit.id)}
                    />
                    {unit.name}
                  </label>
                ))}
              </div>
            </div>
            {businessUnitIds.length > 0 ? (
              <div className="space-y-2">
                <label htmlFor="gov-user-primary-bu" className="text-sm font-medium">
                  Empresa principal
                </label>
                <select
                  id="gov-user-primary-bu"
                  className="w-full rounded-md border border-white/[0.08] bg-background px-3 py-2 text-sm"
                  value={primaryBusinessUnitId}
                  onChange={(e) => setPrimaryBusinessUnitId(e.target.value)}
                >
                  {businessUnitIds.map((id) => {
                    const unit = units.find((u) => u.id === id)
                    return (
                      <option key={id} value={id}>
                        {unit?.name ?? id}
                      </option>
                    )
                  })}
                </select>
              </div>
            ) : null}
          </div>
        )}

        {error ? (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={isPending} onClick={() => void handleSubmit()}>
            {isPending ? "Salvando…" : mode === "create" ? "Criar usuário" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
