import { Prisma, type PrismaClient } from '@prisma/client';

import { planExactKindAgenda } from './lead-agenda-reconcile';
import {
  buildLeadRenewalAgendaDrafts,
  LEAD_RENEWAL_OFFSETS_DAYS,
  leadRenewalEventKind,
  renewalReminderSlotsFromDto,
} from './lead-renewal-agenda.util';

const RENEWAL_KINDS = LEAD_RENEWAL_OFFSETS_DAYS.map((days) =>
  leadRenewalEventKind(days),
);

type RenewalReminderFlags = {
  renewalD60Disabled?: boolean;
  renewalD30Disabled?: boolean;
  renewalD15Disabled?: boolean;
};

export type RenewalSyncResult = {
  count: number;
  flags: RenewalReminderFlags;
  missing: boolean;
};

type RenewalSyncInput = {
  tenantId: string;
  leadId: string;
  performedById: string;
  expiresAt?: Date | null;
  slots?: ReturnType<typeof renewalReminderSlotsFromDto>['slots'];
  /** Cria sugestões só para tipos que ainda não têm pendência. Não recalcula datas manuais. */
  generateMissing?: boolean;
  /** Quando o lead não pertence ao tenant, o chamador deve desfazer a transação. */
  failIfMissing?: boolean;
};

type RenewalTx = {
  $queryRaw: PrismaClient['$queryRaw'];
  lead: {
    updateMany: PrismaClient['lead']['updateMany'];
  };
  activity: {
    findMany: PrismaClient['activity']['findMany'];
    update: PrismaClient['activity']['update'];
    updateMany: PrismaClient['activity']['updateMany'];
    create: PrismaClient['activity']['create'];
  };
};

const emptySync = (): RenewalSyncResult => ({
  count: 0,
  flags: {},
  missing: false,
});

/**
 * Roda dentro da transação recebida. Não abre outra transação.
 */
export async function applyLeadRenewalActivities(
  tx: RenewalTx,
  input: RenewalSyncInput,
): Promise<RenewalSyncResult> {
  const slots = input.slots ?? {};
  const hasSlot = Object.values(slots).some((value) => value !== undefined);
  if (!hasSlot && !input.generateMissing) return emptySync();

  const locked = await tx.$queryRaw<
    Array<{ id: string; d60: boolean; d30: boolean; d15: boolean }>
  >(Prisma.sql`
      SELECT id,
        "renewal_d60_disabled" AS "d60",
        "renewal_d30_disabled" AS "d30",
        "renewal_d15_disabled" AS "d15"
      FROM "leads"
      WHERE id = ${input.leadId} AND "tenantId" = ${input.tenantId}
      FOR UPDATE
    `);
  const leadRow = locked[0];
  if (!leadRow)
    return { ...emptySync(), missing: input.failIfMissing === true };
  const disabledByDays = {
    60: Boolean(leadRow.d60),
    30: Boolean(leadRow.d30),
    15: Boolean(leadRow.d15),
  } as const;
  const existing = await tx.activity.findMany({
    where: {
      tenantId: input.tenantId,
      leadId: input.leadId,
      operationalEventKind: { in: [...RENEWAL_KINDS] },
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

  const desired = { ...slots };
  if (input.generateMissing && input.expiresAt) {
    for (const draft of buildLeadRenewalAgendaDrafts({
      expiresAt: input.expiresAt,
    })) {
      const days = LEAD_RENEWAL_OFFSETS_DAYS.find(
        (offset) => leadRenewalEventKind(offset) === draft.operationalEventKind,
      );
      if (days && desired[days] === undefined && !disabledByDays[days]) {
        desired[days] = draft.occurredAt;
      }
    }
  }

  const writes = LEAD_RENEWAL_OFFSETS_DAYS.flatMap((days) => {
    const kind = leadRenewalEventKind(days);
    return planExactKindAgenda({
      existing,
      kind,
      desired: desired[days],
      retirePending: 'cancel',
      create: {
        tenantId: input.tenantId,
        leadId: input.leadId,
        performedById: input.performedById,
        type: 'renewal',
        status: 'pending',
        subject: `Renovação D-${days}`,
        description: `Contato automático ${days} dias antes do vencimento da apólice.`,
      },
    });
  });

  const reminderFlags: RenewalReminderFlags = {};
  if (desired[60] === null) reminderFlags.renewalD60Disabled = true;
  else if (desired[60] instanceof Date)
    reminderFlags.renewalD60Disabled = false;
  if (desired[30] === null) reminderFlags.renewalD30Disabled = true;
  else if (desired[30] instanceof Date)
    reminderFlags.renewalD30Disabled = false;
  if (desired[15] === null) reminderFlags.renewalD15Disabled = true;
  else if (desired[15] instanceof Date)
    reminderFlags.renewalD15Disabled = false;
  if (Object.keys(reminderFlags).length > 0) {
    const updated = await tx.lead.updateMany({
      where: { id: input.leadId, tenantId: input.tenantId },
      data: reminderFlags,
    });
    if (updated.count === 0) {
      return { ...emptySync(), missing: input.failIfMissing === true };
    }
  }

  for (const write of writes) {
    if (write.op === 'cancel' || write.op === 'delete') {
      await tx.activity.updateMany({
        where: {
          id: write.id,
          tenantId: input.tenantId,
          leadId: input.leadId,
          status: 'pending',
        },
        data: { status: 'cancelled' },
      });
    } else if (write.op === 'update') {
      await tx.activity.update({
        where: { id: write.id },
        data: {
          occurredAt: write.occurredAt,
          nextFollowUpAt: write.nextFollowUpAt,
        },
      });
    } else {
      await tx.activity.create({ data: write.data });
    }
  }
  return {
    count: writes.filter((write) => write.op !== 'delete').length,
    flags: reminderFlags,
    missing: false,
  };
}

export async function syncLeadRenewalActivities(
  prisma: Pick<PrismaClient, '$transaction'>,
  input: RenewalSyncInput,
) {
  const slots = input.slots ?? {};
  const hasSlot = Object.values(slots).some((value) => value !== undefined);
  if (!hasSlot && !input.generateMissing) return 0;

  const result = await prisma.$transaction((tx) =>
    applyLeadRenewalActivities(tx, input),
  );
  return result.count;
}
