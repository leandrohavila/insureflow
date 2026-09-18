import type { PrismaClient } from '@prisma/client';

import {
  buildLeadNextContactDraft,
  LEAD_NEXT_CONTACT_EVENT_KIND,
} from './lead-next-contact.util';

export async function syncLeadNextContactActivity(
  prisma: Pick<PrismaClient, 'activity'>,
  input: {
    tenantId: string;
    leadId: string;
    performedById: string;
    at: Date | null | undefined;
    type?: string | null;
    notes?: string | null;
  },
) {
  await prisma.activity.deleteMany({
    where: {
      tenantId: input.tenantId,
      leadId: input.leadId,
      status: 'pending',
      operationalEventKind: LEAD_NEXT_CONTACT_EVENT_KIND,
    },
  });

  if (!input.at || Number.isNaN(input.at.getTime())) return 0;
  const draft = buildLeadNextContactDraft({
    at: input.at,
    type: input.type,
    notes: input.notes,
  });
  await prisma.activity.create({
    data: {
      tenantId: input.tenantId,
      leadId: input.leadId,
      performedById: input.performedById,
      type: draft.type,
      status: draft.status,
      subject: draft.subject,
      description: draft.description,
      occurredAt: draft.occurredAt,
      nextFollowUpAt: draft.nextFollowUpAt,
      operationalEventKind: draft.operationalEventKind,
    },
  });
  return 1;
}
