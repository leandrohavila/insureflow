import type { CommercialRenewalStatus } from "@/lib/business-units/constants"

export type PolicyRenewal = {
  id: string
  tenantId: string
  clientId: string
  customerId: string
  policyNumber: string
  insurer: string
  product: string
  startDate: string
  endDate: string
  renewalDate: string
  status: CommercialRenewalStatus
  assignedUserId?: string | null
  businessUnitId?: string | null
  dealId?: string | null
  convertedRevenue?: number | null
  daysUntil?: number
  customer?: { id: string; name: string; document: string; companyName?: string | null }
  assignedUser?: { id: string; name: string } | null
  deal?: { id: string; title: string; status: string; value: number; stage?: string } | null
}

export type UpdatePolicyRenewalInput = {
  status?: CommercialRenewalStatus
  convertedRevenue?: number
}
