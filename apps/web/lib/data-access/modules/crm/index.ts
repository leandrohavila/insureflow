export { formatCurrency, pipelineStages, realEstatePipelineStages, allPipelineStages, stageLabelMap } from "./constants"

export { createDeal, deleteDeal, fetchDeals, updateDeal, updateDealPipelinePosition } from "./api"
export { CRM_DEAL_API_CONTRACT } from "./deal-contract"
export {
  useCreateCrmDeal,
  useCrmDeals,
  useCrmPipelines,
  useExecutiveDashboard,
  useSlaDashboard,
  usePerformanceDashboard,
  usePerformanceRanking,
  useSalesTargets,
  useDeleteCrmDeal,
  useUpdateCrmDeal,
  useUpdateCrmDealPipeline,
} from "./hooks"
export type {
  BackendCrmDeal,
  CreateCrmDealInput,
  CrmDeal,
  CrmDealCommercialContext,
  CrmDealQuestionnaireStatus,
  CrmDealLeadSummary,
  CrmDealQuoteSummary,
  CrmDealStatus,
  CrmStageId,
  DealPipelineUpdateInput,
  UpdateCrmDealInput,
} from "./types"
