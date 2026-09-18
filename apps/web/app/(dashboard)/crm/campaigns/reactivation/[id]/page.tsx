import { Suspense } from "react"

import { ReactivationCampaignDetailWorkspace } from "@/components/crm/reactivation-campaign-detail-workspace"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ReactivationCampaignDetailPage({
  params,
}: PageProps) {
  const { id } = await params
  return (
    <Suspense>
      <ReactivationCampaignDetailWorkspace campaignId={id} />
    </Suspense>
  )
}
