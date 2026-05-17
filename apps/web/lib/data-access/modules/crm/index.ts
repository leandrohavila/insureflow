export {
  formatCurrency,
  pipelineStages,
  stageLabelMap,
} from "@/lib/crm-mock"

export {
  createDeal,
  deleteDeal,
  fetchDeals,
  updateDeal,
} from "./api"
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
  CrmDealStatus,
  CrmStageId,
  UpdateCrmDealInput,
} from "./types"
