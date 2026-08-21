import { Injectable, Optional } from '@nestjs/common';

import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import {
  canonicalDealStage,
  computeStageSla,
  defaultStagesForUnitType,
} from '../../common/utils/deal-pipeline.util';
import { startOfUtcDay } from '../../common/utils/lead-reactivation.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type {
  CommercialAgendaType,
  ListCommercialAgendaQueryDto,
} from './commercial-agenda.dto';

export type AgendaItem = {
  id: string;
  source: 'activity' | 'follow_up' | 'renewal' | 'reactivation' | 'sla';
  at: string;
  type: CommercialAgendaType;
  typeLabel: string;
  status: string;
  origin: string;
  customerId: string | null;
  customerName: string | null;
  leadId: string | null;
  leadName: string | null;
  dealId: string | null;
  ownerName: string | null;
  ownerUserId: string | null;
};

const TYPE_LABELS: Record<CommercialAgendaType, string> = {
  FOLLOW_UP: 'Follow-up',
  RENEWAL: 'Renovação',
  REACTIVATION: 'Reativação',
  SLA: 'SLA',
  CALL: 'Ligação',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  MEETING: 'Reunião',
};

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function activityType(type: string): CommercialAgendaType {
  if (type === 'call') return 'CALL';
  if (type === 'whatsapp') return 'WHATSAPP';
  if (type === 'email') return 'EMAIL';
  if (type === 'meeting') return 'MEETING';
  if (type === 'follow_up') return 'FOLLOW_UP';
  return 'FOLLOW_UP';
}

function inWindow(at: Date, window: ListCommercialAgendaQueryDto['window'], now: Date) {
  const startToday = startOfLocalDay(now);
  const endToday = endOfLocalDay(now);
  if (window === 'today') return at >= startToday && at <= endToday;
  if (window === 'overdue') return at < startToday;
  if (window === 'next7') {
    const until = new Date(startToday);
    until.setDate(until.getDate() + 7);
    return at >= startToday && at <= until;
  }
  if (window === 'next30') {
    const until = new Date(startToday);
    until.setDate(until.getDate() + 30);
    return at >= startToday && at <= until;
  }
  return true;
}

