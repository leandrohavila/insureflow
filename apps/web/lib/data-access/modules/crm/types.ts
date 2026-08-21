export type CrmStageId =
  | "novo"
  | "qualificacao"
  | "contato"
  | "cotacao"
  | "visita"
  | "proposta"
  | "negociacao"
  | "contrato"
  | "fechamento"
  | "fechado"

export type CrmDealStatus = "open" | "won" | "lost" | "archived"

export type CrmDealQuestionnaireStatus =
  | "pending"
  | "draft"
  | "submitted"
  | "reviewed"
  | "archived"

export type CrmDealQuoteSummary = {
  comparisonId: string
  workflowStatus: string
  title: string | null
  lineCount: number
  hasSelectedQuote: boolean
  updatedAt: string
}

export type CrmDealCommercialContext = {
  questionnaire: {
    status: CrmDealQuestionnaireStatus
    submissionId: string | null
    updatedAt: string | null
  }
  quote: CrmDealQuoteSummary | null
  phone: string | null
  lastContactAt: string | null
  lastInteractionAt: string | null
  responsible: string | null
}

export type CrmDealLeadSummary = {
  id: string
  name: string
  assignedTo?: string | null
  status?: string | null
  phone?: string | null
  email?: string | null
  lastContactAt?: string | null
}

export type CrmDeal = {
  id: string
  tenantId: string
  title: string
  company: string
  value: number
  stage: CrmStageId
  status: CrmDealStatus
  pipelineOrder: number
  assignedTo?: string | null
  email?: string
  createdAt: string
  updatedAt: string
  contact: string
  owner: string
  ownerInitials: string
  priority: "alta" | "media" | "baixa"
  product: string
  lastActivity: string
  tags: string[]
  convertedLead?: CrmDealLeadSummary | null
  commercialContext?: CrmDealCommercialContext | null
  customerId?: string | null
  wonAt?: string | null
  businessUnit?: {
    id: string
    name: string
    slug: string
    type: "INSURANCE" | "REAL_ESTATE"
    isActive?: boolean
  } | null
  sourceType?: "LEAD" | "RENEWAL" | "CROSS_SELL" | "MANUAL" | "REACTIVATION" | null
  score?: "LOW" | "MEDIUM" | "HIGH" | null
  pipeline?: { id: string; name: string } | null
  sla?: {
    status: "ok" | "warning" | "overdue"
    dueAt: string | null
    elapsedHours: number
    alertTarget: "OWNER" | "MANAGER" | null
    color: string | null
    stageLabel: string | null
  } | null
}

export type CreateCrmDealInput = {
  title: string
  company: string
  value: number
  stage: CrmStageId
  status: CrmDealStatus
  assignedTo?: string
  /** Reservado — não enviado no POST; o backend atribui ordem no estágio. */
  pipelineOrder?: number
}

export type UpdateCrmDealInput = Partial<CreateCrmDealInput>

export type DealPipelineUpdateInput = {
  stage: CrmStageId
  pipelineOrder: number
}

export type BackendCrmDeal = {
  id: string
  tenantId: string
  title: string
  company: string
  value: number | string
  stage: CrmStageId
  status: CrmDealStatus
  pipelineOrder?: number | string
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
  convertedLead?: CrmDealLeadSummary | null
  commercialContext?: CrmDealCommercialContext | null
  customerId?: string | null
  wonAt?: string | null
  businessUnit?: {
    id: string
    name: string
    slug: string
    type: "INSURANCE" | "REAL_ESTATE"
    isActive?: boolean
  } | null
  sourceType?: "LEAD" | "RENEWAL" | "CROSS_SELL" | "MANUAL" | "REACTIVATION" | null
  score?: "LOW" | "MEDIUM" | "HIGH" | null
  pipeline?: { id: string; name: string } | null
  sla?: CrmDeal["sla"]
}
