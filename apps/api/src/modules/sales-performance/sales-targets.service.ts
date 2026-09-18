import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { targetScopeKey } from '../../common/utils/sales-commission.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import type {
  CreateSalesTargetDto,
  ListSalesTargetsQueryDto,
  UpdateSalesTargetDto,
} from './dto/sales-performance.dto';

@Injectable()
export class SalesTargetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityEngine: ActivityEngineService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async list(
    tenantId: string,
    query: ListSalesTargetsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    let where: Prisma.SalesTargetWhereInput = {
      tenantId,
      ...(query.month ? { month: query.month } : {}),
      ...(query.year ? { year: query.year } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.teamId ? { teamId: query.teamId } : {}),
    };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.dealWhere(actor, query.businessUnitId);
      if (extra) where = andWhere(where, extra);
    } else if (query.businessUnitId) {
      where = { ...where, businessUnitId: query.businessUnitId };
    }
    const rows = await this.prisma.salesTarget.findMany({
      where,
      include: targetInclude,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return rows.map(serializeTarget);
  }

  async create(
    tenantId: string,
    dto: CreateSalesTargetDto,
    performedById: string,
    actor?: BusinessUnitActor,
  ) {
    if (actor && this.buAccess && dto.businessUnitId) {
      await this.buAccess.resolveIds(actor, dto.businessUnitId);
    }
    const scopeKey = targetScopeKey({
      businessUnitId: dto.businessUnitId,
      userId: dto.userId,
      teamId: dto.teamId,
    });
    const existing = await this.prisma.salesTarget.findUnique({
      where: {
        tenantId_scopeKey_month_year: {
          tenantId,
          scopeKey,
          month: dto.month,
          year: dto.year,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Já existe meta para este recorte e período');
    }
    const created = await this.prisma.salesTarget.create({
      data: {
        tenantId,
        businessUnitId: dto.businessUnitId ?? null,
        userId: dto.userId ?? null,
        teamId: dto.teamId ?? null,
        month: dto.month,
        year: dto.year,
        targetDeals: dto.targetDeals ?? 0,
        targetRevenue: new Prisma.Decimal(dto.targetRevenue ?? 0),
        scopeKey,
      },
      include: targetInclude,
    });
    await this.activityEngine.publish({
      tenantId,
      performedById,
      operationalEventKind: 'target_created',
      subject: `Meta ${dto.month}/${dto.year} criada`,
      metadata: { targetId: created.id, scopeKey },
    });
    return serializeTarget(created);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateSalesTargetDto,
    performedById: string,
    actor?: BusinessUnitActor,
  ) {
    const current = await this.requireTarget(tenantId, id, actor);
    const updated = await this.prisma.salesTarget.update({
      where: { id: current.id },
      data: {
        ...(dto.targetDeals !== undefined ? { targetDeals: dto.targetDeals } : {}),
        ...(dto.targetRevenue !== undefined
          ? { targetRevenue: new Prisma.Decimal(dto.targetRevenue) }
          : {}),
      },
      include: targetInclude,
    });
    await this.activityEngine.publish({
      tenantId,
      performedById,
      operationalEventKind: 'target_updated',
      subject: `Meta ${updated.month}/${updated.year} atualizada`,
      metadata: { targetId: updated.id },
    });
    return serializeTarget(updated);
  }

  private async requireTarget(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    let where: Prisma.SalesTargetWhereInput = { id, tenantId };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.dealWhere(actor);
      if (extra) where = andWhere(where, extra);
    }
    const row = await this.prisma.salesTarget.findFirst({
      where,
      include: targetInclude,
    });
    if (!row) throw new NotFoundException('Meta não encontrada');
    return row;
  }
}

const targetInclude = {
  user: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  businessUnit: { select: { id: true, name: true, type: true } },
} as const;

function serializeTarget(
  row: Prisma.SalesTargetGetPayload<{ include: typeof targetInclude }>,
) {
  const targetRevenue = Number(row.targetRevenue);
  const achievedRevenue = Number(row.achievedRevenue);
  return {
    ...row,
    targetRevenue,
    achievedRevenue,
    attainment:
      targetRevenue <= 0
        ? 0
        : Math.round((achievedRevenue / targetRevenue) * 1000) / 10,
  };
}
