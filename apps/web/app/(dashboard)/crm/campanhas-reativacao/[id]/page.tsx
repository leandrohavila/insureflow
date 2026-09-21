import { redirect } from "next/navigation"

import { reactivationCampaignPath } from "@/lib/crm/reactivation-campaigns"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CampanhasReativacaoDetailAliasPage({
  params,
}: PageProps) {
  const { id } = await params
  redirect(reactivationCampaignPath(id))
}
