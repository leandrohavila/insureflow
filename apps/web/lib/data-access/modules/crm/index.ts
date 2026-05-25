export { formatCurrency, pipelineStages, stageLabelMap } from "./constants"

export { createDeal, deleteDeal, fetchDeals, updateDeal } from "./api"
export {
  useCreateCrmDeal,
  useCrmDeals,
  useDeleteCrmDeal,
  useUpdateCrmDeal,
} from "./hooks"
export type {
  BackendCrmDeal,
  CreateCrmDealInput,
  CrmDeal,
  CrmDealCommercialContext,
  CrmDealQuestionnaireStatus,
  CrmDealLeadSummary,
  CrmDealStatus,
  CrmStageId,
  DealPipelineUpdateInput,
  UpdateCrmDealInput,
} from "./types"
