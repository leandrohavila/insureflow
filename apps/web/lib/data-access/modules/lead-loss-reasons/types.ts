export type LeadLossReason = {
  id: string
  tenantId: string
  name: string
  description?: string | null
  isActive: boolean
  reactivationEnabled: boolean
  reactivationDays: number
  maxAttempts: number
  businessUnitId?: string | null
}

export type CreateLeadLossReasonInput = {
  name: string
  description?: string
  isActive?: boolean
  reactivationEnabled?: boolean
  reactivationDays?: number
  maxAttempts?: number
  businessUnitId?: string
}

export type UpdateLeadLossReasonInput = Partial<CreateLeadLossReasonInput>
