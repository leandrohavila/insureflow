import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { pickLatestDate } from '../../common/utils/activity-interaction.util';
import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import {
  assertActivityPerformer,
  assertActivityRelations,
  syncLeadLastContactFromActivities,
} from './activity-write.util';
import { activityInclude, serializeActivity } from './activity-serialize.util';
import type {
  CreateActivityDto,
  ListActivitiesQueryDto,
  UpdateActivityDto,
} from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async findActivities(
    tenantId: string,
    query: ListActivitiesQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.buildWhere(tenantId, query, actor);

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

  async findActivity(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertActivityVisible(actor, tenantId, id);
    }
    const activity = await this.findActivityOrThrow(tenantId, id);
    return serializeActivity(activity);
  }

  async createActivity(
    tenantId: string,
    performedById: string,
    dto: CreateActivityDto,
  ) {
    if (dto.type === undefined || dto.type === null) {
      throw new BadRequestException('type is required');
    }

    await assertActivityRelations(this.prisma, tenantId, dto);
    await assertActivityPerformer(this.prisma, tenantId, performedById);

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

    await syncLeadLastContactFromActivities(
      this.prisma,
      tenantId,
      activity.leadId,
    );
    return serializeActivity(activity);
  }

  async updateActivity(tenantId: string, id: string, dto: UpdateActivityDto) {
    const existing = await this.findActivityOrThrow(tenantId, id);

    const linkKeys: Array<'leadId' | 'dealId' | 'customerId' | 'policyId'> = [
      'leadId',
      'dealId',
      'customerId',
      'policyId',
    ];
    const dtoTouchesActivityLinks = linkKeys.some((key) =>
      Object.prototype.hasOwnProperty.call(dto, key),
    );

    if (dtoTouchesActivityLinks) {
      const mergedForAssert = {
        leadId: Object.prototype.hasOwnProperty.call(dto, 'leadId')
          ? (dto.leadId ?? null)
          : existing.leadId,
        dealId: Object.prototype.hasOwnProperty.call(dto, 'dealId')
          ? (dto.dealId ?? null)
          : existing.dealId,
        customerId: Object.prototype.hasOwnProperty.call(dto, 'customerId')
          ? (dto.customerId ?? null)
          : existing.customerId,
        policyId: Object.prototype.hasOwnProperty.call(dto, 'policyId')
          ? (dto.policyId ?? null)
          : existing.policyId,
      };
      await assertActivityRelations(this.prisma, tenantId, mergedForAssert);
    }

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
      await syncLeadLastContactFromActivities(this.prisma, tenantId, leadId);
    }

    return serializeActivity(activity);
  }

  async deleteActivity(tenantId: string, id: string) {
    const existing = await this.findActivityOrThrow(tenantId, id);
    await this.prisma.activity.delete({ where: { id } });
    await syncLeadLastContactFromActivities(
      this.prisma,
      tenantId,
      existing.leadId,
    );
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

  private async buildWhere(
    tenantId: string,
    query: ListActivitiesQueryDto,
    actor?: BusinessUnitActor,
  ): Promise<Prisma.ActivityWhereInput> {
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

    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.activityWhere(actor);
      if (buWhere) return andWhere(where, buWhere);
    }

    return where;
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
