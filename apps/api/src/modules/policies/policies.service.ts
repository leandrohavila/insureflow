import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PolicyRenewalStatus, PolicyStatus, Prisma } from '@prisma/client';

import {
  computeCustomerPolicyAggregates,
  resolveLifecycleAfterPolicyIssuance,
  syncCustomerPolicyAggregates,
} from '../../common/utils/customer-policy-aggregates';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CustomerActivationService } from '../customers/customer-activation.service';
import type {
  CancelPolicyDto,
  CreatePolicyDto,
  IssuePolicyFromDealDto,
  ListPoliciesQueryDto,
  RenewPolicyDto,
  UpdatePolicyDto,
} from './dto/policy.dto';
import {
  POLICY_OPERATIONAL_EVENTS,
  policyCancellationSubject,
  policyIssuedSubject,
  policyRenewalCompletedSubject,
  policyRenewalStartedSubject,
} from './policy-events.util';

const policyInclude = {
  customer: {
    select: { id: true, name: true, document: true, lifecycleStage: true },
  },
  deal: { select: { id: true, title: true, company: true, status: true } },
  brokerUser: { select: { id: true, name: true, initials: true } },
} satisfies Prisma.PolicyInclude;

type PolicyRecord = Prisma.PolicyGetPayload<{ include: typeof policyInclude }>;

