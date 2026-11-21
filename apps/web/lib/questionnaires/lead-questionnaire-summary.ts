export const QUESTIONNAIRE_BRANCH_LABELS = {
  auto: "Automóvel",
  residencial: "Residencial",
  empresarial: "Empresarial",
} as const

export function questionnaireBranchLabel(branch?: string | null) {
  if (!branch) return null
  if (branch in QUESTIONNAIRE_BRANCH_LABELS) {
    return QUESTIONNAIRE_BRANCH_LABELS[
      branch as keyof typeof QUESTIONNAIRE_BRANCH_LABELS
    ]
  }
  return null
}

export function questionnaireFillOriginLabel(mode?: string | null) {
  return mode === "EXTERNAL" ? "Cliente" : "Corretor"
}

export function questionnaireCanContinue(status: string) {
  return status === "draft" || status === "in_progress"
}

export function questionnaireCanReview(status: string) {
  return status !== "draft" && status !== "in_progress"
}
