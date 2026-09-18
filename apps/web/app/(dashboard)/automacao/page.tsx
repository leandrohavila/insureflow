import Link from "next/link"

import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { AutomationNav } from "@/components/settings/settings-subnav"
import { requirePermission } from "@/lib/auth/guards"

export default async function AutomationPage() {
  await requirePermission("automation:view")

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8 md:py-10">
      <CrmPageHeader
        badge="Automação"
        title="Automação comercial"
        description="Reative leads perdidos, padronize mensagens e sugira cross-sell entre corretora e imobiliária."
      />
      <AutomationNav />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/automacao/reativacao"
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-primary/30"
        >
          <h2 className="font-semibold">Reativação de leads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Agenda automática para leads perdidos após o período configurado.
          </p>
        </Link>
        <Link
          href="/automacao/comunicacao"
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-primary/30"
        >
          <h2 className="font-semibold">Comunicação comercial</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Logs, respostas e provider (interno agora; WhatsApp depois).
          </p>
        </Link>
        <Link
          href="/automacao/templates"
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-primary/30"
        >
          <h2 className="font-semibold">Templates de mensagem</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            WhatsApp e e-mail com variáveis de nome, interesse e corretor.
          </p>
        </Link>
        <Link
          href="/automacao/cross-sell"
          className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-primary/30"
        >
          <h2 className="font-semibold">Cross-sell</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sugestões entre seguro e imóvel a partir dos interesses do cliente.
          </p>
        </Link>
      </div>
    </div>
  )
}
