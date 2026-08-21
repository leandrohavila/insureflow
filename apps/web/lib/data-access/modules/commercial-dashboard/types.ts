export type CommercialDashboardMetrics = {
  period: { from: string; to: string }
  lostLeads: number
  reactivatedLeads: number
  returnedLeads: number
  recoveryRate: number
  pendingFollowUps: number
  overdueFollowUps: number
  upcomingRenewals: number
  convertedRenewals: number
  recoveredRevenue: number
}

export type CommercialDashboardFilters = {
  from?: string
  to?: string
  userId?: string
  teamId?: string
  businessUnitId?: string
}
