import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import {
  canonicalDealStage,
  computeStageSla,
  CRM_PIPELINE_STAGE_LABELS,
  defaultStagesForUnitType,
} from '../../common/utils/deal-pipeline.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type { Dashboard360QueryDto } from '../opportunities/dto/opportunity.dto';

@Injectable()
export class SlaDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async getDashboard(
    tenantId: string,
    query: Dashboard360QueryDto,
    actor?: BusinessUnitActor,
  ) {
    let dealScope: Prisma.DealWhereInput = {
      tenantId,
      status: 'open',
      ...(query.userId ? { ownerUserId: query.userId } : {}),
    };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.dealWhere(actor, query.businessUnitId);
      if (extra) dealScope = andWhere(dealScope, extra);
    } else if (query.businessUnitId) {
      dealScope = { ...dealScope, businessUnitId: query.businessUnitId };
    }

    const deals = await this.prisma.deal.findMany({
      where: dealScope,
      select: {
        id: true,
        stage: true,
        stageEnteredAt: true,
        ownerUserId: true,
        businessUnitId: true,
        ownerUser: { select: { id: true, name: true } },
        businessUnit: { select: { id: true, name: true, type: true } },
        pipeline: {
          select: {
            stages: { select: { slug: true, maxDays: true } },
          },
        },
      },
      take: 2000,
    });

    const now = query.to ? new Date(query.to) : new Date();
    let inSla = 0;
    let warning = 0;
    let overdue = 0;
    const stageHours = new Map<string, { total: number; count: number }>();
    const byBroker = new Map<
      string,
      { name: string; warning: number; overdue: number; total: number }
    >();
    const byCompany = new Map<
      string,
      { name: string; warning: number; overdue: number; total: number }
    >();

    for (const deal of deals) {
      const unitType = deal.businessUnit?.type ?? 'INSURANCE';
      const stages =
        deal.pipeline?.stages?.length
          ? deal.pipeline.stages
          : defaultStagesForUnitType(unitType);
      const slug = canonicalDealStage(deal.stage, unitType);
      const stageDef = stages.find((stage) => stage.slug === slug);
      const sla = computeStageSla({
        enteredAt: deal.stageEnteredAt,
        maxDays: stageDef?.maxDays,
        now,
      });
      if (sla.status === 'overdue') overdue += 1;
      else if (sla.status === 'warning') warning += 1;
      else inSla += 1;

      const bucket = stageHours.get(slug) ?? { total: 0, count: 0 };
      bucket.total += sla.elapsedHours;
      bucket.count += 1;
      stageHours.set(slug, bucket);

      const brokerKey = deal.ownerUserId ?? 'none';
      const broker = byBroker.get(brokerKey) ?? {
        name: deal.ownerUser?.name ?? 'Sem responsável',
        warning: 0,
        overdue: 0,
        total: 0,
      };
      broker.total += 1;
      if (sla.status === 'warning') broker.warning += 1;
      if (sla.status === 'overdue') broker.overdue += 1;
      byBroker.set(brokerKey, broker);

      const unitKey = deal.businessUnitId ?? 'none';
      const company = byCompany.get(unitKey) ?? {
        name: deal.businessUnit?.name ?? 'Sem empresa',
        warning: 0,
        overdue: 0,
        total: 0,
      };
      company.total += 1;
      if (sla.status === 'warning') company.warning += 1;
      if (sla.status === 'overdue') company.overdue += 1;
      byCompany.set(unitKey, company);
    }

    return {
      inSla,
      warning,
      overdue,
      openDeals: deals.length,
      avgHoursByStage: [...stageHours.entries()].map(([stage, row]) => ({
        stage,
        label: CRM_PIPELINE_STAGE_LABELS[stage] ?? stage,
        avgHours:
          row.count === 0 ? 0 : Math.round((row.total / row.count) * 10) / 10,
      })),
      byBroker: [...byBroker.entries()]
        .map(([userId, row]) => ({
          userId: userId === 'none' ? null : userId,
          ...row,
        }))
        .sort((a, b) => b.overdue - a.overdue || b.warning - a.warning),
      byCompany: [...byCompany.entries()]
        .map(([businessUnitId, row]) => ({
          businessUnitId: businessUnitId === 'none' ? null : businessUnitId,
          ...row,
        }))
        .sort((a, b) => b.overdue - a.overdue || b.warning - a.warning),
    };
  }
}
