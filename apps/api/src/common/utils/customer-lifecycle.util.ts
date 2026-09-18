export {
  ACTIVITY_EVENT_KINDS,
  ACTIVITY_EVENT_LABELS,
  COMMERCIAL_EVENT_KINDS,
  POST_SALE_EVENT_KINDS,
  OPERATIONAL_EVENT_KINDS,
  activityEventLabel,
  isActivityEventKind,
  isCommercialEventKind,
  isPostSaleEventKind,
  type ActivityEventKind,
  type CommercialEventKind,
  type OperationalEventKind,
  type PostSaleEventKind,
} from './activity-event-kinds.util';

export const CUSTOMER_LIFECYCLE_STAGES = [
  'won',
  'onboarding',
  'awaiting_policy',
  'policy_issued',
  'active_customer',
  'inactive_customer',
  'lost_customer',
] as const;

export type CustomerLifecycleStage = (typeof CUSTOMER_LIFECYCLE_STAGES)[number];

export const CUSTOMER_RENEWAL_STATUSES = [
  'pending',
  'in_progress',
  'renewed',
  'lapsed',
  'cancelled',
] as const;

export type CustomerRenewalStatus = (typeof CUSTOMER_RENEWAL_STATUSES)[number];

export const DEFAULT_RENEWAL_PIPELINE = 'default';

const LIFECYCLE_RANK: Record<CustomerLifecycleStage, number> = {
  won: 0,
  onboarding: 1,
  awaiting_policy: 2,
  policy_issued: 3,
  active_customer: 4,
  inactive_customer: 5,
  lost_customer: 6,
};

export function isCustomerLifecycleStage(
  value: string | null | undefined,
): value is CustomerLifecycleStage {
  return (
    typeof value === 'string' &&
    (CUSTOMER_LIFECYCLE_STAGES as readonly string[]).includes(value)
  );
}

export function normalizeCustomerLifecycleStage(
  value: string | null | undefined,
): CustomerLifecycleStage {
  return isCustomerLifecycleStage(value) ? value : 'won';
}

export function canAdvanceLifecycle(
  current: CustomerLifecycleStage,
  next: CustomerLifecycleStage,
): boolean {
  return LIFECYCLE_RANK[next] >= LIFECYCLE_RANK[current];
}
