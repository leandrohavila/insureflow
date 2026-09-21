import { redirect } from "next/navigation"

import { REACTIVATION_CAMPAIGNS_PATH } from "@/lib/crm/reactivation-campaigns"

export default function CampanhasReativacaoAliasPage() {
  redirect(REACTIVATION_CAMPAIGNS_PATH)
}
