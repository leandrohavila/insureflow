import type { Prisma } from '@prisma/client';

import { ACTIVITY_STATUSES, ACTIVITY_TYPES } from './dto/activity.dto';

const activityInclude = {
  performedBy: {
    select: { id: true, name: true, initials: true },
  },
} satisfies Prisma.ActivityInclude;

export { activityInclude };

export type ActivityRecord = Prisma.ActivityGetPayload<{
  include: typeof activityInclude;
}>;

function isActivityType(
  value: string,
): value is (typeof ACTIVITY_TYPES)[number] {
  return (ACTIVITY_TYPES as readonly string[]).includes(value);
}

function isActivityStatus(
  value: string,
): value is (typeof ACTIVITY_STATUSES)[number] {
  return (ACTIVITY_STATUSES as readonly string[]).includes(value);
}

function toIso(value: Date | null | undefined): string | null {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }
  return value.toISOString();
}

export function serializeActivity(activity: ActivityRecord) {
  const performer = activity.performedBy ?? {
    id: activity.performedById,
    name: 'Usuário',
    initials: 'IF',
  };

  return {
    id: activity.id,
    tenantId: activity.tenantId,
    type: isActivityType(activity.type) ? activity.type : 'note',
    status: isActivityStatus(activity.status ?? 'pending')
      ? activity.status
      : 'pending',
    subject: activity.subject,
    description: activity.description,
    outcome: activity.outcome,
    operationalEventKind: activity.operationalEventKind ?? null,
    occurredAt: toIso(activity.occurredAt) ?? new Date(0).toISOString(),
    nextFollowUpAt: toIso(activity.nextFollowUpAt),
    leadId: activity.leadId ?? null,
    dealId: activity.dealId ?? null,
    customerId: activity.customerId ?? null,
    policyId: activity.policyId ?? null,
    performedById: activity.performedById,
    performedBy: {
      id: performer.id,
      name: performer.name?.trim() || 'Usuário',
      initials: performer.initials?.trim() || 'IF',
    },
    createdAt: toIso(activity.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIso(activity.updatedAt) ?? new Date(0).toISOString(),
  };
}