@Injectable()
export class PoliciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerActivation: CustomerActivationService,
  ) {}

  async findPolicies(tenantId: string, query: ListPoliciesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(tenantId, query);

    const [total, policies] = await this.prisma.$transaction([
      this.prisma.policy.count({ where }),
      this.prisma.policy.findMany({
        where,
        include: policyInclude,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: policies.map((policy) => this.serialize(policy)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findPolicy(tenantId: string, id: string) {
    const policy = await this.findPolicyOrThrow(tenantId, id);
    return this.serialize(policy);
  }

  async createPolicy(
    tenantId: string,
    performedById: string,
    dto: CreatePolicyDto,
    options?: { operationalEventKind?: string; skipLifecycleAdvance?: boolean },
  ) {
    await this.assertPolicyRelations(tenantId, dto);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        const issued = dto.issuedAt ? new Date(dto.issuedAt) : now;
        const status =
          dto.status ??
          (dto.issuedAt || dto.effectiveFrom
            ? PolicyStatus.active
            : PolicyStatus.pending);

        const policy = await tx.policy.create({
          data: this.buildPolicyCreateData(tenantId, dto, {
            status,
            issuedAt: issued,
          }),
          include: policyInclude,
        });

        const aggregates = await syncCustomerPolicyAggregates(
          tx,
          tenantId,
          policy.customerId,
        );

        if (!options?.skipLifecycleAdvance && status === PolicyStatus.active) {
          await this.advanceCustomerLifecycle(tx, tenantId, policy.customerId);
        }

        await this.recordOperationalEvent(tx, {
          tenantId,
          performedById,
          policy,
          operationalEventKind:
            options?.operationalEventKind ??
            POLICY_OPERATIONAL_EVENTS.POLICY_ISSUED,
          subject: policyIssuedSubject(policy),
          description: 'Apólice registrada na camada operacional.',
          occurredAt: issued,
        });

        return {
          ...this.serialize(policy),
          customerAggregates: aggregates,
        };
      });
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async issuePolicyFromDeal(
    tenantId: string,
    performedById: string,
    dto: IssuePolicyFromDealDto,
  ) {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dto.dealId, tenantId },
      select: {
        id: true,
        title: true,
        status: true,
        customerId: true,
        company: true,
        value: true,
      },
    });

    if (!deal) {
      throw new NotFoundException('Negócio não encontrado');
    }
    if (deal.status !== 'won') {
      throw new BadRequestException(
        'Somente negócios ganhos podem emitir apólice operacional.',
      );
    }

    let customerId = deal.customerId;
    if (!customerId) {
      const activation = await this.customerActivation.activateFromWonDeal(
        tenantId,
        deal.id,
        performedById,
      );
      customerId = activation?.customerId ?? null;
    }

    if (!customerId) {
      throw new BadRequestException(
        'Negócio sem cliente vinculado. Ative o cliente antes de emitir a apólice.',
      );
    }

    const now = new Date();
    return this.createPolicy(
      tenantId,
      performedById,
      {
        customerId,
        dealId: deal.id,
        insurer: dto.insurer,
        policyNumber: dto.policyNumber,
        productLine: dto.productLine,
        modality: dto.modality,
        premiumValue: dto.premiumValue,
        commissionValue: dto.commissionValue,
        issuedAt: dto.issuedAt ?? now.toISOString(),
        effectiveFrom: dto.effectiveFrom,
        effectiveTo: dto.effectiveTo,
        status: PolicyStatus.active,
        renewalStatus: PolicyRenewalStatus.pending,
        brokerUserId: dto.brokerUserId,
      },
      { operationalEventKind: POLICY_OPERATIONAL_EVENTS.POLICY_ISSUED },
    );
  }

  async updatePolicy(tenantId: string, id: string, dto: UpdatePolicyDto) {
    await this.findPolicyOrThrow(tenantId, id);
    if (dto.customerId || dto.dealId || dto.brokerUserId) {
      await this.assertPolicyRelations(tenantId, {
        customerId: dto.customerId,
        dealId: dto.dealId,
        brokerUserId: dto.brokerUserId,
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const policy = await tx.policy.update({
          where: { id },
          data: {
            ...(dto.customerId !== undefined
              ? { customerId: dto.customerId }
              : {}),
            ...(dto.dealId !== undefined ? { dealId: dto.dealId ?? null } : {}),
            ...(dto.insurer !== undefined ? { insurer: dto.insurer } : {}),
            ...(dto.policyNumber !== undefined
              ? { policyNumber: dto.policyNumber }
              : {}),
            ...(dto.productLine !== undefined
              ? { productLine: dto.productLine }
              : {}),
            ...(dto.modality !== undefined
              ? { modality: dto.modality ?? null }
              : {}),
            ...(dto.premiumValue !== undefined
              ? { premiumValue: dto.premiumValue }
              : {}),
            ...(dto.commissionValue !== undefined
              ? { commissionValue: dto.commissionValue ?? null }
              : {}),
            ...(dto.issuedAt !== undefined
              ? { issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null }
              : {}),
            ...(dto.effectiveFrom !== undefined
              ? {
                  effectiveFrom: dto.effectiveFrom
                    ? new Date(dto.effectiveFrom)
                    : null,
                }
              : {}),
            ...(dto.effectiveTo !== undefined
              ? {
                  effectiveTo: dto.effectiveTo
                    ? new Date(dto.effectiveTo)
                    : null,
                }
              : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.renewalStatus !== undefined
              ? { renewalStatus: dto.renewalStatus ?? null }
              : {}),
            ...(dto.brokerUserId !== undefined
              ? { brokerUserId: dto.brokerUserId ?? null }
              : {}),
          },
          include: policyInclude,
        });

        const aggregates = await syncCustomerPolicyAggregates(
          tx,
          tenantId,
          policy.customerId,
        );

        return {
          ...this.serialize(policy),
          customerAggregates: aggregates,
        };
      });
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async cancelPolicy(
    tenantId: string,
    id: string,
    performedById: string,
    dto: CancelPolicyDto,
  ) {
    const existing = await this.findPolicyOrThrow(tenantId, id);
    if (existing.status === PolicyStatus.cancelled) {
      throw new BadRequestException('Apólice já está cancelada.');
    }

    const occurredAt = dto.cancelledAt ? new Date(dto.cancelledAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const policy = await tx.policy.update({
        where: { id },
        data: {
          status: PolicyStatus.cancelled,
          renewalStatus: PolicyRenewalStatus.cancelled,
        },
        include: policyInclude,
      });

      const aggregates = await syncCustomerPolicyAggregates(
        tx,
        tenantId,
        policy.customerId,
      );

      await this.recordOperationalEvent(tx, {
        tenantId,
        performedById,
        policy,
        operationalEventKind: POLICY_OPERATIONAL_EVENTS.CANCELLATION,
        subject: policyCancellationSubject(policy),
        description:
          dto.reason?.trim() || 'Cancelamento operacional da apólice.',
        occurredAt,
      });

      return {
        ...this.serialize(policy),
        customerAggregates: aggregates,
      };
    });
  }

  async renewPolicy(
    tenantId: string,
    id: string,
    performedById: string,
    dto: RenewPolicyDto,
  ) {
    const existing = await this.findPolicyOrThrow(tenantId, id);
    if (existing.status === PolicyStatus.cancelled) {
      throw new BadRequestException(
        'Não é possível renovar apólice cancelada.',
      );
    }

    const now = new Date();
    const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : now;

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.policy.update({
          where: { id },
          data: {
            renewalStatus: PolicyRenewalStatus.renewed,
          },
        });

        await this.recordOperationalEvent(tx, {
          tenantId,
          performedById,
          policy: existing,
          operationalEventKind: POLICY_OPERATIONAL_EVENTS.RENEWAL_STARTED,
          subject: policyRenewalStartedSubject(existing),
          description: 'Processo de renovação iniciado.',
          occurredAt: now,
        });

        const renewed = await tx.policy.create({
          data: {
            tenantId,
            customerId: existing.customerId,
            dealId: existing.dealId,
            insurer: dto.insurer ?? existing.insurer,
            policyNumber: dto.policyNumber,
            productLine: dto.productLine ?? existing.productLine,
            modality: dto.modality ?? existing.modality,
            premiumValue: dto.premiumValue ?? existing.premiumValue,
            commissionValue:
              dto.commissionValue ?? existing.commissionValue ?? null,
            issuedAt,
            effectiveFrom: new Date(dto.effectiveFrom),
            effectiveTo: new Date(dto.effectiveTo),
            status: PolicyStatus.active,
            renewalStatus: PolicyRenewalStatus.pending,
            brokerUserId: existing.brokerUserId,
          },
          include: policyInclude,
        });

        const aggregates = await syncCustomerPolicyAggregates(
          tx,
          tenantId,
          renewed.customerId,
        );

        await this.advanceCustomerLifecycle(tx, tenantId, renewed.customerId);

        await this.recordOperationalEvent(tx, {
          tenantId,
          performedById,
          policy: renewed,
          operationalEventKind: POLICY_OPERATIONAL_EVENTS.RENEWAL_COMPLETED,
          subject: policyRenewalCompletedSubject(renewed),
          description: `Renovação da apólice ${existing.policyNumber}.`,
          occurredAt: issuedAt,
        });

        return {
          previousPolicyId: existing.id,
          policy: this.serialize(renewed),
          customerAggregates: aggregates,
        };
      });
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async getCustomerPolicyAggregates(tenantId: string, customerId: string) {
    await this.assertCustomer(tenantId, customerId);
    const policies = await this.prisma.policy.findMany({
      where: { tenantId, customerId },
      select: {
        status: true,
        renewalStatus: true,
        premiumValue: true,
        commissionValue: true,
        effectiveTo: true,
        issuedAt: true,
        updatedAt: true,
      },
    });
    return computeCustomerPolicyAggregates(policies);
  }

  private buildWhere(
    tenantId: string,
    query: ListPoliciesQueryDto,
  ): Prisma.PolicyWhereInput {
    const where: Prisma.PolicyWhereInput = { tenantId };

    if (query.customerId) where.customerId = query.customerId;
    if (query.dealId) where.dealId = query.dealId;
    if (query.status) where.status = query.status;
    if (query.renewalStatus) where.renewalStatus = query.renewalStatus;
    if (query.insurer?.trim()) {
      where.insurer = { contains: query.insurer.trim(), mode: 'insensitive' };
    }

    if (query.effectiveToBefore || query.effectiveToAfter) {
      where.effectiveTo = {};
      if (query.effectiveToAfter) {
        where.effectiveTo.gte = new Date(query.effectiveToAfter);
      }
      if (query.effectiveToBefore) {
        where.effectiveTo.lte = new Date(query.effectiveToBefore);
      }
    }

    return where;
  }

  private buildPolicyCreateData(
    tenantId: string,
    dto: CreatePolicyDto,
    overrides: { status: PolicyStatus; issuedAt?: Date },
  ): Prisma.PolicyCreateInput {
    return {
      tenant: { connect: { id: tenantId } },
      customer: { connect: { id: dto.customerId } },
      ...(dto.dealId ? { deal: { connect: { id: dto.dealId } } } : {}),
      insurer: dto.insurer.trim(),
      policyNumber: dto.policyNumber.trim(),
      productLine: dto.productLine.trim(),
      modality: dto.modality?.trim() || null,
      premiumValue: dto.premiumValue,
      commissionValue: dto.commissionValue ?? null,
      issuedAt:
        overrides.issuedAt ?? (dto.issuedAt ? new Date(dto.issuedAt) : null),
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      status: overrides.status,
      renewalStatus: dto.renewalStatus ?? PolicyRenewalStatus.pending,
      ...(dto.brokerUserId
        ? { brokerUser: { connect: { id: dto.brokerUserId } } }
        : {}),
    };
  }

  private async advanceCustomerLifecycle(
    tx: Prisma.TransactionClient,
    tenantId: string,
    customerId: string,
  ) {
    const customer = await tx.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { lifecycleStage: true },
    });
    if (!customer) return;

    const nextStage = resolveLifecycleAfterPolicyIssuance(
      customer.lifecycleStage,
    );
    await tx.customer.update({
      where: { id: customerId },
      data: { lifecycleStage: nextStage },
    });
  }

  private async recordOperationalEvent(
    tx: Prisma.TransactionClient,
    input: {
      tenantId: string;
      performedById: string;
      policy: PolicyRecord;
      operationalEventKind: string;
      subject: string;
      description: string;
      occurredAt: Date;
    },
  ) {
    await tx.activity.create({
      data: {
        tenantId: input.tenantId,
        type: 'note',
        status: 'completed',
        subject: input.subject,
        description: input.description,
        operationalEventKind: input.operationalEventKind,
        occurredAt: input.occurredAt,
        customerId: input.policy.customerId,
        dealId: input.policy.dealId,
        policyId: input.policy.id,
        performedById: input.performedById,
      },
    });
  }

  private async assertPolicyRelations(
    tenantId: string,
    dto: {
      customerId?: string;
      dealId?: string | null;
      brokerUserId?: string | null;
    },
  ) {
    if (dto.customerId) {
      await this.assertCustomer(tenantId, dto.customerId);
    }

    if (dto.dealId) {
      const deal = await this.prisma.deal.findFirst({
        where: { id: dto.dealId, tenantId },
        select: { id: true, customerId: true },
      });
      if (!deal) {
        throw new NotFoundException('Negócio não encontrado');
      }
      if (
        dto.customerId &&
        deal.customerId &&
        deal.customerId !== dto.customerId
      ) {
        throw new BadRequestException(
          'customerId não corresponde ao cliente vinculado ao negócio.',
        );
      }
    }

    if (dto.brokerUserId) {
      const broker = await this.prisma.user.findFirst({
        where: { id: dto.brokerUserId, tenantId },
        select: { id: true },
      });
      if (!broker) {
        throw new NotFoundException('Corretor não encontrado');
      }
    }
  }

  private async assertCustomer(tenantId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
  }

  private async findPolicyOrThrow(tenantId: string, id: string) {
    const policy = await this.prisma.policy.findFirst({
      where: { id, tenantId },
      include: policyInclude,
    });
    if (!policy) {
      throw new NotFoundException('Apólice não encontrada');
    }
    return policy;
  }

  private serialize(policy: PolicyRecord) {
    return {
      ...policy,
      premiumValue: Number(policy.premiumValue),
      commissionValue:
        policy.commissionValue != null ? Number(policy.commissionValue) : null,
      issuedAt: policy.issuedAt?.toISOString() ?? null,
      effectiveFrom: policy.effectiveFrom?.toISOString() ?? null,
      effectiveTo: policy.effectiveTo?.toISOString() ?? null,
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString(),
    };
  }

  private handleWriteError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Número de apólice já cadastrado neste tenant',
      );
    }
    throw error;
  }
}
