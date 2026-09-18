import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  FOLLOW_UP_TYPES,
  type FollowUpType,
} from '../../common/constants/interest-categories';
import {
  FORGOTTEN_LEAD_IDLE_DAYS,
  isFollowUpDueToday,
  isFollowUpOverdue,
  POST_REACTIVATION_FOLLOW_UP_DAYS,
  scheduleFollowUpAt,
  subtractUtcDays,
} from '../../common/utils/commercial-recovery.util';
import { addUtcDays, startOfUtcDay } from '../../common/utils/lead-reactivation.util';
import { andWhere, type BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import type {
  CreateLeadFollowUpDto,
  ListLeadFollowUpsQueryDto,
  UpdateLeadFollowUpDto,
} from './dto/lead-follow-up.dto';

const followUpInclude = {
  lead: {
    select: {
      id: true,
      name: true,
      status: true,
      assignedTo: true,
      ownerUserId: true,
      businessUnitId: true,
      ownerUser: { select: { id: true, name: true } },
    },
  },
  assignedUser: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

@Injectable()
export class LeadFollowUpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityEngine: ActivityEngineService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async findAll(
    tenantId: string,
    query: ListLeadFollowUpsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const now = new Date();
    const where = await this.buildWhere(tenantId, query, now, actor);

    const [total, data] = await this.prisma.$transaction([
      this.prisma.leadFollowUp.count({ where }),
      this.prisma.leadFollowUp.findMany({
        where,
        include: followUpInclude,
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const metricBase: Prisma.LeadFollowUpWhereInput = {
      tenantId,
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
    };
    let metricWhere = metricBase;
    if (this.buAccess && actor) {
      const buWhere = await this.buAccess.followUpWhere(
        actor,
        query.businessUnitId,
      );
      if (buWhere) metricWhere = andWhere(metricBase, buWhere);
    } else if (query.businessUnitId) {
      metricWhere = { ...metricBase, businessUnitId: query.businessUnitId };
    }

    const [pending, overdue, completed] = await Promise.all([
      this.prisma.leadFollowUp.count({
        where: { ...metricWhere, status: 'PENDING' },
      }),
      this.prisma.leadFollowUp.count({
        where: {
          ...metricWhere,
          status: 'PENDING',
          scheduledAt: { lt: startOfUtcDay(now) },
        },
      }),
      this.prisma.leadFollowUp.count({
        where: { ...metricWhere, status: 'COMPLETED' },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      metrics: {
        pending,
        overdue,
        completed,
      },
    };
  }

  async findOne(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertFollowUpVisible(actor, tenantId, id);
    }
    const item = await this.prisma.leadFollowUp.findFirst({
      where: { id, tenantId },
      include: followUpInclude,
    });
    if (!item) {
      throw new NotFoundException('Follow-up não encontrado');
    }
    return item;
  }

  async create(
    tenantId: string,
    dto: CreateLeadFollowUpDto,
    actorUserId: string,
  ) {
    const lead = await this.requireLead(tenantId, dto.leadId);
    const created = await this.prisma.leadFollowUp.create({
      data: {
        tenantId,
        leadId: lead.id,
        scheduledAt: new Date(dto.scheduledAt),
        type: dto.type,
        notes: dto.notes?.trim() || null,
        createdById: actorUserId,
        assignedUserId: dto.assignedUserId || lead.ownerUserId,
        businessUnitId: lead.businessUnitId,
      },
      include: followUpInclude,
    });

    await this.activityEngine.publish({
      tenantId,
      performedById: actorUserId,
      operationalEventKind: 'lead_follow_up_scheduled',
      subject: `Follow-up agendado — ${lead.name}`,
      description: dto.notes ?? `Contato ${dto.type} em ${dto.scheduledAt}`,
      leadId: lead.id,
      metadata: { followUpId: created.id, type: dto.type },
    });

    return created;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateLeadFollowUpDto,
    actorUserId: string,
    actor?: BusinessUnitActor,
  ) {
    const existing = await this.findOne(tenantId, id, actor);
    const updated = await this.prisma.leadFollowUp.update({
      where: { id },
      data: {
        ...(dto.scheduledAt !== undefined
          ? { scheduledAt: new Date(dto.scheduledAt) }
          : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        ...(dto.assignedUserId !== undefined
          ? { assignedUserId: dto.assignedUserId || null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: followUpInclude,
    });

    if (dto.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await this.prisma.lead.update({
        where: { id: existing.leadId },
        data: { lastInteractionAt: new Date(), lastContactAt: new Date() },
      });
      await this.activityEngine.publish({
        tenantId,
        performedById: actorUserId,
        operationalEventKind: 'lead_follow_up_completed',
        subject: `Follow-up concluído — ${existing.lead.name}`,
        leadId: existing.leadId,
        metadata: { followUpId: id, type: existing.type },
      });
    }

    return updated;
  }

  async scheduleOnLeadCreate(params: {
    tenantId: string;
    leadId: string;
    actorUserId: string;
    days: number;
    type?: FollowUpType;
    notes?: string | null;
  }) {
    const lead = await this.requireLead(params.tenantId, params.leadId);
    const scheduledAt = scheduleFollowUpAt(new Date(), params.days);
    const type = params.type ?? 'WHATSAPP';
    const created = await this.prisma.leadFollowUp.create({
      data: {
        tenantId: params.tenantId,
        leadId: lead.id,
        scheduledAt,
        type,
        notes:
          params.notes?.trim() ||
          `Próximo contato automático em ${params.days} dia(s)`,
        createdById: params.actorUserId,
        assignedUserId: lead.ownerUserId,
        businessUnitId: lead.businessUnitId,
      },
    });

    await this.activityEngine.publish({
      tenantId: params.tenantId,
      performedById: params.actorUserId,
      operationalEventKind: 'lead_follow_up_scheduled',
      subject: `Follow-up agendado — ${lead.name}`,
      description: created.notes,
      leadId: lead.id,
      metadata: {
        followUpId: created.id,
        type,
        source: 'lead_create',
      },
    });

    return created;
  }

  async scheduleAfterReactivation(params: {
    tenantId: string;
    leadId: string;
    performerId: string;
  }) {
    const pending = await this.prisma.leadFollowUp.findFirst({
      where: {
        tenantId: params.tenantId,
        leadId: params.leadId,
        status: 'PENDING',
      },
      select: { id: true },
    });
    if (pending) return null;

    return this.scheduleOnLeadCreate({
      tenantId: params.tenantId,
      leadId: params.leadId,
      actorUserId: params.performerId,
      days: POST_REACTIVATION_FOLLOW_UP_DAYS,
      type: 'WHATSAPP',
      notes: 'Retorno após reativação automática',
    });
  }

  async processDailyAutomation(now = new Date(), tenantId?: string) {
    const summary = {
      dueAlerts: 0,
      overdueAlerts: 0,
      forgottenCreated: 0,
    };

    const pending = await this.prisma.leadFollowUp.findMany({
      where: {
        status: 'PENDING',
        alertedAt: null,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        lead: { select: { id: true, name: true, tenantId: true } },
      },
      take: 500,
    });

    for (const item of pending) {
      const dueToday = isFollowUpDueToday({
        status: item.status,
        scheduledAt: item.scheduledAt,
        now,
      });
      const overdue = isFollowUpOverdue({
        status: item.status,
        scheduledAt: item.scheduledAt,
        now,
      });
      if (!dueToday && !overdue) continue;

      const performerId = await this.resolvePerformerId(
        item.tenantId,
        item.assignedUserId ?? item.createdById,
      );
      if (!performerId) continue;

      await this.activityEngine.publish({
        tenantId: item.tenantId,
        performedById: performerId,
        operationalEventKind: 'lead_follow_up_due',
        subject: overdue
          ? `Follow-up atrasado — ${item.lead.name}`
          : `Follow-up de hoje — ${item.lead.name}`,
        description: item.notes,
        leadId: item.leadId,
        metadata: {
          followUpId: item.id,
          type: item.type,
          overdue,
        },
      });
      await this.prisma.leadFollowUp.update({
        where: { id: item.id },
        data: { alertedAt: now },
      });
      if (overdue) summary.overdueAlerts += 1;
      else summary.dueAlerts += 1;
    }

    summary.forgottenCreated = await this.createForgottenFollowUps(now, tenantId);
    return summary;
  }

  private async createForgottenFollowUps(now: Date, tenantId?: string) {
    const idleBefore = subtractUtcDays(now, FORGOTTEN_LEAD_IDLE_DAYS);
    const leads = await this.prisma.lead.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        status: { in: ['new', 'contacted', 'qualified'] },
        followUps: { none: {} },
        OR: [
          { lastInteractionAt: { lte: idleBefore } },
          { lastInteractionAt: null, createdAt: { lte: idleBefore } },
        ],
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        ownerUserId: true,
        businessUnitId: true,
      },
      take: 100,
    });

    let created = 0;
    for (const lead of leads) {
      const performerId = await this.resolvePerformerId(
        lead.tenantId,
        lead.ownerUserId,
      );
      if (!performerId) continue;
      await this.prisma.leadFollowUp.create({
        data: {
          tenantId: lead.tenantId,
          leadId: lead.id,
          scheduledAt: now,
          type: 'CALL',
          notes: 'Oportunidade sem follow-up — retomada automática',
          createdById: performerId,
          assignedUserId: lead.ownerUserId,
          businessUnitId: lead.businessUnitId,
        },
      });
      await this.activityEngine.publish({
        tenantId: lead.tenantId,
        performedById: performerId,
        operationalEventKind: 'lead_follow_up_scheduled',
        subject: `Follow-up de recuperação — ${lead.name}`,
        leadId: lead.id,
        metadata: { source: 'forgotten_opportunity' },
      });
      created += 1;
    }
    return created;
  }

  isFollowUpType(value: string | undefined): value is FollowUpType {
    return (
      typeof value === 'string' &&
      (FOLLOW_UP_TYPES as readonly string[]).includes(value)
    );
  }

  private async buildWhere(
    tenantId: string,
    query: ListLeadFollowUpsQueryDto,
    now: Date,
    actor?: BusinessUnitActor,
  ): Promise<Prisma.LeadFollowUpWhereInput> {
    const startToday = startOfUtcDay(now);
    const endToday = addUtcDays(startToday, 1);
    const next7 = addUtcDays(startToday, 7);

    const windowWhere: Prisma.LeadFollowUpWhereInput =
      query.window === 'today'
        ? { scheduledAt: { gte: startToday, lt: endToday } }
        : query.window === 'overdue'
          ? { status: 'PENDING', scheduledAt: { lt: startToday } }
          : query.window === 'next7'
            ? { scheduledAt: { gte: startToday, lt: next7 } }
            : {};

    const where: Prisma.LeadFollowUpWhereInput = {
      tenantId,
      ...windowWhere,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
    };

    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.followUpWhere(
        actor,
        query.businessUnitId,
      );
      if (buWhere) return andWhere(where, buWhere);
    }

    return {
      ...where,
      ...(query.businessUnitId ? { businessUnitId: query.businessUnitId } : {}),
    };
  }

  private async requireLead(tenantId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: {
        id: true,
        name: true,
        ownerUserId: true,
        businessUnitId: true,
      },
    });
    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }
    return lead;
  }

  private async resolvePerformerId(
    tenantId: string,
    preferredUserId?: string | null,
  ) {
    if (preferredUserId) return preferredUserId;
    const user = await this.prisma.user.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return user?.id ?? null;
  }
}
