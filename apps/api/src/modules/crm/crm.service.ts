import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  resolveAssignedToLabelForUserId,
  resolveResponsibleLabel,
} from '../../common/utils/owner-assignment.util';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { OwnershipService } from '../access/ownership.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { andWhere } from '../../common/utils/business-unit-acl.util';
import type { LeadAccessActor } from '../access/ownership.types';
import { CustomerActivationService } from '../customers/customer-activation.service';
import { deriveQuestionnaireCommercialStatus } from '../../common/utils/questionnaire-commercial.util';
import {
  crmStageLabel,
  crmStatusLabel,
} from '../../common/utils/crm-stage-labels.util';
import { nextPipelineOrder } from '../../common/utils/pipeline-order.util';
import { logDealContract } from '../../common/utils/deal-contract-debug';
import { computeDealScore, resolveDealSourceType } from '../../common/utils/deal-score.util';
import { computeStageSla } from '../../common/utils/deal-pipeline.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { serializeQuoteComparisonSummary } from '../quotes/quote-serialize.util';
import { PipelinesService } from './pipelines.service';
import { CommissionsService } from '../sales-performance/commissions.service';
import type {
  CreateDealDto,
  ListDealsQueryDto,
  UpdateDealDto,
} from './dto/deal.dto';

const dealLeadSelect = {
  id: true,
  name: true,
  assignedTo: true,
  status: true,
  phone: true,
  email: true,
  lastContactAt: true,
  updatedAt: true,
  ownerUserId: true,
  ownerUser: {
    select: { id: true, name: true, email: true, initials: true },
  },
} satisfies Prisma.LeadSelect;

const dealOwnerUserSelect = {
  id: true,
  name: true,
  email: true,
  initials: true,
} satisfies Prisma.UserSelect;

const dealInclude = {
  ownerUser: { select: dealOwnerUserSelect },
  convertedLead: { select: dealLeadSelect },
  businessUnit: {
    select: { id: true, name: true, slug: true, type: true, isActive: true },
  },
  pipeline: {
    select: {
      id: true,
      name: true,
      stages: {
        orderBy: { sortOrder: 'asc' },
        select: {
          slug: true,
          label: true,
          maxDays: true,
          alertTarget: true,
          color: true,
          sortOrder: true,
        },
      },
    },
  },
} satisfies Prisma.DealInclude;

