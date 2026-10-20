import type { PrismaClient } from '@prisma/client';

import { LEAD_NEXT_CONTACT_EVENT_KIND } from './lead-next-contact.util';
import { leadRenewalEventKind } from './lead-renewal-agenda.util';

const DEFAULT_NEXT_CONTACT_DESCRIPTION =
  'Contato comercial agendado no cadastro do lead.';

const AGENDA_KINDS = [
  leadRenewalEventKind(60),
  leadRenewalEventKind(30),
  leadRenewalEventKind(15),
  LEAD_NEXT_CONTACT_EVENT_KIND,
] as const;

export type LeadAgendaSnapshot = {
  renewalReminderD60: string | null;
  renewalReminderD30: string | null;
  renewalReminderD15: string | null;
  renewalReminderD60CompletedAt: string | null;
  renewalReminderD30CompletedAt: string | null;
  renewalReminderD15CompletedAt: string | null;
  nextContactAt: string | null;
  nextContactType: string | null;
  nextContactNotes: string | null;
};

export async function loadLeadAgendaById(
  prisma: Pick<PrismaClient, 'activity'>,
  tenantId: string,
  leadIds: string[],
) {
  const map = new Map<string, LeadAgendaSnapshot>();
  const unique = [...new Set(leadIds.filter(Boolean))];
  if (unique.length === 0) return map;

  const rows = await prisma.activity.findMany({
    where: {
      tenantId,
      leadId: { in: unique },
      status: 'pending',
      operationalEventKind: { in: [...AGENDA_KINDS] },
    },
    select: {
      leadId: true,
      type: true,
      description: true,
      occurredAt: true,
      operationalEventKind: true,
    },
    orderBy: { occurredAt: 'asc' },
  });

  for (const row of rows) {
    if (!row.leadId || !row.operationalEventKind) continue;
    const current = map.get(row.leadId) ?? emptyAgenda();
    const iso = row.occurredAt.toISOString();
    if (row.operationalEventKind === leadRenewalEventKind(60)) {
      current.renewalReminderD60 = iso;
    } else if (row.operationalEventKind === leadRenewalEventKind(30)) {
      current.renewalReminderD30 = iso;
    } else if (row.operationalEventKind === leadRenewalEventKind(15)) {
      current.renewalReminderD15 = iso;
    } else if (row.operationalEventKind === LEAD_NEXT_CONTACT_EVENT_KIND) {
      current.nextContactAt = iso;
      current.nextContactType = row.type;
      current.nextContactNotes =
        row.description && row.description !== DEFAULT_NEXT_CONTACT_DESCRIPTION
          ? row.description
          : null;
    }
    map.set(row.leadId, current);
  }

  const completed = await prisma.activity.findMany({
    where: {
      tenantId,
      leadId: { in: unique },
      status: 'completed',
      operationalEventKind: {
        in: [
          leadRenewalEventKind(60),
          leadRenewalEventKind(30),
          leadRenewalEventKind(15),
        ],
      },
    },
    select: {
      leadId: true,
      occurredAt: true,
      operationalEventKind: true,
    },
    orderBy: { occurredAt: 'desc' },
  });
  for (const row of completed) {
    if (!row.leadId || !row.operationalEventKind) continue;
    const current = map.get(row.leadId) ?? emptyAgenda();
    const iso = row.occurredAt.toISOString();
    if (
      row.operationalEventKind === leadRenewalEventKind(60) &&
      !current.renewalReminderD60 &&
      !current.renewalReminderD60CompletedAt
    ) {
      current.renewalReminderD60CompletedAt = iso;
    } else if (
      row.operationalEventKind === leadRenewalEventKind(30) &&
      !current.renewalReminderD30 &&
      !current.renewalReminderD30CompletedAt
    ) {
      current.renewalReminderD30CompletedAt = iso;
    } else if (
      row.operationalEventKind === leadRenewalEventKind(15) &&
      !current.renewalReminderD15 &&
      !current.renewalReminderD15CompletedAt
    ) {
      current.renewalReminderD15CompletedAt = iso;
    }
    map.set(row.leadId, current);
  }

  return map;
}

function emptyAgenda(): LeadAgendaSnapshot {
  return {
    renewalReminderD60: null,
    renewalReminderD30: null,
    renewalReminderD15: null,
    renewalReminderD60CompletedAt: null,
    renewalReminderD30CompletedAt: null,
    renewalReminderD15CompletedAt: null,
    nextContactAt: null,
    nextContactType: null,
    nextContactNotes: null,
  };
}
