import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { andWhere, type BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import {
  businessUnitTypeForOpportunity,
  suggestOpportunities,
  type OpportunityType,
} from '../../common/utils/opportunity-engine.util';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import type {
  CreateOpportunityDto,
  ListOpportunitiesQueryDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly activityEngine?: ActivityEngineService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async findAll(
    tenantId: string,
    query: ListOpportunitiesQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    let where: Prisma.OpportunityWhereInput = {
      tenantId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.score ? { score: query.score } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
    };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.opportunityWhere(
        actor,
        query.businessUnitId,
      );
      if (extra) where = andWhere(where, extra);
    } else if (query.businessUnitId) {
      where = { ...where, businessUnitId: query.businessUnitId };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.opportunity.count({ where }),
      this.prisma.opportunity.findMany({
        where,
        include: opportunityInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: data.map(serializeOpportunity),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(tenantId: string, id: string, actor?: BusinessUnitActor) {
    if (this.buAccess) {
      await this.buAccess.assertOpportunityVisible(actor, tenantId, id);
    }
    const row = await this.prisma.opportunity.findFirst({
      where: { id, tenantId },
      include: opportunityInclude,
    });
    if (!row) throw new NotFoundException('Oportunidade não encontrada');
    return serializeOpportunity(row);
  }

  async create(
    tenantId: string,
    dto: CreateOpportunityDto,
    actorUserId?: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
      select: { id: true, ownerUserId: true, businessUnitId: true },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const created = await this.prisma.opportunity.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        type: dto.type,
        status: dto.status ?? 'OPEN',
        source: dto.source ?? 'MANUAL',
        score: dto.score ?? 'MEDIUM',
        originType: dto.originType ?? 'MANUAL',
        businessUnitId:
          dto.businessUnitId ?? customer.businessUnitId ?? null,
        assignedUserId:
          dto.assignedUserId ?? customer.ownerUserId ?? actorUserId ?? null,
        estimatedValue:
          dto.estimatedValue !== undefined
            ? new Prisma.Decimal(dto.estimatedValue)
            : null,
      },
      include: opportunityInclude,
    });
    await this.publish(tenantId, created.customerId, created.assignedUserId, 'opportunity_created', created.type);
    return serializeOpportunity(created);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateOpportunityDto,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertOpportunityVisible(actor, tenantId, id);
    }
    const existing = await this.prisma.opportunity.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Oportunidade não encontrada');

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.score !== undefined ? { score: dto.score } : {}),
        ...(dto.assignedUserId !== undefined
          ? { assignedUserId: dto.assignedUserId }
          : {}),
        ...(dto.businessUnitId !== undefined
          ? { businessUnitId: dto.businessUnitId }
          : {}),
        ...(dto.estimatedValue !== undefined
          ? { estimatedValue: new Prisma.Decimal(dto.estimatedValue) }
          : {}),
        ...(dto.convertedDealId !== undefined
          ? { convertedDealId: dto.convertedDealId }
          : {}),
      },
      include: opportunityInclude,
    });

    if (dto.status === 'WON' && existing.status !== 'WON') {
      await this.publish(
        tenantId,
        updated.customerId,
        updated.assignedUserId,
        'opportunity_converted',
        updated.type,
      );
    }
    return serializeOpportunity(updated);
  }

  async generateForCustomer(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: {
        id: true,
        ownerUserId: true,
        businessUnitId: true,
        interestCategories: true,
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const units = await this.prisma.businessUnit.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, type: true },
    });
    const suggestions = suggestOpportunities(customer.interestCategories);
    let created = 0;

    for (const suggestion of suggestions) {
      const unitType = businessUnitTypeForOpportunity(suggestion.type);
      const unitId =
        units.find((unit) => unit.type === unitType)?.id ??
        customer.businessUnitId;
      const result = await this.prisma.opportunity.upsert({
        where: {
          customerId_type_originType: {
            customerId,
            type: suggestion.type,
            originType: suggestion.originType,
          },
        },
        create: {
          tenantId,
          customerId,
          type: suggestion.type,
          originType: suggestion.originType,
          score: suggestion.score,
          source: suggestion.source,
          status: 'OPEN',
          assignedUserId: customer.ownerUserId,
          businessUnitId: unitId,
        },
        update: {},
      });
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created += 1;
        await this.publish(
          tenantId,
          customerId,
          customer.ownerUserId,
          'opportunity_created',
          suggestion.type,
        );
      }
    }

    return { created, suggestions };
  }

  async generateForTenant(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, status: 'active' },
      select: { id: true },
    });
    let created = 0;
    for (const customer of customers) {
      created += (await this.generateForCustomer(tenantId, customer.id)).created;
    }
    return { created };
  }

  private async publish(
    tenantId: string,
    customerId: string,
    performedById: string | null,
    kind: 'opportunity_created' | 'opportunity_converted',
    type: OpportunityType,
  ) {
    if (!this.activityEngine || !performedById) return;
    await this.activityEngine.publish({
      tenantId,
      performedById,
      customerId,
      operationalEventKind: kind,
      subject:
        kind === 'opportunity_converted'
          ? `Oportunidade convertida — ${type}`
          : `Oportunidade — ${type}`,
    });
  }
}

const opportunityInclude = {
  customer: { select: { id: true, name: true, document: true } },
  businessUnit: {
    select: { id: true, name: true, slug: true, type: true, isActive: true },
  },
  assignedUser: { select: { id: true, name: true } },
} satisfies Prisma.OpportunityInclude;

function serializeOpportunity(
  row: Prisma.OpportunityGetPayload<{ include: typeof opportunityInclude }>,
) {
  return {
    ...row,
    estimatedValue: row.estimatedValue ? Number(row.estimatedValue) : null,
  };
}
