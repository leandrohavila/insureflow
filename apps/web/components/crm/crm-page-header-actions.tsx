"use client"

import type { ReactNode } from "react"

import { CrmDensityToggle } from "@/components/crm/interaction"
import { PageActions, PageActionsGroup } from "@/components/design-system"

type CrmPageHeaderActionsProps = {
  /** Grupo 2 — links de navegação contextual (ex.: Visão geral). */
  navigation?: ReactNode
  /** Grupo 3 — ações principais (ex.: Importar, Novo negócio). */
  primary?: ReactNode
}

/**
 * Ações padronizadas do cabeçalho CRM:
 * 1. Preferências (Compacto / Confortável)
 * 2. Navegação (opcional)
 * 3. Ações principais (opcional)
 */
export function CrmPageHeaderActions({
  navigation,
  primary,
}: CrmPageHeaderActionsProps) {
  return (
    <PageActions className="sm:flex-wrap">
      <PageActionsGroup aria-label="Preferências da tela">
        <CrmDensityToggle variant="header" />
      </PageActionsGroup>
      {navigation ? (
        <PageActionsGroup aria-label="Navegação">{navigation}</PageActionsGroup>
      ) : null}
      {primary ? (
        <PageActionsGroup
          variant="primary"
          aria-label="Ações principais"
          className="flex-wrap"
        >
          {primary}
        </PageActionsGroup>
      ) : null}
    </PageActions>
  )
}
