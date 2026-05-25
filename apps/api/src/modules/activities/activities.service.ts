import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { pickLatestDate } from '../../common/utils/activity-interaction.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { activityInclude, serializeActivity } from './activity-serialize.util';
import type {
  CreateActivityDto,
  ListActivitiesQueryDto,
  UpdateActivityDto,
} from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findActivities(tenantId: string, query: ListActivitiesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(tenantId, query);

    const [total, activities] = await this.prisma.$transaction([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        include: activityInclude,
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: activities.map((activity) => serializeActivity(activity)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findActivity(tenantId: string, id: string) {
    const activity = await this.findActivityOrThrow(tenantId, id);
    return serializeActivity(activity);
  }

  async createActivity(
    tenantId: string,
    performedById: string,
    dto: CreateActivityDto,
  ) {
    await this.assertRelations(tenantId, dto);
    await this.assertPerformer(tenantId, performedById);

    const activity = await this.prisma.activity.create({
      data: {
        tenantId,
        type: dto.type,
        status: dto.status ?? 'pending',
        subject: dto.subject.trim(),
        description: dto.description?.trim() || null,
        outcome: dto.outcome?.trim() || null,
        occurredAt: new Date(dto.occurredAt),
        nextFollowUpAt: dto.nextFollowUpAt
          ? new Date(dto.nextFollowUpAt)
          : null,
        leadId: dto.leadId ?? null,
        dealId: dto.dealId ?? null,
        customerId: dto.customerId ?? null,
        policyId: dto.policyId ?? null,
        performedById,
      },
      include: activityInclude,
    });

    await this.syncLeadLastContact(tenantId, activity.leadId);
    return serializeActivity(activity);
  }

  async updateActivity(tenantId: string, id: string, dto: UpdateActivityDto) {
    const existing = await this.findActivityOrThrow(tenantId, id);
    await this.assertRelations(tenantId, {
      leadId: dto.leadId ?? existing.leadId ?? undefined,
      dealId: dto.dealId ?? existing.dealId ?? undefined,
      customerId: dto.customerId ?? existing.customerId ?? undefined,
      policyId: dto.policyId ?? existing.policyId ?? undefined,
    });

    const activity = await this.prisma.activity.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.outcome !== undefined
          ? { outcome: dto.outcome?.trim() || null }
          : {}),
        ...(dto.occurredAt !== undefined
          ? { occurredAt: new Date(dto.occurredAt) }
          : {}),
        ...(dto.nextFollowUpAt !== undefined
          ? {
              nextFollowUpAt: dto.nextFollowUpAt
                ? new Date(dto.nextFollowUpAt)
                : null,
            }
          : {}),
        ...(dto.leadId !== undefined ? { leadId: dto.leadId } : {}),
        ...(dto.dealId !== undefined ? { dealId: dto.dealId } : {}),
        ...(dto.customerId !== undefined ? { customerId: dto.customerId } : {}),
        ...(dto.policyId !== undefined ? { policyId: dto.policyId } : {}),
      },
      include: activityInclude,
    });

    const leadIds = new Set(
      [existing.leadId, activity.leadId].filter((value): value is string =>
        Boolean(value),
      ),
    );
    for (const leadId of leadIds) {
      await this.syncLeadLastContact(tenantId, leadId);
    }

    return serializeActivity(activity);
  }

  async deleteActivity(tenantId: string, id: string) {
    const existing = await this.findActivityOrThrow(tenantId, id);
    await this.prisma.activity.delete({ where: { id } });
    await this.syncLeadLastContact(tenantId, existing.leadId);
    return { deleted: true, id };
  }

  async maxOccurredAtByLeadIds(tenantId: string, leadIds: string[]) {
    return this.maxOccurredAtMap(tenantId, 'leadId', leadIds);
  }

  async maxOccurredAtByDealIds(tenantId: string, dealIds: string[]) {
    return this.maxOccurredAtMap(tenantId, 'dealId', dealIds);
  }

  private async maxOccurredAtMap(
    tenantId: string,
    field: 'leadId' | 'dealId',
    ids: string[],
  ) {
    const unique = [...new Set(ids.filter(Boolean))];
    const map = new Map<string, Date>();
    if (unique.length === 0) return map;

    const rows = await this.prisma.activity.groupBy({
      by: [field],
      where: { tenantId, [field]: { in: unique } },
      _max: { occurredAt: true },
    });

    for (const row of rows) {
      const key = row[field];
      const occurredAt = row._max.occurredAt;
      if (key && occurredAt) {
        map.set(key, occurredAt);
      }
    }

    return map;
  }

  private buildWhere(
    tenantId: string,
    query: ListActivitiesQueryDto,
  ): Prisma.ActivityWhereInput {
    const where: Prisma.ActivityWhereInput = { tenantId };

    if (query.status) where.status = query.status;
    if (query.leadId) where.leadId = query.leadId;
    if (query.dealId) where.dealId = query.dealId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.type) where.type = query.type;

    if (query.occurredAtFrom || query.occurredAtTo) {
      where.occurredAt = {};
      if (query.occurredAtFrom) {
        where.occurredAt.gte = new Date(query.occurredAtFrom);
      }
      if (query.occurredAtTo) {
        where.occurredAt.lte = new Date(query.occurredAtTo);
      }
    }

    if (query.nextFollowUpFrom || query.nextFollowUpTo) {
      where.nextFollowUpAt = { not: null };
      if (query.nextFollowUpFrom) {
        where.nextFollowUpAt = {
          ...(where.nextFollowUpAt as Prisma.DateTimeNullableFilter),
          gte: new Date(query.nextFollowUpFrom),
        };
      }
      if (query.nextFollowUpTo) {
        where.nextFollowUpAt = {
          ...(where.nextFollowUpAt as Prisma.DateTimeNullableFilter),
          lte: new Date(query.nextFollowUpTo),
        };
      }
    }

    return where;
  }

  private async assertRelations(
    tenantId: string,
    dto: {
      leadId?: string | null;
      dealId?: string | null;
      customerId?: string | null;
      policyId?: string | null;
    },
  ) {
    const leadId = dto.leadId ?? undefined;
    const dealId = dto.dealId ?? undefined;
    const customerId = dto.customerId ?? undefined;
    const policyId = dto.policyId ?? undefined;

    if (!leadId && !dealId && !customerId && !policyId) {
      throw new BadRequestException(
        'Informe pelo menos um vínculo: leadId, dealId, customerId ou policyId',
      );
    }

    if (leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: { id: leadId, tenantId },
        select: { id: true },
      });
      if (!lead) {
        throw new NotFoundException('Lead não encontrado');
      }
    }

    if (dealId) {
      const deal = await this.prisma.deal.findFirst({
        where: { id: dealId, tenantId },
        select: { id: true },
      });
      if (!deal) {
        throw new NotFoundException('Negócio não encontrado');
      }
    }

    if (customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, tenantId },
        select: { id: true },
      });
      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }
    }

    if (policyId) {
      const policy = await this.prisma.policy.findFirst({
        where: { id: policyId, tenantId },
        select: { id: true },
      });
      if (!policy) {
        throw new NotFoundException('Apólice não encontrada');
      }
    }
  }

  private async assertPerformer(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
  }

  private async syncLeadLastContact(tenantId: string, leadId: string | null) {
    if (!leadId) return;

    const aggregate = await this.prisma.activity.aggregate({
      where: { tenantId, leadId },
      _max: { occurredAt: true },
    });

    await this.prisma.lead.update({
      where: { id: leadId },
      data: { lastContactAt: aggregate._max.occurredAt ?? null },
    });
  }

  private async findActivityOrThrow(tenantId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, tenantId },
      include: activityInclude,
    });
    if (!activity) {
      throw new NotFoundException('Atividade não encontrada');
    }
    return activity;
  }

  /** Última interação humana (MAX occurredAt) com fallback opcional. */
  static resolveLastInteractionAt(
    activityOccurredAt: Date | null | undefined,
    ...fallbacks: (Date | string | null | undefined)[]
  ): string | null {
    const latest = pickLatestDate(activityOccurredAt, ...fallbacks);
    return latest?.toISOString() ?? null;
  }
}
