import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { periodBounds } from '../../common/utils/sales-commission.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type { PerformanceQueryDto } from './dto/sales-performance.dto';

@Injectable()
export class PerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async getDashboard(
    tenantId: string,
    query: PerformanceQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const bounds = periodBounds({
      year: query.year ?? new Date().getUTCFullYear(),
      month: query.month,
      period: query.period ?? 'month',
    });
    const { dealScope, commissionScope, targetScope } = await this.scopes(
      tenantId,
      query,
      actor,
    );

    const [
      wonAgg,
      openAgg,
      createdCount,
      wonCount,
      commissions,
      targets,
    ] = await Promise.all([
      this.prisma.deal.aggregate({
        where: {
          ...dealScope,
          status: 'won',
          wonAt: { gte: bounds.from, lt: bounds.to },
        },
        _sum: { value: true },
        _count: { _all: true },
      }),
      this.prisma.deal.aggregate({
        where: { ...dealScope, status: 'open' },
        _sum: { value: true },
      }),
      this.prisma.deal.count({
        where: { ...dealScope, createdAt: { gte: bounds.from, lt: bounds.to } },
      }),
      this.prisma.deal.count({
        where: {
          ...dealScope,
          status: 'won',
          wonAt: { gte: bounds.from, lt: bounds.to },
        },
      }),
      this.prisma.salesCommission.groupBy({
        by: ['status'],
        where: {
          ...commissionScope,
          createdAt: { gte: bounds.from, lt: bounds.to },
        },
        _sum: { commissionValue: true },
      }),
      this.prisma.salesTarget.aggregate({
        where: {
          ...targetScope,
          year: bounds.year,
          ...(bounds.month ? { month: bounds.month } : {}),
        },
        _sum: { targetRevenue: true, achievedRevenue: true },
      }),
    ]);

    const monthRevenue = Number(wonAgg._sum.value ?? 0);
    const forecastRevenue = Number(openAgg._sum.value ?? 0);
    const targetRevenue = Number(targets._sum.targetRevenue ?? 0);
    const pending = sumStatus(commissions, 'PENDING');
    const approved = sumStatus(commissions, 'APPROVED');
    const paid = sumStatus(commissions, 'PAID');
    const wonDeals = wonCount;
    return {
      period: {
        from: bounds.from.toISOString(),
        to: bounds.to.toISOString(),
        year: bounds.year,
        month: bounds.month,
      },
      monthRevenue,
      forecastRevenue,
      targetRevenue,
      targetAttainment:
        targetRevenue <= 0
          ? 0
          : Math.round((monthRevenue / targetRevenue) * 1000) / 10,
      commissionForecast: pending + approved,
      commissionApproved: approved,
      commissionPaid: paid,
      wonDeals,
      avgTicket: wonDeals === 0 ? 0 : Math.round(monthRevenue / wonDeals),
      conversionRate:
        createdCount === 0
          ? 0
          : Math.round((wonDeals / createdCount) * 1000) / 10,
    };
  }

  async getRanking(
    tenantId: string,
    query: PerformanceQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const bounds = periodBounds({
      year: query.year ?? new Date().getUTCFullYear(),
      month: query.month,
      period: query.period ?? 'month',
    });
    const groupBy = query.groupBy ?? 'broker';
    const { dealScope, commissionScope } = await this.scopes(
      tenantId,
      query,
      actor,
    );

    if (groupBy === 'company') {
      const [created, won, commissions] = await Promise.all([
        this.prisma.deal.groupBy({
          by: ['businessUnitId'],
          where: { ...dealScope, createdAt: { gte: bounds.from, lt: bounds.to } },
          _count: { _all: true },
        }),
        this.prisma.deal.groupBy({
          by: ['businessUnitId'],
          where: {
            ...dealScope,
            status: 'won',
            wonAt: { gte: bounds.from, lt: bounds.to },
          },
          _count: { _all: true },
          _sum: { value: true },
        }),
        this.prisma.salesCommission.groupBy({
          by: ['businessUnitId'],
          where: {
            ...commissionScope,
            createdAt: { gte: bounds.from, lt: bounds.to },
          },
          _sum: { commissionValue: true },
        }),
      ]);
      const units = await this.prisma.businessUnit.findMany({
        where: {
          id: {
            in: [...created, ...won]
              .map((row) => row.businessUnitId)
              .filter((id): id is string => Boolean(id)),
          },
        },
        select: { id: true, name: true },
      });
      const names = new Map(units.map((row) => [row.id, row.name]));
      return created.map((row) => {
        const wonRow = won.find(
          (item) => item.businessUnitId === row.businessUnitId,
        );
        const comm = commissions.find(
          (item) => item.businessUnitId === row.businessUnitId,
        );
        const total = row._count._all;
        const wonCount = wonRow?._count._all ?? 0;
        return {
          id: row.businessUnitId,
          name: row.businessUnitId
            ? names.get(row.businessUnitId) ?? 'Sem empresa'
            : 'Sem empresa',
          revenue: Number(wonRow?._sum.value ?? 0),
          wonDeals: wonCount,
          commission: Number(comm?._sum.commissionValue ?? 0),
          conversionRate:
            total === 0 ? 0 : Math.round((wonCount / total) * 1000) / 10,
        };
      });
    }

    const [created, won, commissions] = await Promise.all([
      this.prisma.deal.groupBy({
        by: ['ownerUserId'],
        where: { ...dealScope, createdAt: { gte: bounds.from, lt: bounds.to } },
        _count: { _all: true },
      }),
      this.prisma.deal.groupBy({
        by: ['ownerUserId'],
        where: {
          ...dealScope,
          status: 'won',
          wonAt: { gte: bounds.from, lt: bounds.to },
        },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.salesCommission.groupBy({
        by: ['userId'],
        where: {
          ...commissionScope,
          createdAt: { gte: bounds.from, lt: bounds.to },
        },
        _sum: { commissionValue: true },
      }),
    ]);

    const userIds = [
      ...new Set(
        [...created, ...won, ...commissions]
          .map((row) =>
            'ownerUserId' in row ? row.ownerUserId : row.userId,
          )
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            primaryTeamId: true,
            primaryTeam: { select: { id: true, name: true } },
          },
        })
      : [];
    const userMap = new Map(users.map((row) => [row.id, row]));

    const brokerRows = created.map((row) => {
      const wonRow = won.find((item) => item.ownerUserId === row.ownerUserId);
      const comm = commissions.find((item) => item.userId === row.ownerUserId);
      const total = row._count._all;
      const wonCount = wonRow?._count._all ?? 0;
      const user = row.ownerUserId ? userMap.get(row.ownerUserId) : null;
      return {
        id: row.ownerUserId,
        name: user?.name ?? 'Sem responsável',
        teamId: user?.primaryTeamId ?? null,
        teamName: user?.primaryTeam?.name ?? 'Sem equipe',
        revenue: Number(wonRow?._sum.value ?? 0),
        wonDeals: wonCount,
        commission: Number(comm?._sum.commissionValue ?? 0),
        conversionRate:
          total === 0 ? 0 : Math.round((wonCount / total) * 1000) / 10,
      };
    });

    if (groupBy !== 'team') return brokerRows;

    const teams = new Map<
      string,
      {
        id: string | null;
        name: string;
        revenue: number;
        wonDeals: number;
        commission: number;
        created: number;
      }
    >();
    for (const row of brokerRows) {
      const key = row.teamId ?? 'none';
      const current = teams.get(key) ?? {
        id: row.teamId,
        name: row.teamName,
        revenue: 0,
        wonDeals: 0,
        commission: 0,
        created: 0,
      };
      current.revenue += row.revenue;
      current.wonDeals += row.wonDeals;
      current.commission += row.commission;
      current.created += 1;
      teams.set(key, current);
    }
    return [...teams.values()].map((row) => ({
      id: row.id,
      name: row.name,
      revenue: row.revenue,
      wonDeals: row.wonDeals,
      commission: row.commission,
      conversionRate:
        row.created === 0
          ? 0
          : Math.round((row.wonDeals / Math.max(row.created, 1)) * 1000) / 10,
    }));
  }

  private async scopes(
    tenantId: string,
    query: PerformanceQueryDto,
    actor?: BusinessUnitActor,
  ) {
    let dealScope: Prisma.DealWhereInput = {
      tenantId,
      ...(query.userId ? { ownerUserId: query.userId } : {}),
    };
    let commissionScope: Prisma.SalesCommissionWhereInput = {
      tenantId,
      ...(query.userId ? { userId: query.userId } : {}),
    };
    let targetScope: Prisma.SalesTargetWhereInput = {
      tenantId,
      ...(query.userId ? { userId: query.userId } : {}),
    };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.dealWhere(actor, query.businessUnitId);
      if (extra) {
        dealScope = andWhere(dealScope, extra);
        commissionScope = andWhere(commissionScope, extra);
        targetScope = andWhere(targetScope, extra);
      }
    } else if (query.businessUnitId) {
      dealScope = { ...dealScope, businessUnitId: query.businessUnitId };
      commissionScope = {
        ...commissionScope,
        businessUnitId: query.businessUnitId,
      };
      targetScope = { ...targetScope, businessUnitId: query.businessUnitId };
    }
    return { dealScope, commissionScope, targetScope };
  }
}

function sumStatus(
  rows: Array<{ status: string; _sum: { commissionValue: Prisma.Decimal | null } }>,
  status: string,
) {
  return Number(
    rows.find((row) => row.status === status)?._sum.commissionValue ?? 0,
  );
}
