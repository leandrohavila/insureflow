import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { addUtcDays, startOfUtcDay } from '../../common/utils/lead-reactivation.util';
import { subtractUtcDays } from '../../common/utils/commercial-recovery.util';
import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { LeadFollowUpsService } from '../lead-follow-ups/lead-follow-ups.service';
import { LeadReactivationService } from '../lead-reactivation/lead-reactivation.service';
import { PolicyRenewalsService } from '../policy-renewals/policy-renewals.service';
import type { CommercialDashboardQueryDto } from './dto/commercial-dashboard.dto';
import { SalesSlaEngine } from './sales-sla-engine.service';

@Injectable()
export class CommercialAutomationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reactivation: LeadReactivationService,
    private readonly followUps: LeadFollowUpsService,
    private readonly renewals: PolicyRenewalsService,
    private readonly sla: SalesSlaEngine,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async runDailyJob(now = new Date()) {
    const reactivation = await this.reactivation.runDailyJob();
    const followUps = await this.followUps.processDailyAutomation(now);
    const renewals = await this.renewals.processDailyAutomation(now);
    const sla = await this.sla.processDaily(now);
    return { reactivation, followUps, renewals, sla };
  }

  async runTenant(tenantId: string, now = new Date()) {
    const reactivation = await this.reactivation.processTenant(tenantId);
    const followUps = await this.followUps.processDailyAutomation(now, tenantId);
    const renewals = await this.renewals.processDailyAutomation(now, tenantId);
    const sla = await this.sla.processTenant(tenantId, now);
    return { reactivation, followUps, renewals, sla };
  }

  async getDashboard(
    tenantId: string,
    query: CommercialDashboardQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : subtractUtcDays(to, 30);
    const startToday = startOfUtcDay(to);
    const upcomingRenewalUntil = addUtcDays(startToday, 60);

    let leadScope: Prisma.LeadWhereInput = {
      tenantId,
      ...(query.userId ? { ownerUserId: query.userId } : {}),
      ...(query.teamId ? { ownerTeamId: query.teamId } : {}),
    };

    let followUpScope: Prisma.LeadFollowUpWhereInput = {
      tenantId,
      ...(query.userId ? { assignedUserId: query.userId } : {}),
    };

    let renewalScope: Prisma.PolicyRenewalWhereInput = {
      tenantId,
      ...(query.userId ? { assignedUserId: query.userId } : {}),
    };

    let dealScope: Prisma.DealWhereInput = {
      tenantId,
      ...(query.userId ? { ownerUserId: query.userId } : {}),
    };

    if (actor && this.buAccess) {
      const [leadWhere, followWhere, renewalWhere, dealWhere] = await Promise.all([
        this.buAccess.leadWhere(actor, query.businessUnitId),
        this.buAccess.followUpWhere(actor, query.businessUnitId),
        this.buAccess.renewalWhere(actor, query.businessUnitId),
        this.buAccess.dealWhere(actor, query.businessUnitId),
      ]);
      if (leadWhere) leadScope = andWhere(leadScope, leadWhere);
      if (followWhere) followUpScope = andWhere(followUpScope, followWhere);
      if (renewalWhere) renewalScope = andWhere(renewalScope, renewalWhere);
      if (dealWhere) dealScope = andWhere(dealScope, dealWhere);
    } else if (query.businessUnitId) {
      leadScope = { ...leadScope, businessUnitId: query.businessUnitId };
      followUpScope = { ...followUpScope, businessUnitId: query.businessUnitId };
      renewalScope = { ...renewalScope, businessUnitId: query.businessUnitId };
      dealScope = { ...dealScope, businessUnitId: query.businessUnitId };
    }

    const [
      lostLeads,
      reactivatedDistinct,
      returnedLeads,
      pendingFollowUps,
      overdueFollowUps,
      upcomingRenewals,
      convertedRenewals,
      recoveredFromReactivation,
      recoveredFromRenewals,
    ] = await Promise.all([
      this.prisma.lead.count({
        where: {
          ...leadScope,
          status: 'lost',
          lostAt: { gte: from, lte: to },
        },
      }),
      this.prisma.leadReactivationLog.findMany({
        where: {
          tenantId,
          status: 'sent',
          sentAt: { gte: from, lte: to },
          lead: leadScope,
        },
        distinct: ['leadId'],
        select: { leadId: true },
      }),
      this.prisma.lead.count({
        where: {
          ...leadScope,
          lastReactivatedAt: { gte: from, lte: to },
          status: { not: 'lost' },
        },
      }),
      this.prisma.leadFollowUp.count({
        where: { ...followUpScope, status: 'PENDING' },
      }),
      this.prisma.leadFollowUp.count({
        where: {
          ...followUpScope,
          status: 'PENDING',
          scheduledAt: { lt: startToday },
        },
      }),
      this.prisma.policyRenewal.count({
        where: {
          ...renewalScope,
          status: { in: ['ACTIVE', 'RENEWAL_PENDING', 'RENEWAL_IN_PROGRESS'] },
          renewalDate: { gte: startToday, lte: upcomingRenewalUntil },
        },
      }),
      this.prisma.policyRenewal.count({
        where: {
          ...renewalScope,
          status: 'RENEWED',
          updatedAt: { gte: from, lte: to },
        },
      }),
      this.prisma.deal.aggregate({
        where: {
          ...dealScope,
          status: 'won',
          convertedLead: {
            lastReactivatedAt: { gte: from, lte: to },
          },
        },
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
    ]);

    const reactivatedLeads = reactivatedDistinct.length;
    const recoveredRevenue =
      Number(recoveredFromReactivation._sum.value ?? 0) +
      Number(recoveredFromRenewals._sum.convertedRevenue ?? 0);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      lostLeads,
      reactivatedLeads,
      returnedLeads,
      recoveryRate:
        reactivatedLeads === 0
          ? 0
          : Math.round((returnedLeads / reactivatedLeads) * 1000) / 10,
      pendingFollowUps,
      overdueFollowUps,
      upcomingRenewals,
      convertedRenewals,
      recoveredRevenue,
    };
  }
}
