import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import {
  computeCommissionValue,
  defaultCommissionPercent,
  targetScopeKey,
} from '../../common/utils/sales-commission.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import type {
  ListCommissionsQueryDto,
  UpdateCommissionDto,
} from './dto/sales-performance.dto';

@Injectable()
export class CommissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityEngine: ActivityEngineService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async list(
    tenantId: string,
    query: ListCommissionsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    let where: Prisma.SalesCommissionWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.dealWhere(actor, query.businessUnitId);
      if (extra) where = andWhere(where, extra);
    } else if (query.businessUnitId) {
      where = { ...where, businessUnitId: query.businessUnitId };
    }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.salesCommission.count({ where }),
      this.prisma.salesCommission.findMany({
        where,
        include: commissionInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      data: rows.map(serializeCommission),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCommissionDto,
    performedById: string,
    actor?: BusinessUnitActor,
  ) {
    const current = await this.requireCommission(tenantId, id, actor);
    const updated = await this.prisma.salesCommission.update({
      where: { id: current.id },
      data: { status: dto.status },
      include: commissionInclude,
    });
    const kind =
      dto.status === 'APPROVED'
        ? 'commission_approved'
        : dto.status === 'PAID'
          ? 'commission_paid'
          : null;
    if (kind) {
      await this.activityEngine.publish({
        tenantId,
        performedById,
        operationalEventKind: kind,
        subject: `Comissão ${dto.status.toLowerCase()} — ${updated.deal.title}`,
        dealId: updated.dealId,
        customerId: updated.deal.customerId,
        metadata: { commissionId: updated.id, status: dto.status },
      });
    }
    return serializeCommission(updated);
  }

  async onDealWon(tenantId: string, dealId: string, performedById: string) {
    const existing = await this.prisma.salesCommission.findUnique({
      where: { dealId },
    });
    if (existing) return serializeCommissionBare(existing);

    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, tenantId, status: 'won' },
      include: {
        businessUnit: { select: { type: true } },
        ownerUser: { select: { id: true, primaryTeamId: true } },
      },
    });
    if (!deal) return null;

    const productType =
      deal.productType ??
      (deal.businessUnit?.type === 'REAL_ESTATE' ? 'VENDA' : 'AUTO');
    const rule = deal.businessUnitId
      ? await this.prisma.commissionRule.findFirst({
          where: {
            tenantId,
            businessUnitId: deal.businessUnitId,
            productType,
            isActive: true,
          },
        })
      : null;
    const percentage = Number(
      rule?.commissionPercentage ??
        defaultCommissionPercent({
          productType,
          unitType: deal.businessUnit?.type,
        }),
    );
    const value = computeCommissionValue({
      dealValue: Number(deal.value),
      percentage,
      productType,
    });

    const created = await this.prisma.salesCommission.create({
      data: {
        tenantId,
        dealId: deal.id,
        userId: deal.ownerUserId,
        businessUnitId: deal.businessUnitId,
        commissionPercentage: new Prisma.Decimal(percentage),
        commissionValue: new Prisma.Decimal(value),
        status: 'PENDING',
      },
    });

    await this.applyTargetProgress(deal);
    await this.activityEngine.publish({
      tenantId,
      performedById,
      operationalEventKind: 'deal_commission_created',
      subject: `Comissão gerada — ${deal.title}`,
      dealId: deal.id,
      customerId: deal.customerId,
      metadata: {
        commissionId: created.id,
        percentage,
        value,
        productType,
      },
      idempotencyKey: {
        operationalEventKind: 'deal_commission_created',
        dealId: deal.id,
      },
    });
    return serializeCommissionBare(created);
  }

  private async applyTargetProgress(deal: {
    tenantId: string;
    value: Prisma.Decimal;
    ownerUserId: string | null;
    businessUnitId: string | null;
    wonAt: Date | null;
    ownerUser: { primaryTeamId: string | null } | null;
  }) {
    const when = deal.wonAt ?? new Date();
    const month = when.getUTCMonth() + 1;
    const year = when.getUTCFullYear();
    const scopes = [
      targetScopeKey({
        businessUnitId: deal.businessUnitId,
        userId: deal.ownerUserId,
      }),
      targetScopeKey({ businessUnitId: deal.businessUnitId }),
    ];
    if (deal.ownerUser?.primaryTeamId) {
      scopes.push(
        targetScopeKey({
          businessUnitId: deal.businessUnitId,
          teamId: deal.ownerUser.primaryTeamId,
        }),
      );
    }
    await this.prisma.salesTarget.updateMany({
      where: {
        tenantId: deal.tenantId,
        month,
        year,
        scopeKey: { in: scopes },
      },
      data: {
        achievedDeals: { increment: 1 },
        achievedRevenue: { increment: deal.value },
      },
    });
  }

  private async requireCommission(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    let where: Prisma.SalesCommissionWhereInput = { id, tenantId };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.dealWhere(actor);
      if (extra) where = andWhere(where, extra);
    }
    const row = await this.prisma.salesCommission.findFirst({
      where,
      include: commissionInclude,
    });
    if (!row) throw new NotFoundException('Comissão não encontrada');
    return row;
  }
}

const commissionInclude = {
  deal: { select: { id: true, title: true, value: true, customerId: true } },
  user: { select: { id: true, name: true } },
  businessUnit: { select: { id: true, name: true, type: true } },
} as const;

function serializeCommission(
  row: Prisma.SalesCommissionGetPayload<{ include: typeof commissionInclude }>,
) {
  return {
    ...serializeCommissionBare(row),
    deal: { ...row.deal, value: Number(row.deal.value) },
    user: row.user,
    businessUnit: row.businessUnit,
  };
}

function serializeCommissionBare(row: {
  id: string;
  tenantId: string;
  dealId: string;
  userId: string | null;
  businessUnitId: string | null;
  commissionPercentage: Prisma.Decimal;
  commissionValue: Prisma.Decimal;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    commissionPercentage: Number(row.commissionPercentage),
    commissionValue: Number(row.commissionValue),
  };
}
