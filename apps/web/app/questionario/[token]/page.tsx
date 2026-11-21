import type { Metadata } from "next"

import { PublicQuestionnaireForm } from "@/components/questionnaires/public-questionnaire-form"

export const metadata: Metadata = {
  title: "Questionário",
  description: "Preencha o questionário enviado pela Ávila.",
}

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function PublicQuestionnairePage({ params }: PageProps) {
  const { token } = await params
  return <PublicQuestionnaireForm token={token} />
}
