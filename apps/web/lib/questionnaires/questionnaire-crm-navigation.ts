const CRM_FROM_MARKER = "insureflow:questionnaire-from-crm"

export const DEFAULT_CRM_QUESTIONNAIRE_RETURN = "/crm/negocios"

export type QuestionnaireCrmContextParams = {
  dealId: string
  dealName: string
  leadId?: string | null
  returnTo: string
}

export type QuestionnaireCrmContext = {
  dealId: string | null
  dealName: string | null
  returnTo: string
  leadId: string | null
}

export function buildCrmReturnHref(
  dealId: string,
  currentSearch = "",
): string {
  const params = new URLSearchParams(currentSearch)
  params.set("deal", dealId)
  const query = params.toString()
  return query
    ? `${DEFAULT_CRM_QUESTIONNAIRE_RETURN}?${query}`
    : `${DEFAULT_CRM_QUESTIONNAIRE_RETURN}?deal=${dealId}`
}

export function buildCrmQuestionnaireResponsesHref(
  params: QuestionnaireCrmContextParams,
): string {
  const search = new URLSearchParams()
  search.set("dealId", params.dealId)
  search.set("from", "crm")
  search.set("returnTo", params.returnTo)
  search.set("dealName", params.dealName)
  if (params.leadId) {
    search.set("leadId", params.leadId)
  }
  return `/questionarios/respostas?${search.toString()}`
}

export function markQuestionnaireCrmNavigation(returnTo: string) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(CRM_FROM_MARKER, returnTo)
  } catch {
    // quota or private mode
  }
}

export function parseQuestionnaireCrmContext(
  searchParams: Pick<URLSearchParams, "get">,
): QuestionnaireCrmContext | null {
  if (searchParams.get("from") !== "crm") return null

  return {
    dealId: searchParams.get("dealId"),
    dealName: searchParams.get("dealName"),
    returnTo:
      searchParams.get("returnTo") ?? DEFAULT_CRM_QUESTIONNAIRE_RETURN,
    leadId: searchParams.get("leadId"),
  }
}

export function resolveCrmBackLabel(context: QuestionnaireCrmContext): string {
  if (context.dealId || context.dealName) return "Voltar ao negócio"
  return "Voltar ao funil"
}

type AppRouter = {
  back: () => void
  push: (href: string) => void
}

export function navigateBackToCrm(router: AppRouter, returnTo: string) {
  const fallback = returnTo || DEFAULT_CRM_QUESTIONNAIRE_RETURN

  let storedReturn: string | null = null
  try {
    storedReturn = sessionStorage.getItem(CRM_FROM_MARKER)
    if (storedReturn) sessionStorage.removeItem(CRM_FROM_MARKER)
  } catch {
    // ignore
  }

  const canUseHistoryBack =
    typeof window !== "undefined" && window.history.length > 1

  if (canUseHistoryBack && storedReturn) {
    router.back()
    return
  }

  router.push(storedReturn ?? fallback)
}
