import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { canonicalDealStage } from '../../common/utils/deal-pipeline.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type { Dashboard360QueryDto } from '../opportunities/dto/opportunity.dto';

@Injectable()
export class ExecutiveDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async getDashboard(
    tenantId: string,
    query: Dashboard360QueryDto,
    actor?: BusinessUnitActor,
  ) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 30 * 86_400_000);

    let leadScope: Prisma.LeadWhereInput = { tenantId };
    let dealScope: Prisma.DealWhereInput = {
      tenantId,
      ...(query.userId ? { ownerUserId: query.userId } : {}),
    };
    let opportunityScope: Prisma.OpportunityWhereInput = {
      tenantId,
      ...(query.userId ? { assignedUserId: query.userId } : {}),
    };
    let renewalScope: Prisma.PolicyRenewalWhereInput = { tenantId };
    let crossSellScope: Prisma.CrossSellOpportunityWhereInput = { tenantId };

    if (actor && this.buAccess) {
      const [leadWhere, dealWhere, opportunityWhere, renewalWhere, crossWhere] =
        await Promise.all([
          this.buAccess.leadWhere(actor, query.businessUnitId),
          this.buAccess.dealWhere(actor, query.businessUnitId),
          this.buAccess.opportunityWhere(actor, query.businessUnitId),
          this.buAccess.renewalWhere(actor, query.businessUnitId),
          this.buAccess.crossSellWhere(actor),
        ]);
      if (leadWhere) leadScope = andWhere(leadScope, leadWhere);
      if (dealWhere) dealScope = andWhere(dealScope, dealWhere);
      if (opportunityWhere) {
        opportunityScope = andWhere(opportunityScope, opportunityWhere);
      }
      if (renewalWhere) renewalScope = andWhere(renewalScope, renewalWhere);
      if (crossWhere) crossSellScope = andWhere(crossSellScope, crossWhere);
    } else if (query.businessUnitId) {
      leadScope = { ...leadScope, businessUnitId: query.businessUnitId };
      dealScope = { ...dealScope, businessUnitId: query.businessUnitId };
      opportunityScope = {
        ...opportunityScope,
        businessUnitId: query.businessUnitId,
      };
    }

    const [
      leads,
      openOpportunities,
      openDeals,
      wonDeals,
      createdDeals,
      revenue,
      renewals,
      crossSell,
      wonWithDates,
      dealsForFunnel,
      byOwner,
      byUnit,
    ] = await Promise.all([
      this.prisma.lead.count({
        where: { ...leadScope, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.opportunity.count({
        where: { ...opportunityScope, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.deal.count({
        where: { ...dealScope, status: 'open' },
      }),
      this.prisma.deal.count({
        where: {
          ...dealScope,
          status: 'won',
          wonAt: { gte: from, lte: to },
        },
      }),
      this.prisma.deal.count({
        where: { ...dealScope, createdAt: { gte: from, lte: to } },
      }),
      this.prisma.deal.aggregate({
        where: {
          ...dealScope,
          status: 'won',
          wonAt: { gte: from, lte: to },
        },
        _sum: { value: true },
      }),
      this.prisma.policyRenewal.count({
        where: {
          ...renewalScope,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.crossSellOpportunity.count({
        where: {
          ...crossSellScope,
          status: 'CONVERTED',
          updatedAt: { gte: from, lte: to },
        },
      }),
      this.prisma.deal.findMany({
        where: {
          ...dealScope,
          status: 'won',
          wonAt: { gte: from, lte: to },
        },
        select: { createdAt: true, wonAt: true },
        take: 500,
      }),
      this.prisma.deal.findMany({
        where: { ...dealScope, status: 'open' },
        select: {
          stage: true,
          businessUnit: { select: { type: true } },
        },
        take: 1000,
      }),
      this.prisma.deal.groupBy({
        by: ['ownerUserId'],
        where: { ...dealScope, createdAt: { gte: from, lte: to } },
        _count: { _all: true },
      }),
      this.prisma.deal.groupBy({
        by: ['businessUnitId'],
        where: { ...dealScope, createdAt: { gte: from, lte: to } },
        _count: { _all: true },
      }),
    ]);

    const wonByOwner = await this.prisma.deal.groupBy({
      by: ['ownerUserId'],
      where: {
        ...dealScope,
        status: 'won',
        wonAt: { gte: from, lte: to },
      },
      _count: { _all: true },
      _sum: { value: true },
    });
    const wonByUnit = await this.prisma.deal.groupBy({
      by: ['businessUnitId'],
      where: {
        ...dealScope,
        status: 'won',
        wonAt: { gte: from, lte: to },
      },
      _count: { _all: true },
      _sum: { value: true },
    });

    const ownerIds = [
      ...new Set(
        [...byOwner, ...wonByOwner]
          .map((row) => row.ownerUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const unitIds = [
      ...new Set(
        [...byUnit, ...wonByUnit]
          .map((row) => row.businessUnitId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const [owners, units] = await Promise.all([
      ownerIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: { id: true, name: true },
          })
        : [],
      unitIds.length
        ? this.prisma.businessUnit.findMany({
            where: { id: { in: unitIds } },
            select: { id: true, name: true, type: true },
          })
        : [],
    ]);
    const ownerName = new Map(owners.map((row) => [row.id, row.name]));
    const unitName = new Map(units.map((row) => [row.id, row.name]));

    const closeDurations = wonWithDates
      .filter((row) => row.wonAt)
      .map(
        (row) =>
          (row.wonAt!.getTime() - row.createdAt.getTime()) / 86_400_000,
      );
    const avgCloseDays =
      closeDurations.length === 0
        ? 0
        : Math.round(
            (closeDurations.reduce((sum, days) => sum + days, 0) /
              closeDurations.length) *
              10,
          ) / 10;

    const funnelMap = new Map<string, number>();
    for (const deal of dealsForFunnel) {
      const stage = canonicalDealStage(
        deal.stage,
        deal.businessUnit?.type ?? 'INSURANCE',
      );
      funnelMap.set(stage, (funnelMap.get(stage) ?? 0) + 1);
    }

    const conversionRate =
      createdDeals === 0
        ? 0
        : Math.round((wonDeals / createdDeals) * 1000) / 10;

    const byBroker = byOwner.map((row) => {
      const won = wonByOwner.find(
        (item) => item.ownerUserId === row.ownerUserId,
      );
      const total = row._count._all;
      return {
        userId: row.ownerUserId,
        name: row.ownerUserId
          ? ownerName.get(row.ownerUserId) ?? 'Sem responsável'
          : 'Sem responsável',
        total,
        won: won?._count._all ?? 0,
        revenue: Number(won?._sum.value ?? 0),
        conversionRate:
          total === 0
            ? 0
            : Math.round(((won?._count._all ?? 0) / total) * 1000) / 10,
      };
    });
    const byCompany = byUnit.map((row) => {
      const won = wonByUnit.find(
        (item) => item.businessUnitId === row.businessUnitId,
      );
      const total = row._count._all;
      return {
        businessUnitId: row.businessUnitId,
        name: row.businessUnitId
          ? unitName.get(row.businessUnitId) ?? 'Sem empresa'
          : 'Sem empresa',
        total,
        won: won?._count._all ?? 0,
        revenue: Number(won?._sum.value ?? 0),
        conversionRate:
          total === 0
            ? 0
            : Math.round(((won?._count._all ?? 0) / total) * 1000) / 10,
      };
    });

    const extras = await loadExecutiveExtras(
      this.prisma,
      tenantId,
      dealScope,
      from,
      to,
      units,
      byBroker,
    );

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      leads,
      opportunities: openOpportunities,
      deals: openDeals,
      conversionRate,
      revenue: Number(revenue._sum.value ?? 0),
      renewals,
      crossSell,
      avgCloseDays,
      byBroker,
      byCompany,
      funnel: [...funnelMap.entries()].map(([stage, count]) => ({
        stage,
        count,
      })),
      ...extras,
    };
  }
}

async function loadExecutiveExtras(
  prisma: PrismaService,
  tenantId: string,
  dealScope: Prisma.DealWhereInput,
  from: Date,
  to: Date,
  units: Array<{ id: string; type: string }>,
  byBroker: Array<{
    userId: string | null;
    name: string;
    revenue: number;
    won: number;
  }>,
) {
  const unitType = new Map(units.map((row) => [row.id, row.type]));
  const [targetAgg, pendingComm, paidComm, wonDetails] = await Promise.all([
    prisma.salesTarget.aggregate({
      where: { tenantId },
      _sum: { targetRevenue: true },
    }),
    prisma.salesCommission.aggregate({
      where: {
        tenantId,
        status: { in: ['PENDING', 'APPROVED'] },
        createdAt: { gte: from, lte: to },
      },
      _sum: { commissionValue: true },
    }),
    prisma.salesCommission.aggregate({
      where: {
        tenantId,
        status: 'PAID',
        createdAt: { gte: from, lte: to },
      },
      _sum: { commissionValue: true },
    }),
    prisma.deal.findMany({
      where: {
        ...dealScope,
        status: 'won',
        wonAt: { gte: from, lte: to },
      },
      select: {
        value: true,
        productType: true,
        sourceType: true,
        businessUnitId: true,
      },
      take: 500,
    }),
  ]);

  let insurance = 0;
  let realEstate = 0;
  const products = new Map<string, number>();
  const sources = new Map<string, number>();
  for (const deal of wonDetails) {
    const amount = Number(deal.value);
    const type = deal.businessUnitId
      ? unitType.get(deal.businessUnitId)
      : undefined;
    if (type === 'REAL_ESTATE') realEstate += amount;
    else insurance += amount;
    const product = deal.productType ?? 'N/A';
    products.set(product, (products.get(product) ?? 0) + amount);
    const source = deal.sourceType ?? 'MANUAL';
    sources.set(source, (sources.get(source) ?? 0) + 1);
  }

  return {
    revenueInsurance: insurance,
    revenueRealEstate: realEstate,
    consolidatedRevenue: insurance + realEstate,
    consolidatedTarget: Number(targetAgg._sum.targetRevenue ?? 0),
    commissionsForecast: Number(pendingComm._sum.commissionValue ?? 0),
    commissionsPaid: Number(paidComm._sum.commissionValue ?? 0),
    topBrokers: [...byBroker]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((row) => ({
        userId: row.userId,
        name: row.name,
        revenue: row.revenue,
        won: row.won,
      })),
    topProducts: [...products.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productType, revenue]) => ({ productType, revenue })),
    topLeadSources: [...sources.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sourceType, count]) => ({ sourceType, count })),
  };
}
