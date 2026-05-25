import type { Prisma } from '@prisma/client';

import { pickLatestDate } from '../../common/utils/activity-interaction.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { logLeadQuery, logLeadRuntime } from './lead-runtime.util';

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
  lead: Prisma.LeadGetPayload<object> & { lastInteractionAt?: string | null },
) {
  const lastInteractionAt =
    lead.lastInteractionAt ??
    resolveLeadLastInteractionAt(undefined, lead.lastContactAt);

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
    lastContactAt: lead.lastContactAt?.toISOString() ?? null,
    lastInteractionAt,
    dealId: lead.dealId,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}