@Injectable()
export class CommercialAgendaService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async list(
    tenantId: string,
    query: ListCommercialAgendaQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const now = new Date();
    const items = await this.collect(tenantId, actor, now);
    const filtered = items.filter((item) => {
      if (query.assignedUserId && item.ownerUserId !== query.assignedUserId) {
        return false;
      }
      if (query.type && item.type !== query.type) return false;
      if (query.window && !inWindow(new Date(item.at), query.window, now)) {
        return false;
      }
      return true;
    });
    filtered.sort((a, b) => a.at.localeCompare(b.at));
    const metrics = this.metrics(items, now);
    return {
      data: filtered.slice(0, query.limit ?? 100),
      metrics,
    };
  }

  private metrics(items: AgendaItem[], now: Date) {
    return {
      today: items.filter((item) => inWindow(new Date(item.at), 'today', now))
        .length,
      overdue: items.filter((item) =>
        inWindow(new Date(item.at), 'overdue', now),
      ).length,
      renewalsUpcoming: items.filter(
        (item) =>
          item.type === 'RENEWAL' &&
          inWindow(new Date(item.at), 'next30', now),
      ).length,
      reactivationsPending: items.filter(
        (item) => item.type === 'REACTIVATION' && item.status !== 'completed',
      ).length,
      slaOverdue: items.filter((item) => item.type === 'SLA').length,
    };
  }

  private async collect(
    tenantId: string,
    actor: BusinessUnitActor | undefined,
    now: Date,
  ): Promise<AgendaItem[]> {
    const items: AgendaItem[] = [];
    const from = new Date(now);
    from.setDate(from.getDate() - 90);
    const to = new Date(now);
    to.setDate(to.getDate() + 30);

    let activityWhere = {
      tenantId,
      status: { not: 'cancelled' },
      OR: [
        { nextFollowUpAt: { gte: from, lte: to } },
        { occurredAt: { gte: from, lte: to }, status: 'pending' },
      ],
    };
    if (actor && this.buAccess) {
      const leadExtra = await this.buAccess.leadWhere(actor);
      const customerExtra = await this.buAccess.customerWhere(actor);
      const dealExtra = await this.buAccess.dealWhere(actor);
      const relationOr = [
        ...(leadExtra ? [{ lead: leadExtra }] : []),
        ...(customerExtra ? [{ customer: customerExtra }] : []),
        ...(dealExtra ? [{ deal: dealExtra }] : []),
      ];
      if (relationOr.length) {
        activityWhere = andWhere(activityWhere, {
          OR: relationOr,
        }) as typeof activityWhere;
      }
    }

    const activities = await this.prisma.activity.findMany({
      where: activityWhere,
      include: {
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        performedBy: { select: { id: true, name: true } },
      },
      take: 500,
    });
    for (const activity of activities) {
      const at = activity.nextFollowUpAt ?? activity.occurredAt;
      const type = activityType(activity.type);
      items.push({
        id: `activity:${activity.id}`,
        source: 'activity',
        at: at.toISOString(),
        type,
        typeLabel: TYPE_LABELS[type],
        status: activity.status,
        origin: 'Atividade',
        customerId: activity.customerId,
        customerName: activity.customer?.name ?? null,
        leadId: activity.leadId,
        leadName: activity.lead?.name ?? null,
        dealId: activity.dealId,
        ownerName: activity.performedBy.name,
        ownerUserId: activity.performedById,
      });
    }

    let followWhere = {
      tenantId,
      status: 'PENDING' as const,
      scheduledAt: { gte: from, lte: to },
    };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.followUpWhere(actor);
      if (extra) followWhere = andWhere(followWhere, extra) as typeof followWhere;
    }
    const followUps = await this.prisma.leadFollowUp.findMany({
      where: followWhere,
      include: {
        lead: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
      },
      take: 500,
    });
    for (const follow of followUps) {
      const mapped =
        follow.type === 'CALL'
          ? 'CALL'
          : follow.type === 'WHATSAPP'
            ? 'WHATSAPP'
            : follow.type === 'EMAIL'
              ? 'EMAIL'
              : follow.type === 'MEETING'
                ? 'MEETING'
                : 'FOLLOW_UP';
      items.push({
        id: `follow_up:${follow.id}`,
        source: 'follow_up',
        at: follow.scheduledAt.toISOString(),
        type: mapped,
        typeLabel: TYPE_LABELS[mapped],
        status: follow.status.toLowerCase(),
        origin: 'Follow-up',
        customerId: null,
        customerName: null,
        leadId: follow.leadId,
        leadName: follow.lead.name,
        dealId: null,
        ownerName: follow.assignedUser?.name ?? null,
        ownerUserId: follow.assignedUserId,
      });
    }

    let renewalWhere = {
      tenantId,
      status: { notIn: ['LOST' as const, 'RENEWED' as const] },
      endDate: { gte: startOfUtcDay(from), lte: to },
    };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.renewalWhere(actor);
      if (extra) renewalWhere = andWhere(renewalWhere, extra) as typeof renewalWhere;
    }
    const renewals = await this.prisma.policyRenewal.findMany({
      where: renewalWhere,
      include: {
        customer: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
      },
      take: 500,
    });
    for (const renewal of renewals) {
      items.push({
        id: `renewal:${renewal.id}`,
        source: 'renewal',
        at: renewal.endDate.toISOString(),
        type: 'RENEWAL',
        typeLabel: TYPE_LABELS.RENEWAL,
        status: renewal.status,
        origin: 'Carteira',
        customerId: renewal.customerId,
        customerName: renewal.customer.name,
        leadId: null,
        leadName: null,
        dealId: renewal.dealId,
        ownerName: renewal.assignedUser?.name ?? null,
        ownerUserId: renewal.assignedUserId,
      });
    }

    const reactivations = await this.prisma.lead.findMany({
      where: {
        tenantId,
        status: 'lost',
        reactivationEnabled: true,
        nextReactivationAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        name: true,
        nextReactivationAt: true,
        ownerUserId: true,
        ownerUser: { select: { name: true } },
      },
      take: 200,
    });
    for (const lead of reactivations) {
      if (!lead.nextReactivationAt) continue;
      items.push({
        id: `reactivation:${lead.id}`,
        source: 'reactivation',
        at: lead.nextReactivationAt.toISOString(),
        type: 'REACTIVATION',
        typeLabel: TYPE_LABELS.REACTIVATION,
        status: 'pending',
        origin: 'Reativação',
        customerId: null,
        customerName: null,
        leadId: lead.id,
        leadName: lead.name,
        dealId: null,
        ownerName: lead.ownerUser?.name ?? null,
        ownerUserId: lead.ownerUserId,
      });
    }

    let dealScope = { tenantId, status: 'open' };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.dealWhere(actor);
      if (extra) dealScope = andWhere(dealScope, extra) as typeof dealScope;
    }
    const deals = await this.prisma.deal.findMany({
      where: dealScope,
      select: {
        id: true,
        title: true,
        stage: true,
        stageEnteredAt: true,
        ownerUserId: true,
        customerId: true,
        customer: { select: { id: true, name: true } },
        ownerUser: { select: { name: true } },
        businessUnit: { select: { type: true } },
        pipeline: { select: { stages: { select: { slug: true, maxDays: true } } } },
      },
      take: 500,
    });
    for (const deal of deals) {
      const unitType = deal.businessUnit?.type ?? 'INSURANCE';
      const stages = deal.pipeline?.stages?.length
        ? deal.pipeline.stages
        : defaultStagesForUnitType(unitType);
      const slug = canonicalDealStage(deal.stage, unitType);
      const stageDef = stages.find((stage) => stage.slug === slug);
      const sla = computeStageSla({
        enteredAt: deal.stageEnteredAt,
        maxDays: stageDef?.maxDays,
        now,
      });
      if (sla.status !== 'overdue') continue;
      items.push({
        id: `sla:${deal.id}`,
        source: 'sla',
        at: sla.dueAt ?? deal.stageEnteredAt.toISOString(),
        type: 'SLA',
        typeLabel: TYPE_LABELS.SLA,
        status: 'overdue',
        origin: 'SLA',
        customerId: deal.customerId,
        customerName: deal.customer?.name ?? null,
        leadId: null,
        leadName: null,
        dealId: deal.id,
        ownerName: deal.ownerUser?.name ?? null,
        ownerUserId: deal.ownerUserId,
      });
    }

    return items;
  }
}
