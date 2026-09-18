import { PolicyRenewalStatus, PolicyStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

import {
  computeCustomerPolicyAggregates,
  resolveLifecycleAfterPolicyIssuance,
} from './customer-policy-aggregates';

describe('computeCustomerPolicyAggregates', () => {
  it('calcula totais e vigências', () => {
    const aggregates = computeCustomerPolicyAggregates([
      {
        status: PolicyStatus.active,
        renewalStatus: PolicyRenewalStatus.pending,
        premiumValue: new Prisma.Decimal(1000),
        commissionValue: new Prisma.Decimal(100),
        effectiveTo: new Date('2027-01-01'),
        issuedAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      },
      {
        status: PolicyStatus.cancelled,
        renewalStatus: PolicyRenewalStatus.cancelled,
        premiumValue: new Prisma.Decimal(500),
        commissionValue: null,
        effectiveTo: null,
        issuedAt: null,
        updatedAt: new Date('2026-02-01'),
      },
    ]);

    expect(aggregates.policyCount).toBe(2);
    expect(aggregates.activePolicies).toBe(1);
    expect(aggregates.totalPremium).toBe(1500);
    expect(aggregates.totalCommission).toBe(100);
    expect(aggregates.nextRenewalAt).toBe(new Date('2027-01-01').toISOString());
  });
});

describe('resolveLifecycleAfterPolicyIssuance', () => {
  it('avança para active_customer quando permitido', () => {
    expect(resolveLifecycleAfterPolicyIssuance('policy_issued')).toBe(
      'active_customer',
    );
    expect(resolveLifecycleAfterPolicyIssuance('active_customer')).toBe(
      'active_customer',
    );
  });
});
