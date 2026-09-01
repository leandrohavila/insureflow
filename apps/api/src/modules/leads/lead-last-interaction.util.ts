import type { Prisma } from '@prisma/client';

import { pickLatestDate } from '../../common/utils/activity-interaction.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { logLeadQuery, logLeadRuntime } from './lead-runtime.util';

export const leadOwnerInclude = {
  ownerUser: {
    select: { id: true, name: true, initials: true },
  },
  businessUnit: {
    select: { id: true, name: true, slug: true, type: true, isActive: true },
  },
  businessUnits: {
    include: {
      businessUnit: {
        select: { id: true, name: true, slug: true, type: true, isActive: true },
      },
    },
  },
} satisfies Prisma.LeadInclude;

export type LeadRecordWithOwner = Prisma.LeadGetPayload<{
  include: typeof leadOwnerInclude;
}>;

/** Agrega MAX(occurredAt) por lead sem derrubar o endpoint se activities estiver indisponível. */
export async function safeMaxOccurredAtByLeadIds(
  prisma: PrismaService,
  tenantId: string,
  leadIds: string[],
): Promise<Map<string, Date>> {
  const map = new Map<string, Date>();
  const unique = [...new Set(leadIds.filter(Boolean))];
  if (unique.length === 0) return map;

  logLeadQuery('activity-aggregate-start', {
    tenantId,
    count: unique.length,
  });

  try {
    const rows = await prisma.activity.groupBy({
      by: ['leadId'],
      where: { tenantId, leadId: { in: unique } },
      _max: { occurredAt: true },
    });

    for (const row of rows) {
      const leadId = row.leadId;
      const occurredAt = row._max.occurredAt;
      if (leadId && occurredAt) {
        map.set(leadId, occurredAt);
      }
    }

    logLeadQuery('activity-aggregate-ok', { hits: map.size });
  } catch (error) {
    logLeadRuntime('activity-aggregate-fallback', error, {
      tenantId,
      count: unique.length,
    });
  }

  return map;
}

export function resolveLeadLastInteractionAt(
  activityOccurredAt: Date | null | undefined,
  lastContactAt: Date | null | undefined,
): string | null {
  const latest = pickLatestDate(activityOccurredAt, lastContactAt);
  return latest?.toISOString() ?? null;
}

export function serializeLeadRecord(
  lead: Omit<LeadRecordWithOwner, 'lastInteractionAt'> & {
    lastInteractionAt?: string | null;
  },
) {
  const lastInteractionAt =
    typeof lead.lastInteractionAt === 'string'
      ? lead.lastInteractionAt
      : resolveLeadLastInteractionAt(undefined, lead.lastContactAt);

  const ownerUser = lead.ownerUser;
  const businessUnits = serializeLeadBusinessUnits(lead);

  return {
    id: lead.id,
    tenantId: lead.tenantId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    source: lead.source,
    documentType: lead.documentType,
    document: lead.document,
    status: lead.status,
    notes: lead.notes,
    assignedTo: lead.assignedTo,
    ownerUserId: lead.ownerUserId ?? null,
    ownerTeamId: lead.ownerTeamId ?? null,
    owner: ownerUser
      ? {
          id: ownerUser.id,
          name: ownerUser.name?.trim() || 'Usuário',
          initials: ownerUser.initials?.trim() || 'IF',
        }
      : null,
    lastContactAt: lead.lastContactAt?.toISOString() ?? null,
    lastInteractionAt,
    businessUnitId: lead.businessUnitId ?? null,
    businessUnit: lead.businessUnit
      ? {
          id: lead.businessUnit.id,
          name: lead.businessUnit.name,
          slug: lead.businessUnit.slug,
          type: lead.businessUnit.type,
          isActive: lead.businessUnit.isActive,
        }
      : null,
    businessUnits,
    interestCategories: lead.interestCategories ?? [],
    lostReason: lead.lostReason ?? null,
    lossReasonId: lead.lossReasonId ?? null,
    lostAt: lead.lostAt?.toISOString() ?? null,
    reactivationEnabled: lead.reactivationEnabled ?? true,
    reactivationDays: lead.reactivationDays ?? null,
    reactivationAttempts: lead.reactivationAttempts ?? 0,
    nextReactivationAt: lead.nextReactivationAt?.toISOString() ?? null,
    lastReactivatedAt: lead.lastReactivatedAt?.toISOString() ?? null,
    dealId: lead.dealId,
    opportunityType: (lead as { opportunityType?: string | null }).opportunityType ?? null,
    currentInsurer: (lead as { currentInsurer?: string | null }).currentInsurer ?? null,
    currentPolicyNumber:
      (lead as { currentPolicyNumber?: string | null }).currentPolicyNumber ??
      null,
    policyExpiresAt:
      (lead as { policyExpiresAt?: Date | null }).policyExpiresAt?.toISOString() ??
      null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

function serializeLeadBusinessUnits(lead: {
  businessUnits?: LeadRecordWithOwner['businessUnits'];
}) {
  const links = Array.isArray(lead.businessUnits) ? lead.businessUnits : [];
  return links
    .filter((link) => link?.businessUnit)
    .map((link) => ({
      id: link.businessUnit.id,
      name: link.businessUnit.name,
      slug: link.businessUnit.slug,
      type: link.businessUnit.type,
      isActive: link.businessUnit.isActive,
      isOrigin: link.isOrigin,
    }));
}
