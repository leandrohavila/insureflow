import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import {
  addUtcDays,
  buildManualReactivatePatch,
  buildPostponeReactivationAt,
  daysOverdue,
} from '../../common/utils/lead-reactivation.util';
import {
  endOfLocalDay,
  startOfLocalDay,
} from '../commercial-agenda/commercial-agenda-window.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { LeadFollowUpsService } from '../lead-follow-ups/lead-follow-ups.service';
import type {
  ListReactivationQueueQueryDto,
  PostponeReactivationDto,
  ReactivateLeadDto,
  ReactivationQueueWindow,
} from './dto/commercial-reactivations.dto';

export type ReactivationQueueItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string;
  ownerUserId: string | null;
  ownerName: string | null;
  lossReasonId: string | null;
  lossReasonName: string | null;
  lostReason: string | null;
  lostAt: string | null;
  nextReactivationAt: string;
  daysOverdue: number;
  lastContactAt: string | null;
  nextContactAt: string | null;
  businessUnitId: string | null;
  windowStatus: 'today' | 'overdue' | 'upcoming';
};

@Injectable()
export class CommercialReactivationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityEngine: ActivityEngineService,
    private readonly followUps: LeadFollowUpsService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async list(
    tenantId: string,
    query: ListReactivationQueueQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const now = new Date();
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    let where: Prisma.LeadWhereInput = {
      tenantId,
      status: 'lost',
      reactivationEnabled: true,
      nextReactivationAt: { not: null },
      ...(query.ownerUserId ? { ownerUserId: query.ownerUserId } : {}),
      ...(query.lossReasonId ? { lossReasonId: query.lossReasonId } : {}),
      ...(query.source
        ? { source: { equals: query.source, mode: 'insensitive' } }
        : {}),
    };

    where = this.applyWindow(where, query.window, now);

    if (this.buAccess && actor) {
      const leadExtra = await this.buAccess.leadWhere(
        actor,
        query.businessUnitId,
      );
      where = andWhere(where, leadExtra);
    } else if (query.businessUnitId) {
      where = andWhere(where, { businessUnitId: query.businessUnitId });
    }

    const [total, rows, metrics] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        include: {
          ownerUser: { select: { id: true, name: true } },
          configuredLossReason: {
            select: { id: true, name: true },
          },
          followUps: {
            where: { status: 'PENDING' },
            orderBy: { scheduledAt: 'asc' },
            take: 1,
            select: { scheduledAt: true },
          },
        },
        orderBy: { nextReactivationAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.computeMetrics(tenantId, actor, query.businessUnitId, now),
    ]);

    const data: ReactivationQueueItem[] = rows.map((lead) =>
      this.toItem(lead, now),
    );

    return {
      data,
      metrics,
      meta: { total, page, limit, pageCount: Math.ceil(total / limit) },
    };
  }

  async reactivate(
    tenantId: string,
    leadId: string,
    dto: ReactivateLeadDto,
    actor: BusinessUnitActor & { userId: string },
  ) {
    const lead = await this.findQueueLeadOrThrow(tenantId, leadId, actor);
    const now = new Date();
    const patch = buildManualReactivatePatch({
      now,
      toStatus: dto.toStatus,
    });
    const previousNext = lead.nextReactivationAt;

    const updated = await this.prisma.lead.update({
      where: { id: lead.id },
      data: patch,
      include: {
        ownerUser: { select: { id: true, name: true } },
        configuredLossReason: { select: { id: true, name: true } },
      },
    });

    const nextContactAt = dto.nextContactAt
      ? new Date(dto.nextContactAt)
      : addUtcDays(now, 1);
    const nextContactType = dto.nextContactType ?? 'WHATSAPP';

    await this.followUps.create(
      tenantId,
      {
        leadId: lead.id,
        scheduledAt: nextContactAt.toISOString(),
        type: nextContactType,
        notes:
          dto.notes?.trim() ||
          'Próximo contato após reativação manual da fila.',
      },
      actor.userId,
    );

    const lossLabel = lead.configuredLossReason?.name || lead.lostReason || '—';

    await this.activityEngine.publish({
      tenantId,
      performedById: actor.userId,
      operationalEventKind: 'lead_reactivated',
      subject: `Lead reativado — ${lead.name}`,
      description: [
        `Motivo original: ${lossLabel}`,
        previousNext
          ? `Data prevista: ${previousNext.toLocaleDateString('pt-BR')}`
          : null,
        `Reativado em: ${now.toLocaleDateString('pt-BR')}`,
        dto.notes?.trim() ? `Notas: ${dto.notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      leadId: lead.id,
      metadata: {
        action: 'manual_reopen',
        fromStatus: 'lost',
        toStatus: patch.status,
        lossReasonId: lead.lossReasonId,
        lostReason: lead.lostReason,
        previousNextReactivationAt: previousNext?.toISOString() ?? null,
        nextContactAt: nextContactAt.toISOString(),
        nextContactType,
        actorUserId: actor.userId,
      },
    });

    return updated;
  }

  async postpone(
    tenantId: string,
    leadId: string,
    dto: PostponeReactivationDto,
    actor: BusinessUnitActor & { userId: string },
  ) {
    if (dto.days == null && !dto.at) {
      throw new BadRequestException(
        'Informe days (7, 15 ou 30) ou uma data personalizada (at).',
      );
    }

    const lead = await this.findQueueLeadOrThrow(tenantId, leadId, actor);
    const now = new Date();
    const fromAt = lead.nextReactivationAt!;

    let toAt: Date;
    try {
      toAt = buildPostponeReactivationAt({
        now,
        days: dto.days,
        at: dto.at ? new Date(dto.at) : undefined,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'INVALID_POSTPONE';
      if (code === 'POSTPONE_AT_MUST_BE_FUTURE') {
        throw new BadRequestException(
          'A nova data de reativação deve ser futura.',
        );
      }
      throw new BadRequestException('Parâmetros de adiamento inválidos.');
    }

    const updated = await this.prisma.lead.update({
      where: { id: lead.id },
      data: { nextReactivationAt: toAt },
      include: {
        ownerUser: { select: { id: true, name: true } },
        configuredLossReason: { select: { id: true, name: true } },
      },
    });

    const preset =
      dto.days === 7 || dto.days === 15 || dto.days === 30
        ? dto.days
        : 'custom';

    await this.activityEngine.publish({
      tenantId,
      performedById: actor.userId,
      operationalEventKind: 'lead_reactivation_postponed',
      subject: `Reativação adiada — ${lead.name}`,
      description: [
        `De ${fromAt.toLocaleDateString('pt-BR')} para ${toAt.toLocaleDateString('pt-BR')}`,
        `Motivo: ${dto.reason.trim()}`,
      ].join(' · '),
      leadId: lead.id,
      metadata: {
        action: 'postpone',
        fromAt: fromAt.toISOString(),
        toAt: toAt.toISOString(),
        reasonText: dto.reason.trim(),
        preset,
        lossReasonId: lead.lossReasonId,
        lostReason: lead.lostReason,
        actorUserId: actor.userId,
      },
    });

    return updated;
  }

  private async findQueueLeadOrThrow(
    tenantId: string,
    leadId: string,
    actor?: BusinessUnitActor,
  ) {
    let where: Prisma.LeadWhereInput = {
      id: leadId,
      tenantId,
      status: 'lost',
      reactivationEnabled: true,
      nextReactivationAt: { not: null },
    };
    if (this.buAccess && actor) {
      const leadExtra = await this.buAccess.leadWhere(actor);
      where = andWhere(where, leadExtra);
    }

    const lead = await this.prisma.lead.findFirst({
      where,
      include: {
        configuredLossReason: { select: { id: true, name: true } },
      },
    });
    if (!lead) {
      throw new NotFoundException(
        'Lead não encontrado na fila de reativação (ou sem acesso).',
      );
    }
    return lead;
  }

  private applyWindow(
    where: Prisma.LeadWhereInput,
    window: ReactivationQueueWindow | undefined,
    now: Date,
  ): Prisma.LeadWhereInput {
    if (!window) return where;
    const startToday = startOfLocalDay(now);
    const endToday = endOfLocalDay(now);

    if (window === 'today') {
      return andWhere(where, {
        nextReactivationAt: { gte: startToday, lte: endToday },
      });
    }
    if (window === 'overdue') {
      return andWhere(where, {
        nextReactivationAt: { lt: startToday },
      });
    }
    if (window === 'next7') {
      const until = new Date(startToday);
      until.setDate(until.getDate() + 7);
      return andWhere(where, {
        nextReactivationAt: { gt: endToday, lte: until },
      });
    }
    return where;
  }

  private async computeMetrics(
    tenantId: string,
    actor: BusinessUnitActor | undefined,
    businessUnitId: string | undefined,
    now: Date,
  ) {
    const startToday = startOfLocalDay(now);
    const endToday = endOfLocalDay(now);
    const until7 = new Date(startToday);
    until7.setDate(until7.getDate() + 7);

    let base: Prisma.LeadWhereInput = {
      tenantId,
      status: 'lost',
      reactivationEnabled: true,
      nextReactivationAt: { not: null },
    };
    if (this.buAccess && actor) {
      const leadExtra = await this.buAccess.leadWhere(actor, businessUnitId);
      base = andWhere(base, leadExtra);
    } else if (businessUnitId) {
      base = andWhere(base, { businessUnitId });
    }

    const [today, overdue, next7] = await Promise.all([
      this.prisma.lead.count({
        where: andWhere(base, {
          nextReactivationAt: { gte: startToday, lte: endToday },
        }),
      }),
      this.prisma.lead.count({
        where: andWhere(base, {
          nextReactivationAt: { lt: startToday },
        }),
      }),
      this.prisma.lead.count({
        where: andWhere(base, {
          nextReactivationAt: { gt: endToday, lte: until7 },
        }),
      }),
    ]);

    return { today, overdue, next7 };
  }

  private toItem(
    lead: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      source: string | null;
      status: string;
      ownerUserId: string | null;
      ownerUser: { id: string; name: string } | null;
      lossReasonId: string | null;
      lostReason: string | null;
      lostAt: Date | null;
      nextReactivationAt: Date | null;
      lastContactAt: Date | null;
      lastInteractionAt: Date | null;
      businessUnitId: string | null;
      configuredLossReason: { id: string; name: string } | null;
      followUps: { scheduledAt: Date }[];
    },
    now: Date,
  ): ReactivationQueueItem {
    const at = lead.nextReactivationAt!;
    const startToday = startOfLocalDay(now);
    const endToday = endOfLocalDay(now);
    let windowStatus: ReactivationQueueItem['windowStatus'] = 'upcoming';
    if (at < startToday) windowStatus = 'overdue';
    else if (at >= startToday && at <= endToday) windowStatus = 'today';

    const nextFollowUp = lead.followUps[0]?.scheduledAt ?? null;

    return {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      ownerUserId: lead.ownerUserId,
      ownerName: lead.ownerUser?.name ?? null,
      lossReasonId: lead.lossReasonId,
      lossReasonName: lead.configuredLossReason?.name ?? null,
      lostReason: lead.lostReason,
      lostAt: lead.lostAt?.toISOString() ?? null,
      nextReactivationAt: at.toISOString(),
      daysOverdue: daysOverdue(at, now),
      lastContactAt:
        (lead.lastContactAt ?? lead.lastInteractionAt)?.toISOString() ?? null,
      nextContactAt: (nextFollowUp ?? at).toISOString(),
      businessUnitId: lead.businessUnitId,
      windowStatus,
    };
  }
}
