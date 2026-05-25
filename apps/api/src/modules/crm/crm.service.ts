import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ActivitiesService } from '../activities/activities.service';
import { CustomerActivationService } from '../customers/customer-activation.service';
import { deriveQuestionnaireCommercialStatus } from '../../common/utils/questionnaire-commercial.util';
import { nextPipelineOrder } from '../../common/utils/pipeline-order.util';
import { logDealContract } from '../../common/utils/deal-contract-debug';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { CreateDealDto, UpdateDealDto } from './dto/deal.dto';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: ActivitiesService,
    private readonly customerActivation: CustomerActivationService,
  ) {}

  async findDeals(tenantId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId },
      include: {
        convertedLead: {
          select: {
            id: true,
            name: true,
            assignedTo: true,
            status: true,
            phone: true,
            email: true,
            lastContactAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ pipelineOrder: 'asc' }, { createdAt: 'asc' }],
    });

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
    const [activityByDealId, activityByLeadId] = await Promise.all([
      this.activities.maxOccurredAtByDealIds(tenantId, dealIds),
      this.activities.maxOccurredAtByLeadIds(tenantId, leadIds),
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

      const leadIdToDealId = new Map<string, string>();
      for (const deal of deals) {
        if (deal.convertedLead?.id) {
          leadIdToDealId.set(deal.convertedLead.id, deal.id);
        }
      }

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

    return deals.map((deal) => {
      const leadId = deal.convertedLead?.id;
      const dealSubmissions = submissionsByDealId.get(deal.id) ?? [];
      const questionnaire =
        deriveQuestionnaireCommercialStatus(dealSubmissions);
      const lastContactAt =
        deal.convertedLead?.lastContactAt?.toISOString() ?? null;
      const lastInteractionAt = ActivitiesService.resolveLastInteractionAt(
        activityByDealId.get(deal.id) ??
          (leadId ? activityByLeadId.get(leadId) : null),
        deal.convertedLead?.lastContactAt,
      );

      return {
        ...deal,
        value: deal.value.toNumber(),
        commercialContext: leadId
          ? {
              questionnaire: {
                status: questionnaire.status,
                submissionId: questionnaire.submissionId,
                updatedAt: questionnaire.updatedAt?.toISOString() ?? null,
              },
              phone: deal.convertedLead?.phone ?? null,
              lastContactAt,
              lastInteractionAt,
              responsible:
                deal.convertedLead?.assignedTo?.trim() ||
                deal.assignedTo?.trim() ||
                null,
            }
          : null,
      };
    });
  }

  async createDeal(tenantId: string, dto: CreateDealDto) {
    logDealContract('service.create', {
      pipelineOrder: dto.pipelineOrder,
      stage: dto.stage,
    });
    const pipelineOrder =
      dto.pipelineOrder ??
      (await this.resolveNextPipelineOrder(tenantId, dto.stage));

    const deal = await this.prisma.deal.create({
      data: {
        tenantId,
        title: dto.title,
        company: dto.company,
        value: new Prisma.Decimal(dto.value),
        stage: dto.stage,
        status: dto.status,
        assignedTo: dto.assignedTo,
        pipelineOrder,
      },
    });

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
      select: { status: true },
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

    if (dto.status === 'won' && previous?.status !== 'won' && performedById) {
      await this.customerActivation.activateFromWonDeal(
        tenantId,
        id,
        performedById,
      );
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
