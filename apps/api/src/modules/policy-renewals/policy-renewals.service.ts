import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  formatRenewalDueDate,
  shouldCreateRenewalOpportunity,
  shouldCreateRenewalTask,
  shouldSendRenewalReminder,
  utcDaysUntil,
} from '../../common/utils/commercial-recovery.util';
import { startOfUtcDay } from '../../common/utils/lead-reactivation.util';
import { renderMessageTemplate } from '../../common/utils/message-template-render.util';
import { andWhere, type BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityEngineService } from '../activities/activity-engine.service';
import { CommunicationsService } from '../communications/communications.service';
import { MessageTemplatesService } from '../message-templates/message-templates.service';
import type {
  CreatePolicyRenewalDto,
  ListPolicyRenewalsQueryDto,
  UpdatePolicyRenewalDto,
} from './dto/policy-renewal.dto';

const renewalInclude = {
  customer: {
    select: { id: true, name: true, document: true, companyName: true },
  },
  assignedUser: { select: { id: true, name: true } },
  businessUnit: { select: { id: true, name: true, type: true } },
  deal: { select: { id: true, title: true, status: true, value: true, stage: true } },
  policy: {
    select: {
      id: true,
      premiumValue: true,
      effectiveFrom: true,
      effectiveTo: true,
    },
  },
} as const;

