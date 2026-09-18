import { Suspense } from "react"

import { ReactivationCampaignsWorkspace } from "@/components/crm/reactivation-campaigns-workspace"

export default function ReactivationCampaignsPage() {
  return (
    <Suspense>
      <ReactivationCampaignsWorkspace />
    </Suspense>
  )
}
