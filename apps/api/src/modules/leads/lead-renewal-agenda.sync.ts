import type { PrismaClient } from '@prisma/client';

import {
  buildLeadRenewalAgendaDrafts,
  LEAD_RENEWAL_EVENT_PREFIX,
} from './lead-renewal-agenda.util';

export async function syncLeadRenewalActivities(
  prisma: Pick<PrismaClient, 'activity'>,
  input: {
    tenantId: string;
    leadId: string;
    performedById: string;
    expiresAt: Date | null | undefined;
  },
) {
  await prisma.activity.deleteMany({
    where: {
      tenantId: input.tenantId,
      leadId: input.leadId,
      status: 'pending',
      operationalEventKind: { startsWith: LEAD_RENEWAL_EVENT_PREFIX },
    },
  });

  if (!input.expiresAt) return 0;
  const drafts = buildLeadRenewalAgendaDrafts({ expiresAt: input.expiresAt });
  if (!drafts.length) return 0;

  await prisma.activity.createMany({
    data: drafts.map((draft) => ({
      tenantId: input.tenantId,
      leadId: input.leadId,
      performedById: input.performedById,
      type: draft.type,
      status: draft.status,
      subject: draft.subject,
      description: draft.description,
      occurredAt: draft.occurredAt,
      operationalEventKind: draft.operationalEventKind,
    })),
  });
  return drafts.length;
}