type DealWithRelations = Prisma.DealGetPayload<{ include: typeof dealInclude }>;

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: ActivitiesService,
    private readonly activityEngine: ActivityEngineService,
    private readonly customerActivation: CustomerActivationService,
    private readonly ownership: OwnershipService,
    private readonly pipelines: PipelinesService,
    @Optional() private readonly commissions?: CommissionsService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async findDeals(
    tenantId: string,
    query: ListDealsQueryDto = {},
    actor?: LeadAccessActor,
  ) {
    const where = await this.buildDealWhere(tenantId, actor);
    const paginate = query.page !== undefined || query.limit !== undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const deals = await this.prisma.deal.findMany({
      where,
      include: dealInclude,
      orderBy: [{ pipelineOrder: 'asc' }, { createdAt: 'asc' }],
      ...(paginate ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    const enriched = await this.enrichDealsWithCommercialContext(
      tenantId,
      deals,
    );

    if (!paginate) {
      return enriched;
    }

    const total = await this.prisma.deal.count({ where });
    return {
      data: enriched,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findDeal(tenantId: string, id: string, actor?: LeadAccessActor) {
    await this.assertDealAccess(tenantId, id, actor);

    const deal = await this.prisma.deal.findFirst({
      where: { id, tenantId },
      include: dealInclude,
    });
    if (!deal) {
      throw new NotFoundException('Negócio não encontrado');
    }

    const [enriched] = await this.enrichDealsWithCommercialContext(tenantId, [
      deal,
    ]);
    return enriched;
  }

  async createDeal(
    tenantId: string,
    dto: CreateDealDto,
    actor?: LeadAccessActor,
  ) {
    logDealContract('service.create', {
      pipelineOrder: dto.pipelineOrder,
      stage: dto.stage,
    });
    const pipelineOrder =
      dto.pipelineOrder ??
      (await this.resolveNextPipelineOrder(tenantId, dto.stage));

    const ownerUserId = actor?.userId ?? null;
    let assignedTo = dto.assignedTo;
    if (ownerUserId && !assignedTo) {
      assignedTo =
        (await resolveAssignedToLabelForUserId(
          this.prisma,
          tenantId,
          ownerUserId,
        )) ?? undefined;
    }

    const sourceType = resolveDealSourceType({ sourceType: dto.sourceType });
    const pipeline = await this.pipelines.resolveForDeal(
      tenantId,
      dto.businessUnitId,
    );
    const now = new Date();
    const deal = await this.prisma.deal.create({
      data: {
        tenantId,
        title: dto.title,
        company: dto.company,
        value: new Prisma.Decimal(dto.value),
        stage: dto.stage,
        status: dto.status,
        assignedTo,
        ownerUserId,
        pipelineOrder,
        businessUnitId: dto.businessUnitId ?? null,
        pipelineId: pipeline?.id ?? null,
        sourceType,
        sourceId: dto.sourceId ?? null,
        productType: dto.productType ?? null,
        score: computeDealScore(sourceType),
        stageEnteredAt: now,
      },
    });
    await this.recordStageHistory({
      tenantId,
      dealId: deal.id,
      fromStage: null,
      toStage: dto.stage,
      pipelineId: pipeline?.id ?? null,
      enteredAt: now,
      performedById: ownerUserId,
    });
    if (ownerUserId) {
      await this.activityEngine.publish({
        tenantId,
        performedById: ownerUserId,
        operationalEventKind: 'deal_created',
        subject: `Negócio criado — ${deal.title}`,
        occurredAt: now,
        dealId: deal.id,
      });
    }

    return { ...deal, value: deal.value.toNumber() };
  }
  async updateDeal(
    tenantId: string,
    id: string,
    dto: UpdateDealDto,
    performedById?: string,
  ) {
    logDealContract('service.update', {
      id,
      pipelineOrder: dto.pipelineOrder,
      stage: dto.stage,
    });
    await this.ensureDealBelongsToTenant(tenantId, id);

    const previous = await this.prisma.deal.findFirst({
      where: { id, tenantId },
      select: {
        status: true,
        stage: true,
        title: true,
        stageEnteredAt: true,
        pipelineId: true,
      },
    });

    const deal = await this.prisma.deal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.company !== undefined ? { company: dto.company } : {}),
        ...(dto.value !== undefined
          ? { value: new Prisma.Decimal(dto.value) }
          : {}),
        ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo } : {}),
        ...(dto.pipelineOrder !== undefined
          ? { pipelineOrder: dto.pipelineOrder }
          : {}),
        ...(dto.businessUnitId !== undefined
          ? { businessUnitId: dto.businessUnitId || null }
          : {}),
        ...(dto.productType !== undefined ? { productType: dto.productType } : {}),
        ...(dto.stage !== undefined &&
        previous?.stage &&
        dto.stage !== previous.stage
          ? { stageEnteredAt: new Date() }
          : {}),
      },
      include: {
        convertedLead: { select: { id: true } },
      },
    });

    if (deal.convertedLead?.id) {
      await this.prisma.lead.updateMany({
        where: { id: deal.convertedLead.id, tenantId },
        data: { lastContactAt: new Date() },
      });
    }

    if (performedById) {
      const now = new Date();
      const leadId = deal.convertedLead?.id ?? null;

      if (
        dto.stage !== undefined &&
        previous?.stage &&
        dto.stage !== previous.stage
      ) {
        await this.recordStageHistory({
          tenantId,
          dealId: id,
          fromStage: previous.stage,
          toStage: dto.stage,
          pipelineId: previous.pipelineId,
          enteredAt: now,
          performedById,
          previousEnteredAt: previous.stageEnteredAt,
        });
        await this.activityEngine.publish({
          tenantId,
          performedById,
          operationalEventKind: 'deal_stage_changed',
          subject: `Estágio alterado — ${deal.title}`,
          description: `${crmStageLabel(previous.stage)} → ${crmStageLabel(dto.stage)}`,
          occurredAt: now,
          dealId: id,
          leadId,
        });
      }

      if (
        dto.status !== undefined &&
        previous?.status &&
        dto.status !== previous.status &&
        dto.status !== 'won'
      ) {
        const kind =
          dto.status === 'lost'
            ? 'deal_lost'
            : previous.status !== 'open' && dto.status === 'open'
              ? 'deal_reopened'
              : 'deal_status_changed';
        await this.activityEngine.publish({
          tenantId,
          performedById,
          operationalEventKind: kind,
          subject:
            kind === 'deal_lost'
              ? `Negócio perdido — ${deal.title}`
              : kind === 'deal_reopened'
                ? `Negócio reaberto — ${deal.title}`
                : `Status alterado — ${deal.title}`,
          description: `${crmStatusLabel(previous.status)} → ${crmStatusLabel(dto.status)}`,
          occurredAt: now,
          dealId: id,
          leadId,
        });
      }
    }

    if (dto.status === 'won' && previous?.status !== 'won' && performedById) {
      await this.customerActivation.activateFromWonDeal(
        tenantId,
        id,
        performedById,
      );
      await this.commissions?.onDealWon(tenantId, id, performedById);
    }

    const refreshed = await this.prisma.deal.findFirst({
      where: { id, tenantId },
      select: { customerId: true, wonAt: true },
    });

    const { convertedLead, ...rest } = deal;
    void convertedLead;
    return {
      ...rest,
      value: deal.value.toNumber(),
      customerId: refreshed?.customerId ?? null,
      wonAt: refreshed?.wonAt?.toISOString() ?? null,
    };
  }

  async deleteDeal(tenantId: string, id: string) {
    await this.ensureDealBelongsToTenant(tenantId, id);
    await this.prisma.deal.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async enrichDealsWithCommercialContext(
    tenantId: string,
    deals: DealWithRelations[],
  ) {
    const leadIds = deals
      .map((deal) => deal.convertedLead?.id)
      .filter((id): id is string => Boolean(id));

    const submissionsByDealId = new Map<
      string,
      Array<{
        id: string;
        status: string;
        updatedAt: Date;
        submittedAt: Date | null;
      }>
    >();

    const dealIds = deals.map((deal) => deal.id);
    const leadIdToDealId = new Map<string, string>();
    for (const deal of deals) {
      if (deal.convertedLead?.id) {
        leadIdToDealId.set(deal.convertedLead.id, deal.id);
      }
    }

    const [activityByDealId, activityByLeadId, quoteComparisons] =
      await Promise.all([
        this.activities.maxOccurredAtByDealIds(tenantId, dealIds),
        this.activities.maxOccurredAtByLeadIds(tenantId, leadIds),
        leadIds.length > 0 || dealIds.length > 0
          ? this.prisma.quoteComparison.findMany({
              where: {
                tenantId,
                OR: [
                  ...(dealIds.length > 0 ? [{ dealId: { in: dealIds } }] : []),
                  ...(leadIds.length > 0 ? [{ leadId: { in: leadIds } }] : []),
                ],
              },
              select: {
                id: true,
                workflowStatus: true,
                title: true,
                selectedQuoteId: true,
                updatedAt: true,
                leadId: true,
                dealId: true,
                quotes: { select: { id: true } },
              },
              orderBy: { updatedAt: 'desc' },
            })
          : Promise.resolve([]),
      ]);

    if (leadIds.length > 0 || dealIds.length > 0) {
      const submissionOr: Prisma.QuestionnaireSubmissionWhereInput[] = [];
      if (leadIds.length > 0) {
        submissionOr.push({ leadId: { in: leadIds } });
      }
      if (dealIds.length > 0) {
        submissionOr.push({ dealId: { in: dealIds } });
      }

      const submissions = await this.prisma.questionnaireSubmission.findMany({
        where: { tenantId, OR: submissionOr },
        select: {
          id: true,
          leadId: true,
          dealId: true,
          status: true,
          updatedAt: true,
          submittedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      for (const submission of submissions) {
        const targetDealIds = new Set<string>();
        if (submission.dealId) {
          targetDealIds.add(submission.dealId);
        }
        if (submission.leadId) {
          const mappedDealId = leadIdToDealId.get(submission.leadId);
          if (mappedDealId) {
            targetDealIds.add(mappedDealId);
          }
        }

        for (const targetDealId of targetDealIds) {
          const bucket = submissionsByDealId.get(targetDealId) ?? [];
          bucket.push(submission);
          submissionsByDealId.set(targetDealId, bucket);
        }
      }
    }

    const quoteByDealId = new Map<
      string,
      ReturnType<typeof serializeQuoteComparisonSummary>
    >();

    for (const comparison of quoteComparisons) {
      const targetDealIds = new Set<string>();
      if (comparison.dealId) {
        targetDealIds.add(comparison.dealId);
      }
      if (comparison.leadId) {
        const mappedDealId = leadIdToDealId.get(comparison.leadId);
        if (mappedDealId) {
          targetDealIds.add(mappedDealId);
        }
      }

      for (const targetDealId of targetDealIds) {
        if (!quoteByDealId.has(targetDealId)) {
          quoteByDealId.set(
            targetDealId,
            serializeQuoteComparisonSummary(comparison),
          );
        }
      }
    }

    return deals.map((deal) => {
      const leadId = deal.convertedLead?.id;
      const dealSubmissions = submissionsByDealId.get(deal.id) ?? [];
      const questionnaire =
        deriveQuestionnaireCommercialStatus(dealSubmissions);
      const quote = quoteByDealId.get(deal.id) ?? null;
      const lastContactAt =
        deal.convertedLead?.lastContactAt?.toISOString() ?? null;
      const lastInteractionAt = ActivitiesService.resolveLastInteractionAt(
        activityByDealId.get(deal.id) ??
          (leadId ? activityByLeadId.get(leadId) : null),
        deal.convertedLead?.lastContactAt,
      );
      const ownerUser = deal.ownerUser ?? deal.convertedLead?.ownerUser ?? null;

      const stageDef = deal.pipeline?.stages.find(
        (stage) => stage.slug === deal.stage,
      );
      const sla = computeStageSla({
        enteredAt: deal.stageEnteredAt,
        maxDays: stageDef?.maxDays,
      });

      return {
        ...deal,
        value: deal.value.toNumber(),
        sla: {
          ...sla,
          alertTarget: stageDef?.alertTarget ?? null,
          color: stageDef?.color ?? null,
          stageLabel: stageDef?.label ?? crmStageLabel(deal.stage),
        },
        commercialContext: leadId
          ? {
              questionnaire: {
                status: questionnaire.status,
                submissionId: questionnaire.submissionId,
                updatedAt: questionnaire.updatedAt?.toISOString() ?? null,
              },
              quote,
              phone: deal.convertedLead?.phone ?? null,
              lastContactAt,
              lastInteractionAt,
              responsible: resolveResponsibleLabel(
                ownerUser,
                deal.convertedLead?.assignedTo ?? deal.assignedTo,
              ),
            }
          : null,
      };
    });
  }

  private async assertDealAccess(
    tenantId: string,
    dealId: string,
    actor?: LeadAccessActor,
  ): Promise<void> {
    if (this.buAccess && actor?.userId && actor.tenantId) {
      await this.buAccess.assertDealVisible(
        {
          userId: actor.userId,
          tenantId: actor.tenantId,
          roles: actor.roles,
          permissions: actor.permissions,
          currentBusinessUnitId: actor.currentBusinessUnitId,
        },
        tenantId,
        dealId,
      );
    }

    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, tenantId },
      select: { id: true },
    });
    if (!deal) {
      throw new NotFoundException('Negócio não encontrado');
    }

    if (!actor?.userId) return;

    const enforcement = await this.ownership.getEnforcementMode(tenantId);
    if (enforcement === 'off') return;

    const ctx = await this.ownership.resolveContext(tenantId, actor);
    if (enforcement === 'shadow') {
      void this.ownership.logLeadAccessShadowDenied(ctx, dealId);
      return;
    }

    await this.ownership.assertCanAccessDeal(ctx, dealId);
  }

  private async buildDealWhere(
    tenantId: string,
    actor?: LeadAccessActor,
  ): Promise<Prisma.DealWhereInput> {
    let base: Prisma.DealWhereInput = { tenantId };

    if (actor?.userId && actor.tenantId && this.buAccess) {
      const buWhere = await this.buAccess.dealWhere({
        userId: actor.userId,
        tenantId: actor.tenantId,
        roles: actor.roles,
        permissions: actor.permissions,
        currentBusinessUnitId: actor.currentBusinessUnitId,
      });
      if (buWhere) {
        base = andWhere(base, buWhere);
      }
    }

    if (!actor?.userId) {
      return base;
    }

    const enforcement = await this.ownership.getEnforcementMode(tenantId);
    if (enforcement === 'off') {
      return base;
    }

    const ctx = await this.ownership.resolveContext(tenantId, actor);
    const ownershipWhere = this.ownership.buildDealAccessWhere(ctx);

    if (enforcement === 'shadow') {
      void this.ownership.logDealListShadowComparison(
        tenantId,
        ctx,
        base,
        ownershipWhere,
      );
      return base;
    }

    return andWhere(base, ownershipWhere);
  }

  private async recordStageHistory(params: {
    tenantId: string;
    dealId: string;
    fromStage: string | null;
    toStage: string;
    pipelineId: string | null;
    enteredAt: Date;
    performedById?: string | null;
    previousEnteredAt?: Date | null;
  }) {
    const open = await this.prisma.dealStageHistory.findFirst({
      where: { dealId: params.dealId, exitedAt: null },
      orderBy: { enteredAt: 'desc' },
    });
    if (open) {
      await this.prisma.dealStageHistory.update({
        where: { id: open.id },
        data: {
          exitedAt: params.enteredAt,
          durationMs: Math.max(
            0,
            params.enteredAt.getTime() - open.enteredAt.getTime(),
          ),
        },
      });
    } else if (params.fromStage && params.previousEnteredAt) {
      await this.prisma.dealStageHistory.create({
        data: {
          tenantId: params.tenantId,
          dealId: params.dealId,
          fromStage: null,
          toStage: params.fromStage,
          pipelineId: params.pipelineId,
          enteredAt: params.previousEnteredAt,
          exitedAt: params.enteredAt,
          durationMs: Math.max(
            0,
            params.enteredAt.getTime() - params.previousEnteredAt.getTime(),
          ),
          performedById: params.performedById ?? null,
        },
      });
    }
    await this.prisma.dealStageHistory.create({
      data: {
        tenantId: params.tenantId,
        dealId: params.dealId,
        fromStage: params.fromStage,
        toStage: params.toStage,
        pipelineId: params.pipelineId,
        enteredAt: params.enteredAt,
        performedById: params.performedById ?? null,
      },
    });
  }

  private async resolveNextPipelineOrder(tenantId: string, stage: string) {
    const aggregate = await this.prisma.deal.aggregate({
      where: { tenantId, stage },
      _max: { pipelineOrder: true },
    });
    return nextPipelineOrder(aggregate._max.pipelineOrder);
  }

  private async ensureDealBelongsToTenant(tenantId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!deal) {
      throw new NotFoundException('Negócio não encontrado');
    }
  }
}
