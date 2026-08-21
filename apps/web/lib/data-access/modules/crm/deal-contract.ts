import type {
  CreateCrmDealInput,
  DealPipelineUpdateInput,
  UpdateCrmDealInput,
} from "./types"

/** Campos aceitos pelo POST /api/crm/deals (CreateDealDto). */
const CREATE_DEAL_BODY_KEYS = [
  "title",
  "company",
  "value",
  "stage",
  "status",
  "assignedTo",
] as const satisfies readonly (keyof CreateCrmDealInput)[]

/** Campos aceitos pelo PATCH /api/crm/deals/:id para edição de formulário. */
const UPDATE_DEAL_BODY_KEYS = [
  ...CREATE_DEAL_BODY_KEYS,
] as const satisfies readonly (keyof UpdateCrmDealInput)[]

/** Campos aceitos pelo PATCH /api/crm/deals/:id para movimento no Kanban. */
const PIPELINE_MOVE_BODY_KEYS = ["stage", "pipelineOrder"] as const

function pickDefined<T extends Record<string, unknown>>(
  source: T,
  keys: readonly (keyof T)[],
) {
  const payload: Record<string, unknown> = {}
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined) {
      payload[key as string] = value
    }
  }
  return payload
}

/**
 * POST /api/crm/deals — não envia pipelineOrder; o backend calcula a ordem no estágio.
 */
export function toCreateDealPayload(input: CreateCrmDealInput) {
  const payload = pickDefined(input, CREATE_DEAL_BODY_KEYS)
  const assignedTo =
    typeof payload.assignedTo === "string" ? payload.assignedTo.trim() : ""
  if (!assignedTo) {
    delete payload.assignedTo
  } else {
    payload.assignedTo = assignedTo
  }
  return payload
}

/**
 * PATCH /api/crm/deals/:id — edição via formulário (sem pipelineOrder).
 */
export function toUpdateDealPayload(input: UpdateCrmDealInput) {
  const payload = pickDefined(input, UPDATE_DEAL_BODY_KEYS)
  if (typeof payload.assignedTo === "string") {
    const assignedTo = payload.assignedTo.trim()
    if (assignedTo) payload.assignedTo = assignedTo
    else delete payload.assignedTo
  }
  return payload
}

/**
 * PATCH /api/crm/deals/:id — drag & drop do Kanban.
 */
export function toPipelineMovePayload(input: DealPipelineUpdateInput) {
  return pickDefined(input, PIPELINE_MOVE_BODY_KEYS) as {
    stage: DealPipelineUpdateInput["stage"]
    pipelineOrder: number
  }
}

export const CRM_DEAL_API_CONTRACT = {
  create: CREATE_DEAL_BODY_KEYS,
  update: UPDATE_DEAL_BODY_KEYS,
  pipelineMove: PIPELINE_MOVE_BODY_KEYS,
} as const
