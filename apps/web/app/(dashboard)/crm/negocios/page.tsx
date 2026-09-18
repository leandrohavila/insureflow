import { Suspense } from "react"

import { DealsPage } from "@/components/crm/deals-page"
import { LoadingState } from "@/components/shared"

export default function CrmDealsRoute() {
  return (
    <Suspense fallback={<LoadingState label="Carregando negócios…" />}>
      <DealsPage />
    </Suspense>
  )
}
