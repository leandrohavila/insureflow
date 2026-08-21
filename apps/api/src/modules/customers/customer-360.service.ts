import { Injectable, Optional } from '@nestjs/common';

import type { BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { isFollowUpOverdue } from '../../common/utils/commercial-recovery.util';
import {
  canonicalDealStage,
  computeStageSla,
  defaultStagesForUnitType,
} from '../../common/utils/deal-pipeline.util';
import {
  PENDING_RENEWAL_STATUSES,
  slaPendencyTitle,
  type CustomerPendency,
} from '../../common/utils/sales-sla.util';
import {
  aggregateCustomerTimeline,
  mapActivityKindTo360,
  type TimelineEventInput,
} from '../../common/utils/timeline-aggregator.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { CustomersService } from './customers.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';

@Injectable()
export class Customer360Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customers: CustomersService,
    private readonly opportunities: OpportunitiesService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async get360(tenantId: string, customerId: string, actor?: BusinessUnitActor) {
    const customer = await this.customers.findCustomer(tenantId, customerId, actor);

    const leadWhere = {
      tenantId,
      OR: [
        ...(customer.document
          ? [{ document: customer.document as string }]
          : []),
        ...(customer.email ? [{ email: customer.email as string }] : []),
        { deal: { customerId } },
      ],
    };

    const [
      leads,
      deals,
      policies,
      communications,
      followUps,
      renewals,
      crossSell,
      opportunities,
      activities,
      commissions,
    ] = await Promise.all([
      this.prisma.lead.findMany({
        where: leadWhere,
        include: {
          ownerUser: { select: { id: true, name: true } },
          businessUnit: {
            select: { id: true, name: true, slug: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.deal.findMany({
        where: { tenantId, customerId },
        include: {
          businessUnit: {
            select: { id: true, name: true, slug: true, type: true },
          },
          ownerUser: { select: { id: true, name: true } },
          pipeline: {
            select: {
              id: true,
              name: true,
              stages: { select: { slug: true, maxDays: true, label: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.policy.findMany({
        where: { tenantId, customerId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.communicationLog.findMany({
        where: { tenantId, customerId },
        orderBy: { createdAt: 'desc' },
        take: 80,
      }),
      this.prisma.leadFollowUp.findMany({
        where: { tenantId, lead: leadWhere },
        include: { lead: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.policyRenewal.findMany({
        where: { tenantId, customerId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.crossSellOpportunity.findMany({
        where: { tenantId, customerId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.opportunity.findMany({
        where: { tenantId, customerId },
        include: {
          businessUnit: {
            select: { id: true, name: true, slug: true, type: true },
          },
          assignedUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.activity.findMany({
        where: {
          tenantId,
          OR: [
            { customerId },
            { deal: { customerId } },
            { lead: leadWhere },
          ],
        },
        orderBy: { occurredAt: 'desc' },
        take: 80,
      }),
      this.prisma.salesCommission.findMany({
        where: { tenantId, deal: { customerId } },
        include: {
          deal: { select: { id: true, title: true, productType: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const properties = [
      ...deals.filter((deal) => deal.businessUnit?.type === 'REAL_ESTATE'),
      ...opportunities.filter((item) => item.type.startsWith('PROPERTY_')),
    ];

    const timeline = aggregateCustomerTimeline(
      this.buildTimelineInputs({
        customer,
        leads,
        deals,
        communications,
        followUps,
        renewals,
        crossSell,
        opportunities,
        activities,
      }),
    );

    const phones = uniqueStrings([
      customer.phone,
      ...leads.map((lead) => lead.phone),
    ]);
    const emails = uniqueStrings([
      customer.email,
      ...leads.map((lead) => lead.email),
    ]);

    return {
      customer: {
        ...customer,
        phones,
        emails,
      },
      timeline,
      leads: leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        status: lead.status,
        phone: lead.phone,
        email: lead.email,
        owner: lead.ownerUser?.name ?? lead.assignedTo,
        businessUnit: lead.businessUnit,
        createdAt: lead.createdAt.toISOString(),
      })),
      deals: deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        value: Number(deal.value),
        stage: deal.stage,
        status: deal.status,
        businessUnit: deal.businessUnit,
        owner: deal.ownerUser?.name ?? deal.assignedTo,
        sourceType: deal.sourceType,
        score: deal.score,
        pipelineName: deal.pipeline?.name ?? null,
        createdAt: deal.createdAt.toISOString(),
      })),
      policies: policies.map((policy) => ({
        id: policy.id,
        policyNumber: policy.policyNumber,
        insurer: policy.insurer,
        productLine: policy.productLine,
        status: policy.status,
        premiumValue: Number(policy.premiumValue),
        effectiveFrom: policy.effectiveFrom?.toISOString() ?? null,
        effectiveTo: policy.effectiveTo?.toISOString() ?? null,
      })),
      properties: properties.map((item) =>
        'title' in item
          ? {
              id: item.id,
              kind: 'deal' as const,
              title: item.title,
              value: Number(item.value),
              status: item.status,
              businessUnit: item.businessUnit,
            }
          : {
              id: item.id,
              kind: 'opportunity' as const,
              title: item.type,
              value: item.estimatedValue ? Number(item.estimatedValue) : null,
              status: item.status,
              businessUnit: item.businessUnit,
            },
      ),
      communications: communications.map((row) => ({
        id: row.id,
        purpose: row.purpose,
        status: row.status,
        channel: row.channel,
        content: row.content,
        direction: row.direction,
        createdAt: row.createdAt.toISOString(),
      })),
      followUps: followUps.map((row) => ({
        id: row.id,
        type: row.type,
        status: row.status,
        scheduledAt: row.scheduledAt.toISOString(),
        leadName: row.lead.name,
      })),
      renewals: renewals.map((row) => ({
        id: row.id,
        policyNumber: row.policyNumber,
        product: row.product,
        insurer: row.insurer,
        status: row.status,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        renewalDate: row.renewalDate.toISOString(),
        convertedRevenue: row.convertedRevenue
          ? Number(row.convertedRevenue)
          : null,
      })),
      agenda: {
        upcoming: activities
          .filter(
            (row) =>
              row.status === 'pending' ||
              (row.nextFollowUpAt && row.nextFollowUpAt >= new Date()),
          )
          .map((row) => ({
            id: row.id,
            type: row.type,
            status: row.status,
            subject: row.subject,
            at: (row.nextFollowUpAt ?? row.occurredAt).toISOString(),
          })),
        completed: activities
          .filter((row) => row.status === 'completed')
          .map((row) => ({
            id: row.id,
            type: row.type,
            status: row.status,
            subject: row.subject,
            at: row.occurredAt.toISOString(),
          })),
      },
      renewalBook: {
        totalInsured: policies.reduce(
          (sum, policy) => sum + Number(policy.premiumValue),
          0,
        ),
        generatedRevenue: deals
          .filter((deal) => deal.status === 'won')
          .reduce((sum, deal) => sum + Number(deal.value), 0),
        past: renewals.filter(
          (row) =>
            row.status === 'RENEWED' ||
            row.status === 'LOST' ||
            row.endDate < new Date(),
        ).length,
        upcoming: renewals.filter(
          (row) =>
            row.status !== 'RENEWED' &&
            row.status !== 'LOST' &&
            row.endDate >= new Date(),
        ).length,
      },
      crossSell: crossSell.map((row) => ({
        id: row.id,
        originCategory: row.originCategory,
        suggestedCategory: row.suggestedCategory,
        status: row.status,
        convertedRevenue: row.convertedRevenue
          ? Number(row.convertedRevenue)
          : null,
        createdAt: row.createdAt.toISOString(),
      })),
      opportunities: opportunities.map((row) => ({
        id: row.id,
        type: row.type,
        status: row.status,
        score: row.score,
        source: row.source,
        estimatedValue: row.estimatedValue ? Number(row.estimatedValue) : null,
        assignedUser: row.assignedUser,
        businessUnit: row.businessUnit,
        createdAt: row.createdAt.toISOString(),
      })),
      pendencies: buildPendencies({
        deals,
        followUps,
        renewals,
        crossSell,
      }),
      finance: {
        generatedRevenue: deals
          .filter((deal) => deal.status === 'won')
          .reduce((sum, deal) => sum + Number(deal.value), 0),
        closedDeals: deals.filter((deal) => deal.status === 'won').length,
        commissions: commissions.map((row) => ({
          id: row.id,
          dealTitle: row.deal.title,
          value: Number(row.commissionValue),
          percentage: Number(row.commissionPercentage),
          status: row.status,
          createdAt: row.createdAt.toISOString(),
        })),
        products: [
          ...new Set(
            [
              ...deals.map((deal) => deal.productType),
              ...policies.map((policy) => policy.productLine),
            ].filter((value): value is string => Boolean(value)),
          ),
        ],
        history: [
          ...deals
            .filter((deal) => deal.status === 'won')
            .map((deal) => ({
              id: deal.id,
              kind: 'deal' as const,
              title: deal.title,
              amount: Number(deal.value),
              occurredAt: (deal.wonAt ?? deal.createdAt).toISOString(),
            })),
          ...commissions.map((row) => ({
            id: row.id,
            kind: 'commission' as const,
            title: row.deal.title,
            amount: Number(row.commissionValue),
            occurredAt: row.createdAt.toISOString(),
          })),
        ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
      },
    };
  }

  async generate(tenantId: string, customerId: string, actor?: BusinessUnitActor) {
    if (this.buAccess) {
      await this.buAccess.assertCustomerVisible(actor, tenantId, customerId);
    }
    return this.opportunities.generateForCustomer(tenantId, customerId);
  }

  private buildTimelineInputs(params: {
    customer: { createdAt: Date | string; name: string };
    leads: Array<{
      id: string;
      createdAt: Date;
      name: string;
      dealId: string | null;
    }>;
    deals: Array<{
      id: string;
      createdAt: Date;
      title: string;
      stage: string;
      updatedAt: Date;
    }>;
    communications: Array<{
      id: string;
      createdAt: Date;
      direction: string;
      purpose: string;
      content: string;
      repliedAt: Date | null;
    }>;
    followUps: Array<{
      id: string;
      createdAt: Date;
      status: string;
      type: string;
      updatedAt: Date;
    }>;
    renewals: Array<{
      id: string;
      createdAt: Date;
      status: string;
      product: string;
      updatedAt: Date;
    }>;
    crossSell: Array<{
      id: string;
      createdAt: Date;
      status: string;
      suggestedCategory: string;
      updatedAt: Date;
    }>;
    opportunities: Array<{
      id: string;
      createdAt: Date;
      type: string;
      status: string;
      updatedAt: Date;
    }>;
    activities: Array<{
      id: string;
      occurredAt: Date;
      subject: string | null;
      description: string | null;
      operationalEventKind: string | null;
    }>;
  }): TimelineEventInput[] {
    const events: TimelineEventInput[] = [];

    for (const lead of params.leads) {
      events.push({
        id: `lead-created-${lead.id}`,
        kind: 'lead_created',
        occurredAt: lead.createdAt,
        title: `Lead criado — ${lead.name}`,
        source: 'lead',
      });
      if (lead.dealId) {
        events.push({
          id: `lead-converted-${lead.id}`,
          kind: 'lead_converted',
          occurredAt: lead.createdAt,
          title: `Lead convertido — ${lead.name}`,
          source: 'lead',
        });
      }
    }

    for (const deal of params.deals) {
      events.push({
        id: `deal-stage-${deal.id}`,
        kind: 'stage_changed',
        occurredAt: deal.updatedAt,
        title: `Estágio — ${deal.title}`,
        description: deal.stage,
        source: 'deal',
      });
    }

    for (const log of params.communications) {
      events.push({
        id: `comm-${log.id}`,
        kind:
          log.direction === 'INBOUND' || log.repliedAt
            ? 'message_received'
            : 'message_sent',
        occurredAt: log.repliedAt ?? log.createdAt,
        title: log.purpose,
        description: log.content,
        source: 'communication',
      });
    }

    for (const follow of params.followUps) {
      events.push({
        id: `follow-${follow.id}`,
        kind:
          follow.status === 'COMPLETED'
            ? 'follow_up_completed'
            : 'follow_up_created',
        occurredAt:
          follow.status === 'COMPLETED' ? follow.updatedAt : follow.createdAt,
        title: follow.type,
        source: 'follow_up',
      });
    }

    for (const renewal of params.renewals) {
      events.push({
        id: `renewal-${renewal.id}`,
        kind:
          renewal.status === 'RENEWED'
            ? 'renewal_converted'
            : 'renewal_created',
        occurredAt:
          renewal.status === 'RENEWED' ? renewal.updatedAt : renewal.createdAt,
        title: renewal.product,
        source: 'renewal',
      });
    }

    for (const item of params.crossSell) {
      events.push({
        id: `xsell-${item.id}`,
        kind:
          item.status === 'CONVERTED'
            ? 'cross_sell_converted'
            : 'cross_sell_created',
        occurredAt:
          item.status === 'CONVERTED' ? item.updatedAt : item.createdAt,
        title: item.suggestedCategory,
        source: 'cross_sell',
      });
    }

    for (const item of params.opportunities) {
      events.push({
        id: `opp-${item.id}`,
        kind:
          item.status === 'WON'
            ? 'opportunity_converted'
            : 'opportunity_created',
        occurredAt: item.status === 'WON' ? item.updatedAt : item.createdAt,
        title: item.type,
        source: 'opportunity',
      });
    }

    for (const activity of params.activities) {
      const kind = mapActivityKindTo360(activity.operationalEventKind);
      if (!kind) continue;
      events.push({
        id: `act-${activity.id}`,
        kind,
        occurredAt: activity.occurredAt,
        title: activity.subject ?? undefined,
        description: activity.description,
        source: 'activity',
      });
    }

    return events;
  }
}

function buildPendencies(params: {
  deals: Array<{
    id: string;
    title: string;
    status: string;
    stage: string;
    stageEnteredAt: Date;
    businessUnit?: { type: 'INSURANCE' | 'REAL_ESTATE' } | null;
    pipeline?: {
      stages: Array<{ slug: string; maxDays: number | null; label: string }>;
    } | null;
  }>;
  followUps: Array<{
    id: string;
    status: string;
    type: string;
    scheduledAt: Date;
    lead: { name: string };
  }>;
  renewals: Array<{
    id: string;
    status: string;
    product: string;
    policyNumber: string;
  }>;
  crossSell: Array<{
    id: string;
    status: string;
    suggestedCategory: string;
  }>;
}): CustomerPendency[] {
  const now = new Date();
  const items: CustomerPendency[] = [];

  for (const deal of params.deals) {
    if (deal.status !== 'open') continue;
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
    if (sla.status === 'ok') continue;
    items.push({
      id: `deal-${deal.id}`,
      kind: 'sla_overdue',
      title: slaPendencyTitle(sla.status),
      detail: `${deal.title} · ${stageDef?.label ?? slug}`,
    });
  }

  for (const row of params.followUps) {
    if (
      !isFollowUpOverdue({
        status: row.status,
        scheduledAt: row.scheduledAt,
        now,
      })
    ) {
      continue;
    }
    items.push({
      id: `fu-${row.id}`,
      kind: 'follow_up_pending',
      title: 'Follow-up pendente',
      detail: `${row.type} · ${row.lead.name}`,
    });
  }

  for (const row of params.renewals) {
    if (!(PENDING_RENEWAL_STATUSES as readonly string[]).includes(row.status)) {
      continue;
    }
    items.push({
      id: `ren-${row.id}`,
      kind: 'renewal_pending',
      title: 'Renovação pendente',
      detail: `${row.product} · ${row.policyNumber}`,
    });
  }

  for (const row of params.crossSell) {
    if (row.status !== 'PENDING') continue;
    items.push({
      id: `xs-${row.id}`,
      kind: 'cross_sell_pending',
      title: 'Cross-sell pendente',
      detail: row.suggestedCategory,
    });
  }

  return items;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}
