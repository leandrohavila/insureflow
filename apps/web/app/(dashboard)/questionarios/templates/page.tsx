import { QuestionnaireTemplatesPage } from "@/components/questionnaires/questionnaire-templates-page"
import { requirePermission } from "@/lib/auth/guards"

export default async function QuestionnaireTemplatesRoute() {
  await requirePermission("questionnaires:view")
  return <QuestionnaireTemplatesPage />
}