@Injectable()
export class PolicyRenewalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityEngine: ActivityEngineService,
    private readonly templates: MessageTemplatesService,
    private readonly communications: CommunicationsService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async findAll(
    tenantId: string,
    query: ListPolicyRenewalsQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    let where: Prisma.PolicyRenewalWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.product
        ? { product: { contains: query.product, mode: 'insensitive' } }
        : {}),
      ...(query.insurer
        ? { insurer: { contains: query.insurer, mode: 'insensitive' } }
        : {}),
      ...(query.company
        ? {
            customer: {
              companyName: { contains: query.company, mode: 'insensitive' },
            },
          }
        : {}),
    };
    if (query.dueInDays) {
      const now = startOfUtcDay(new Date());
      const until = new Date(now);
      until.setUTCDate(until.getUTCDate() + query.dueInDays);
      until.setUTCHours(23, 59, 59, 999);
      where = {
        ...where,
        endDate: { gte: now, lte: until },
      };
    } else if (query.from || query.to) {
      where = {
        ...where,
        endDate: {
          ...(query.from ? { gte: new Date(query.from) } : {}),
          ...(query.to ? { lte: new Date(query.to) } : {}),
        },
      };
    }
    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.renewalWhere(
        actor,
        query.businessUnitId,
      );
      if (buWhere) where = andWhere(where, buWhere);
    } else if (query.businessUnitId) {
      where = { ...where, businessUnitId: query.businessUnitId };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.policyRenewal.count({ where }),
      this.prisma.policyRenewal.findMany({
        where,
        include: renewalInclude,
        orderBy: { renewalDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: data.map((item) => this.serialize(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertRenewalVisible(actor, tenantId, id);
    }
    const item = await this.prisma.policyRenewal.findFirst({
      where: { id, tenantId },
      include: renewalInclude,
    });
    if (!item) {
      throw new NotFoundException('Renovação não encontrada');
    }
    return this.serialize(item);
  }

  async create(
    tenantId: string,
    dto: CreatePolicyRenewalDto,
    actorUserId: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.clientId, tenantId },
      select: { id: true, name: true, businessUnitId: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const endDate = new Date(dto.endDate);
    const created = await this.prisma.policyRenewal.create({
      data: {
        tenantId,
        customerId: customer.id,
        policyId: dto.policyId ?? null,
        policyNumber: dto.policyNumber.trim(),
        insurer: dto.insurer.trim(),
        product: dto.product.trim(),
        startDate: new Date(dto.startDate),
        endDate,
        renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : endDate,
        status: dto.status ?? 'ACTIVE',
        assignedUserId: dto.assignedUserId ?? actorUserId,
        businessUnitId: dto.businessUnitId ?? customer.businessUnitId,
      },
      include: renewalInclude,
    });

    await this.activityEngine.publish({
      tenantId,
      performedById: actorUserId,
      operationalEventKind: 'renewal_started',
      subject: `Renovação cadastrada — ${created.policyNumber}`,
      customerId: customer.id,
      policyId: created.policyId,
      metadata: { renewalId: created.id },
    });

    return this.serialize(created);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePolicyRenewalDto,
    actorUserId: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertRenewalVisible(actor, tenantId, id);
    }
    const existing = await this.prisma.policyRenewal.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Renovação não encontrada');
    }

    const updated = await this.prisma.policyRenewal.update({
      where: { id },
      data: {
        ...(dto.policyNumber !== undefined
          ? { policyNumber: dto.policyNumber.trim() }
          : {}),
        ...(dto.insurer !== undefined ? { insurer: dto.insurer.trim() } : {}),
        ...(dto.product !== undefined ? { product: dto.product.trim() } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: new Date(dto.startDate) }
          : {}),
        ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        ...(dto.renewalDate !== undefined
          ? { renewalDate: new Date(dto.renewalDate) }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.assignedUserId !== undefined
          ? { assignedUserId: dto.assignedUserId || null }
          : {}),
        ...(dto.businessUnitId !== undefined
          ? { businessUnitId: dto.businessUnitId || null }
          : {}),
        ...(dto.convertedRevenue !== undefined
          ? { convertedRevenue: new Prisma.Decimal(dto.convertedRevenue) }
          : {}),
      },
      include: renewalInclude,
    });

    if (dto.status === 'RENEWED' && existing.status !== 'RENEWED') {
      await this.activityEngine.publish({
        tenantId,
        performedById: actorUserId,
        operationalEventKind: 'renewal_completed',
        subject: `Renovação convertida — ${updated.policyNumber}`,
        customerId: updated.customerId,
        policyId: updated.policyId,
        dealId: updated.dealId,
        metadata: { renewalId: updated.id },
      });
    }

    return this.serialize(updated);
  }

  async createDealFromRenewal(
    tenantId: string,
    id: string,
    actorUserId: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertRenewalVisible(actor, tenantId, id);
    }
    const renewal = await this.prisma.policyRenewal.findFirst({
      where: { id, tenantId },
      include: renewalInclude,
    });
    if (!renewal) {
      throw new NotFoundException('Renovação não encontrada');
    }
    if (renewal.dealId) {
      return this.serialize(renewal);
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: renewal.customerId, tenantId },
      select: { id: true, name: true, companyName: true, businessUnitId: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const now = new Date();
    const pipeline = customer.businessUnitId
      ? await this.prisma.businessUnitPipeline.findUnique({
          where: { businessUnitId: customer.businessUnitId },
          select: { id: true },
        })
      : null;
    const deal = await this.prisma.deal.create({
      data: {
        tenantId,
        title: `Renovação — ${renewal.product} — ${customer.name}`,
        company: customer.companyName || renewal.insurer,
        value: renewal.policy?.premiumValue ?? 0,
        stage: 'novo',
        status: 'open',
        customerId: customer.id,
        ownerUserId: renewal.assignedUserId ?? actorUserId,
        businessUnitId: customer.businessUnitId,
        pipelineId: pipeline?.id ?? null,
        sourceType: 'RENEWAL',
        sourceId: renewal.id,
        score: 'HIGH',
        stageEnteredAt: now,
      },
    });
    await this.prisma.dealStageHistory.create({
      data: {
        tenantId,
        dealId: deal.id,
        fromStage: null,
        toStage: 'novo',
        pipelineId: pipeline?.id ?? null,
        enteredAt: now,
        performedById: actorUserId,
      },
    });
    await this.activityEngine.publish({
      tenantId,
      performedById: actorUserId,
      operationalEventKind: 'renewal_opportunity_created',
      subject: `Negócio de renovação — ${renewal.policyNumber}`,
      customerId: customer.id,
      policyId: renewal.policyId,
      dealId: deal.id,
      metadata: { renewalId: renewal.id, sourceType: 'RENEWAL' },
    });
    const updated = await this.prisma.policyRenewal.update({
      where: { id: renewal.id },
      data: {
        dealId: deal.id,
        opportunityCreatedAt: now,
        status:
          renewal.status === 'RENEWED' || renewal.status === 'LOST'
            ? renewal.status
            : 'RENEWAL_IN_PROGRESS',
      },
      include: renewalInclude,
    });
    return this.serialize(updated);
  }

  async createActivityForRenewal(
    tenantId: string,
    id: string,
    actorUserId: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertRenewalVisible(actor, tenantId, id);
    }
    const renewal = await this.prisma.policyRenewal.findFirst({
      where: { id, tenantId },
    });
    if (!renewal) {
      throw new NotFoundException('Renovação não encontrada');
    }
    const followUp = new Date();
    followUp.setDate(followUp.getDate() + 1);
    await this.activityEngine.publish({
      tenantId,
      performedById: actorUserId,
      operationalEventKind: 'renewal_task_created',
      subject: `Follow-up de renovação — ${renewal.policyNumber}`,
      description: `${renewal.product} · ${renewal.insurer}`,
      customerId: renewal.customerId,
      policyId: renewal.policyId,
      dealId: renewal.dealId,
      metadata: { renewalId: renewal.id },
    });
    await this.prisma.activity.create({
      data: {
        tenantId,
        type: 'follow_up',
        status: 'pending',
        subject: `Renovação ${renewal.policyNumber}`,
        description: `${renewal.product} · ${renewal.insurer}`,
        occurredAt: new Date(),
        nextFollowUpAt: followUp,
        customerId: renewal.customerId,
        policyId: renewal.policyId,
        dealId: renewal.dealId,
        performedById: actorUserId,
      },
    });
    return this.findOne(tenantId, id, actor);
  }

  async processDailyAutomation(now = new Date(), tenantId?: string) {
    const summary = {
      tasksCreated: 0,
      remindersSent: 0,
      opportunitiesCreated: 0,
      scanned: 0,
    };

    const policies = await this.prisma.policy.findMany({
      where: {
        status: 'active',
        effectiveTo: { gte: startOfUtcDay(now) },
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            tenantId: true,
            businessUnitId: true,
            companyName: true,
            phone: true,
            email: true,
          },
        },
        brokerUser: { select: { id: true, name: true } },
      },
      take: 400,
    });

    for (const policy of policies) {
      if (!policy.effectiveTo) continue;
      summary.scanned += 1;
      const daysUntil = utcDaysUntil(now, policy.effectiveTo);
      if (daysUntil > 60) continue;

      let renewal = await this.prisma.policyRenewal.findFirst({
        where: {
          tenantId: policy.tenantId,
          OR: [{ policyId: policy.id }, { policyNumber: policy.policyNumber }],
          status: { notIn: ['LOST', 'RENEWED'] },
        },
      });

      if (!renewal) {
        renewal = await this.prisma.policyRenewal.create({
          data: {
            tenantId: policy.tenantId,
            customerId: policy.customerId,
            policyId: policy.id,
            policyNumber: policy.policyNumber,
            insurer: policy.insurer,
            product: policy.productLine,
            startDate: policy.effectiveFrom ?? policy.createdAt,
            endDate: policy.effectiveTo,
            renewalDate: policy.effectiveTo,
            status: 'RENEWAL_PENDING',
            assignedUserId: policy.brokerUserId,
            businessUnitId: policy.customer.businessUnitId,
          },
        });
      }

      const performerId = await this.resolvePerformerId(
        policy.tenantId,
        renewal.assignedUserId ?? policy.brokerUserId,
      );
      if (!performerId) continue;

      if (
        shouldCreateRenewalTask({
          daysUntil,
          taskCreatedAt: renewal.taskCreatedAt,
        })
      ) {
        await this.activityEngine.publish({
          tenantId: policy.tenantId,
          performedById: performerId,
          operationalEventKind: 'renewal_task_created',
          subject: `Tarefa de renovação — ${policy.policyNumber}`,
          description: `${policy.customer.name} · ${policy.productLine} vence em ${daysUntil} dia(s)`,
          customerId: policy.customerId,
          policyId: policy.id,
          dealId: renewal.dealId,
          metadata: { renewalId: renewal.id, daysUntil },
        });
        renewal = await this.prisma.policyRenewal.update({
          where: { id: renewal.id },
          data: {
            taskCreatedAt: now,
            status:
              renewal.status === 'ACTIVE' ? 'RENEWAL_PENDING' : renewal.status,
          },
        });
        summary.tasksCreated += 1;
      }

      if (
        shouldSendRenewalReminder({
          daysUntil,
          reminderSentAt: renewal.reminderSentAt,
        })
      ) {
        const template = await this.templates.findActiveForChannel(
          policy.tenantId,
          'WHATSAPP',
          'RENEWAL',
        );
        const content = renderMessageTemplate(
          template?.content ??
            'Olá {{nome}}. Sua apólice de {{produto}} vence em {{vencimento}}.',
          {
            nome: policy.customer.name,
            produto: policy.productLine,
            empresa: policy.customer.companyName,
            corretor: policy.brokerUser?.name,
            vencimento: formatRenewalDueDate(policy.effectiveTo),
          },
        );
        const to = await this.communications.resolveRecipient({
          channel: 'WHATSAPP',
          phone: policy.customer.phone,
          email: policy.customer.email,
        });
        const dispatch = await this.communications.dispatch({
          tenantId: policy.tenantId,
          channel: 'WHATSAPP',
          purpose: 'RENEWAL',
          content,
          to,
          customerId: policy.customerId,
          templateId: template?.id ?? null,
          performedById: performerId,
          metadata: {
            renewalId: renewal.id,
            policyId: policy.id,
            daysUntil,
            source: 'policy_renewal',
          },
        });
        if (dispatch.status === 'sent') {
          await this.activityEngine.publish({
            tenantId: policy.tenantId,
            performedById: performerId,
            operationalEventKind: 'renewal_reminder_sent',
            subject: `Lembrete de renovação — ${policy.policyNumber}`,
            description: content,
            customerId: policy.customerId,
            policyId: policy.id,
            metadata: {
              renewalId: renewal.id,
              daysUntil,
              communicationId: dispatch.id,
              provider: dispatch.provider,
            },
          });
          renewal = await this.prisma.policyRenewal.update({
            where: { id: renewal.id },
            data: { reminderSentAt: now },
          });
          summary.remindersSent += 1;
        }
      }

      if (
        shouldCreateRenewalOpportunity({
          daysUntil,
          opportunityCreatedAt: renewal.opportunityCreatedAt,
        }) &&
        !renewal.dealId
      ) {
        const pipeline = policy.customer.businessUnitId
          ? await this.prisma.businessUnitPipeline.findUnique({
              where: { businessUnitId: policy.customer.businessUnitId },
              select: { id: true },
            })
          : null;
        const deal = await this.prisma.deal.create({
          data: {
            tenantId: policy.tenantId,
            title: `Renovação — ${policy.productLine} — ${policy.customer.name}`,
            company: policy.customer.companyName || policy.insurer,
            value: policy.premiumValue,
            stage: 'novo',
            status: 'open',
            customerId: policy.customerId,
            ownerUserId: renewal.assignedUserId ?? policy.brokerUserId,
            businessUnitId: policy.customer.businessUnitId,
            pipelineId: pipeline?.id ?? null,
            sourceType: 'RENEWAL',
            sourceId: renewal.id,
            score: 'HIGH',
            stageEnteredAt: now,
          },
        });
        await this.prisma.dealStageHistory.create({
          data: {
            tenantId: policy.tenantId,
            dealId: deal.id,
            fromStage: null,
            toStage: 'novo',
            pipelineId: pipeline?.id ?? null,
            enteredAt: now,
            performedById: performerId,
          },
        });
        await this.activityEngine.publish({
          tenantId: policy.tenantId,
          performedById: performerId,
          operationalEventKind: 'deal_created',
          subject: `Negócio criado — ${deal.title}`,
          customerId: policy.customerId,
          dealId: deal.id,
          metadata: { renewalId: renewal.id, sourceType: 'RENEWAL' },
        });
        await this.activityEngine.publish({
          tenantId: policy.tenantId,
          performedById: performerId,
          operationalEventKind: 'renewal_opportunity_created',
          subject: `Oportunidade de renovação — ${policy.policyNumber}`,
          customerId: policy.customerId,
          policyId: policy.id,
          dealId: deal.id,
          metadata: { renewalId: renewal.id, daysUntil },
        });
        await this.prisma.policyRenewal.update({
          where: { id: renewal.id },
          data: {
            dealId: deal.id,
            opportunityCreatedAt: now,
            status: 'RENEWAL_IN_PROGRESS',
          },
        });
        summary.opportunitiesCreated += 1;
      }
    }

    return summary;
  }

  private serialize(
    item: Prisma.PolicyRenewalGetPayload<{ include: typeof renewalInclude }>,
  ) {
    return {
      ...item,
      clientId: item.customerId,
      convertedRevenue: item.convertedRevenue
        ? Number(item.convertedRevenue)
        : null,
      daysUntil: utcDaysUntil(new Date(), item.endDate),
      deal: item.deal
        ? { ...item.deal, value: Number(item.deal.value) }
        : null,
      policy: item.policy
        ? {
            ...item.policy,
            premiumValue: Number(item.policy.premiumValue),
          }
        : null,
    };
  }

  private async resolvePerformerId(
    tenantId: string,
    preferredUserId?: string | null,
  ) {
    if (preferredUserId) return preferredUserId;
    const user = await this.prisma.user.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return user?.id ?? null;
  }
}
