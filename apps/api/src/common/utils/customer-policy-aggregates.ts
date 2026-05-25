import { PolicyRenewalStatus, PolicyStatus, Prisma } from '@prisma/client';

import {
  canAdvanceLifecycle,
  type CustomerLifecycleStage,
} from './customer-lifecycle.util';

export type PolicyAggregateRow = {
  status: PolicyStatus;
  renewalStatus: PolicyRenewalStatus | null;
  premiumValue: Prisma.Decimal;
  commissionValue: Prisma.Decimal | null;
  effectiveTo: Date | null;
  issuedAt: Date | null;
  updatedAt: Date;
};

export type CustomerPolicyAggregates = {
  policyCount: number;
  activePolicies: number;
  totalPremium: number;
  totalCommission: number;
  nextRenewalAt: string | null;
  lastRenewalAt: string | null;
};

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function minDate(dates: Date[]): Date | null {
  if (dates.length === 0) return null;
  return dates.reduce((earliest, current) =>
    current.getTime() < earliest.getTime() ? current : earliest,
  );
}

function maxDate(dates: Date[]): Date | null {
  if (dates.length === 0) return null;
  return dates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest,
  );
}

export function computeCustomerPolicyAggregates(
  policies: PolicyAggregateRow[],
): CustomerPolicyAggregates {
  const active = policies.filter(
    (policy) => policy.status === PolicyStatus.active,
  );

  const renewalCandidates = active
    .map((policy) => policy.effectiveTo)
    .filter((value): value is Date => value instanceof Date);

  const renewalHistory = policies
    .filter(
      (policy) =>
        policy.renewalStatus === PolicyRenewalStatus.renewed ||
        policy.status === PolicyStatus.lapsed,
    )
    .map((policy) => policy.updatedAt);

  return {
    policyCount: policies.length,
    activePolicies: active.length,
    totalPremium: policies.reduce(
      (sum, policy) => sum + decimalToNumber(policy.premiumValue),
      0,
    ),
    totalCommission: policies.reduce(
      (sum, policy) => sum + decimalToNumber(policy.commissionValue),
      0,
    ),
    nextRenewalAt: minDate(renewalCandidates)?.toISOString() ?? null,
    lastRenewalAt: maxDate(renewalHistory)?.toISOString() ?? null,
  };
}

export function resolveLifecycleAfterPolicyIssuance(
  current: string | null | undefined,
): CustomerLifecycleStage {
  const normalized = (current ?? 'won') as CustomerLifecycleStage;
  if (canAdvanceLifecycle(normalized, 'active_customer')) {
    return 'active_customer';
  }
  return normalized;
}

export function resolveCustomerRenewalStatusFromPolicies(
  policies: PolicyAggregateRow[],
): PolicyRenewalStatus | null {
  if (policies.length === 0) return null;

  const statuses = policies
    .map((policy) => policy.renewalStatus)
    .filter((value): value is PolicyRenewalStatus => value != null);

  if (statuses.includes(PolicyRenewalStatus.in_progress)) {
    return PolicyRenewalStatus.in_progress;
  }
  if (statuses.includes(PolicyRenewalStatus.pending)) {
    return PolicyRenewalStatus.pending;
  }
  if (
    statuses.length > 0 &&
    statuses.every((status) => status === PolicyRenewalStatus.renewed)
  ) {
    return PolicyRenewalStatus.renewed;
  }
  if (statuses.includes(PolicyRenewalStatus.lapsed)) {
    return PolicyRenewalStatus.lapsed;
  }
  if (statuses.includes(PolicyRenewalStatus.cancelled)) {
    return PolicyRenewalStatus.cancelled;
  }

  return null;
}

export async function syncCustomerPolicyAggregates(
  tx: Prisma.TransactionClient,
  tenantId: string,
  customerId: string,
): Promise<CustomerPolicyAggregates> {
  const policies = await tx.policy.findMany({
    where: { tenantId, customerId },
    select: {
      status: true,
      renewalStatus: true,
      premiumValue: true,
      commissionValue: true,
      effectiveTo: true,
      issuedAt: true,
      updatedAt: true,
    },
  });

  const aggregates = computeCustomerPolicyAggregates(policies);
  const renewalStatus = resolveCustomerRenewalStatusFromPolicies(policies);

  await tx.customer.update({
    where: { id: customerId },
    data: {
      renewalDate: aggregates.nextRenewalAt
        ? new Date(aggregates.nextRenewalAt)
        : null,
      ...(renewalStatus ? { renewalStatus } : {}),
    },
  });

  return aggregates;
}
