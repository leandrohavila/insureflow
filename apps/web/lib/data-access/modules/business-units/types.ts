import type { BusinessUnitType } from "@/lib/business-units/constants"

export type BusinessUnit = {
  id: string
  tenantId: string
  name: string
  slug: string
  type: BusinessUnitType
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type BusinessUnitSummary = {
  id: string
  name: string
  slug: string
  type: BusinessUnitType
  isActive: boolean
  isOrigin?: boolean
}

export type CreateBusinessUnitInput = {
  name: string
  slug?: string
  type: BusinessUnitType
  isActive?: boolean
}

export type UpdateBusinessUnitInput = Partial<CreateBusinessUnitInput>

export type BusinessUnitContextUnit = {
  id: string
  name: string
  slug: string
  type: BusinessUnitType
  isActive: boolean
}

export type BusinessUnitContext = {
  currentBusinessUnitId: string | null
  canViewAll: boolean
  canManage: boolean
  units: BusinessUnitContextUnit[]
}
