import { Suspense } from "react"

import { CommercialReactivationsWorkspace } from "@/components/crm/commercial-reactivations-workspace"

export default function CrmReativacoesPage() {
  return (
    <Suspense>
      <CommercialReactivationsWorkspace />
    </Suspense>
  )
}
