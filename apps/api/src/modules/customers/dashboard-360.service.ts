import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { andWhere, type BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { Dashboard360QueryDto } from '../opportunities/dto/opportunity.dto';

@Injectable()
export class Dashboard360Service {
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

    let customerScope: Prisma.CustomerWhereInput = {
      tenantId,
      ...(query.userId ? { ownerUserId: query.userId } : {}),
    };
    let dealScope: Prisma.DealWhereInput = {
      tenantId,
      ...(query.userId ? { ownerUserId: query.userId } : {}),
    };
    let opportunityScope: Prisma.OpportunityWhereInput = {
      tenantId,
      ...(query.userId ? { assignedUserId: query.userId } : {}),
    };
    let renewalScope: Prisma.PolicyRenewalWhereInput = {
      tenantId,
      ...(query.userId ? { assignedUserId: query.userId } : {}),
    };
    let crossSellScope: Prisma.CrossSellOpportunityWhereInput = { tenantId };

    if (actor && this.buAccess) {
      const [customerWhere, dealWhere, opportunityWhere, renewalWhere, crossWhere] =
        await Promise.all([
          this.buAccess.customerWhere(actor, query.businessUnitId),
          this.buAccess.dealWhere(actor, query.businessUnitId),
          this.buAccess.opportunityWhere(actor, query.businessUnitId),
          this.buAccess.renewalWhere(actor, query.businessUnitId),
          this.buAccess.crossSellWhere(actor),
        ]);
      if (customerWhere) customerScope = andWhere(customerScope, customerWhere);
      if (dealWhere) dealScope = andWhere(dealScope, dealWhere);
      if (opportunityWhere) {
        opportunityScope = andWhere(opportunityScope, opportunityWhere);
      }
      if (renewalWhere) renewalScope = andWhere(renewalScope, renewalWhere);
      if (crossWhere) crossSellScope = andWhere(crossSellScope, crossWhere);
    } else if (query.businessUnitId) {
      customerScope = { ...customerScope, businessUnitId: query.businessUnitId };
      dealScope = { ...dealScope, businessUnitId: query.businessUnitId };
      opportunityScope = {
        ...opportunityScope,
        businessUnitId: query.businessUnitId,
      };
      renewalScope = { ...renewalScope, businessUnitId: query.businessUnitId };
    }

    const [
      activeCustomers,
      inactiveCustomers,
      reactivatedLeads,
      predicted,
      renewalRevenue,
      crossSellRevenue,
      opportunityWonRevenue,
      openOpportunities,
      wonOpportunities,
      totalOpportunities,
      brokers,
    ] = await Promise.all([
      this.prisma.customer.count({
        where: { ...customerScope, status: 'active' },
      }),
      this.prisma.customer.count({
        where: { ...customerScope, status: 'inactive' },
      }),
      this.prisma.lead.count({
        where: {
          tenantId,
          lastReactivatedAt: { gte: from, lte: to },
          OR: [
            { deal: { customer: customerScope } },
            { document: { not: null } },
          ],
        },
      }),
      this.prisma.deal.aggregate({
        where: { ...dealScope, status: 'open' },
        _sum: { value: true },
      }),
      this.prisma.policyRenewal.aggregate({
        where: {
          ...renewalScope,
          status: 'RENEWED',
          updatedAt: { gte: from, lte: to },
        },
        _sum: { convertedRevenue: true },
      }),
      this.prisma.crossSellOpportunity.aggregate({
        where: {
          ...crossSellScope,
          status: 'CONVERTED',
          updatedAt: { gte: from, lte: to },
        },
        _sum: { convertedRevenue: true },
      }),
      this.prisma.opportunity.aggregate({
        where: {
          ...opportunityScope,
          status: 'WON',
          updatedAt: { gte: from, lte: to },
        },
        _sum: { estimatedValue: true },
      }),
      this.prisma.opportunity.count({
        where: { ...opportunityScope, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.opportunity.count({
        where: {
          ...opportunityScope,
          status: 'WON',
          updatedAt: { gte: from, lte: to },
        },
      }),
      this.prisma.opportunity.count({
        where: {
          ...opportunityScope,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.user.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
        take: 200,
      }),
    ]);

    const conversionRate =
      totalOpportunities === 0
        ? 0
        : Math.round((wonOpportunities / totalOpportunities) * 1000) / 10;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      activeCustomers,
      inactiveCustomers,
      reactivatedCustomers: reactivatedLeads,
      predictedRevenue: Number(predicted._sum.value ?? 0),
      renewalRevenue: Number(renewalRevenue._sum.convertedRevenue ?? 0),
      crossSellRevenue:
        Number(crossSellRevenue._sum.convertedRevenue ?? 0) +
        Number(opportunityWonRevenue._sum.estimatedValue ?? 0),
      openOpportunities,
      conversionRate,
      brokers,
    };
  }
}
