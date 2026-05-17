import type { CrmStageId } from "@/lib/crm-mock"

export type { CrmStageId }

export type CrmDealStatus = "open" | "won" | "lost" | "archived"

export type CrmDeal = {
  id: string
  tenantId: string
  title: string
  company: string
  value: number
  stage: CrmStageId
  status: CrmDealStatus
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
}

export type CreateCrmDealInput = {
  title: string
  company: string
  value: number
  stage: CrmStageId
  status: CrmDealStatus
  assignedTo?: string
}

export type UpdateCrmDealInput = Partial<CreateCrmDealInput>

export type BackendCrmDeal = {
  id: string
  tenantId: string
  title: string
  company: string
  value: number | string
  stage: CrmStageId
  status: CrmDealStatus
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
}
