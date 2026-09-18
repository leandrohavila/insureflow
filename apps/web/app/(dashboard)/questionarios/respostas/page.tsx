import { Suspense } from "react"

import { QuestionnaireSubmissionsPage } from "@/components/questionnaires/questionnaire-submissions-page"
import { LoadingState } from "@/components/shared"
import { requirePermission } from "@/lib/auth/guards"

export default async function QuestionnaireSubmissionsRoute() {
  await requirePermission("questionnaires:view")

  return (
    <Suspense fallback={<LoadingState label="Carregando respostas…" />}>
      <QuestionnaireSubmissionsPage />
    </Suspense>
  )
}
