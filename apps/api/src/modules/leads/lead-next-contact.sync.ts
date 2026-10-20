import { Prisma, type PrismaClient } from '@prisma/client';

import { planExactKindAgenda } from './lead-agenda-reconcile';
import {
  buildLeadNextContactDraft,
  LEAD_NEXT_CONTACT_EVENT_KIND,
} from './lead-next-contact.util';

export async function syncLeadNextContactActivity(
  prisma: Pick<PrismaClient, '$transaction'>,
  input: {
    tenantId: string;
    leadId: string;
    performedById: string;
    at: Date | null | undefined;
    type?: string | null;
    notes?: string | null;
  },
) {
  if (input.at === undefined) return 0;

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM "leads"
      WHERE id = ${input.leadId} AND "tenantId" = ${input.tenantId}
      FOR UPDATE
    `);
    const existing = await tx.activity.findMany({
      where: {
        tenantId: input.tenantId,
        leadId: input.leadId,
        operationalEventKind: LEAD_NEXT_CONTACT_EVENT_KIND,
      },
      select: {
        id: true,
        status: true,
        operationalEventKind: true,
        occurredAt: true,
        description: true,
        outcome: true,
        dealId: true,
        customerId: true,
        policyId: true,
        type: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    const draft = input.at
      ? buildLeadNextContactDraft({
          at: input.at,
          type: input.type,
          notes: input.notes,
        })
      : null;
    const writes = planExactKindAgenda({
      existing,
      kind: LEAD_NEXT_CONTACT_EVENT_KIND,
      desired: input.at,
      description:
        input.notes === undefined ? undefined : input.notes?.trim() || null,
      type: input.type ?? undefined,
      create: draft
        ? {
            tenantId: input.tenantId,
            leadId: input.leadId,
            performedById: input.performedById,
            type: draft.type,
            status: 'pending',
            subject: draft.subject,
            description: draft.description,
          }
        : undefined,
    });

    for (const write of writes) {
      if (write.op === 'delete') {
        await tx.activity.delete({ where: { id: write.id } });
      } else if (write.op === 'update') {
        await tx.activity.update({
          where: { id: write.id },
          data: {
            occurredAt: write.occurredAt,
            nextFollowUpAt: write.nextFollowUpAt,
            ...(write.description !== undefined
              ? { description: write.description }
              : {}),
            ...(write.type !== undefined ? { type: write.type } : {}),
          },
        });
      } else if (write.op === 'create') {
        await tx.activity.create({ data: write.data });
      }
    }
    return writes.some(
      (write) => write.op === 'create' || write.op === 'update',
    )
      ? 1
      : 0;
  });
}
