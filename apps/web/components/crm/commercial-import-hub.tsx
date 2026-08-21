"use client"

import Link from "next/link"

import { PermissionGate } from "@/components/auth/permission-gate"
import { Button } from "@/components/ui/button"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { CRM_PAGE_SHELL } from "@/lib/crm/crm-layout-classes"

export function CommercialImportHub() {
  return (
    <div className={CRM_PAGE_SHELL}>
      <CrmPageHeader
        badge="CRM"
        title="Importações"
        description="Importe a carteira existente da corretora sem duplicar CPF/CNPJ."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] p-5">
          <h2 className="font-medium">Leads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Origem, produto de interesse e responsável comercial.
          </p>
          <PermissionGate permission="leads:manage">
            <Button className="mt-4" size="sm" asChild>
              <Link href="/crm/importacoes/leads">Importar leads</Link>
            </Button>
          </PermissionGate>
        </div>
        <div className="rounded-xl border border-white/[0.06] p-5">
          <h2 className="font-medium">Clientes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro + apólice + fila de renovação.
          </p>
          <PermissionGate permission="clients:manage">
            <Button className="mt-4" size="sm" asChild>
              <Link href="/crm/importacoes/clientes">Importar clientes</Link>
            </Button>
          </PermissionGate>
        </div>
      </div>
    </div>
  )
}
