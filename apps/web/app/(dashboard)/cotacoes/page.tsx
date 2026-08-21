import { Suspense } from "react"

import { QuotesPage } from "@/components/quotes/quotes-page"
import { LoadingState } from "@/components/shared"
import { requirePermission } from "@/lib/auth/guards"

export default async function CotacoesRoute() {
  await requirePermission("quotes:view")

  return (
    <Suspense fallback={<LoadingState label="Carregando cotações…" />}>
      <QuotesPage />
    </Suspense>
  )
}
