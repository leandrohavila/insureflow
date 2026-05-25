import type { Policy } from '@prisma/client';

import type { OperationalEventKind } from '../../common/utils/customer-lifecycle.util';

export const POLICY_OPERATIONAL_EVENTS = {
  POLICY_ISSUED: 'policy_issued',
  RENEWAL_STARTED: 'renewal_started',
  RENEWAL_COMPLETED: 'renewal_completed',
  CANCELLATION: 'cancellation',
} as const satisfies Record<string, OperationalEventKind>;

export function policyIssuedSubject(
  policy: Pick<Policy, 'policyNumber' | 'insurer'>,
) {
  return `Apólice emitida — ${policy.policyNumber} (${policy.insurer})`;
}

export function policyRenewalStartedSubject(
  policy: Pick<Policy, 'policyNumber'>,
) {
  return `Renovação iniciada — ${policy.policyNumber}`;
}

export function policyRenewalCompletedSubject(
  policy: Pick<Policy, 'policyNumber'>,
) {
  return `Renovação concluída — ${policy.policyNumber}`;
}

export function policyCancellationSubject(
  policy: Pick<Policy, 'policyNumber'>,
) {
  return `Apólice cancelada — ${policy.policyNumber}`;
}
