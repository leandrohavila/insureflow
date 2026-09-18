import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { computeCustomerPolicyAggregates } from '../../common/utils/customer-policy-aggregates';
import { andWhere } from '../../common/utils/business-unit-acl.util';
import type { BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import {
  resolveBusinessUnitIds,
  syncCustomerBusinessUnits,
} from '../../common/utils/business-unit-membership.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitsService } from '../business-units/business-units.service';
import { CrossSellService } from '../cross-sell/cross-sell.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import type {
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
} from './dto/customer.dto';

const customerUnitInclude = {
  ownerUser: {
    select: { id: true, name: true, initials: true },
  },
  businessUnit: {
    select: { id: true, name: true, slug: true, type: true, isActive: true },
  },
  businessUnits: {
    include: {
      businessUnit: {
        select: { id: true, name: true, slug: true, type: true, isActive: true },
      },
    },
  },
} satisfies Prisma.CustomerInclude;

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessUnits: BusinessUnitsService,
    private readonly crossSell: CrossSellService,
    @Optional() private readonly opportunities?: OpportunitiesService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async findCustomers(
    tenantId: string,
    query: ListCustomersQueryDto,
    actor?: BusinessUnitActor,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = await this.buildCustomerWhere(tenantId, query, actor);

    const whereWithoutType = await this.buildCustomerWhere(tenantId, {
      ...query,
      type: undefined,
    }, actor);

    const [total, customers, pj, withEmail] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        include: customerUnitInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customer.count({
        where: { ...whereWithoutType, type: 'PJ' },
      }),
      this.prisma.customer.count({
        where: { ...whereWithoutType, email: { not: null } },
      }),
    ]);

    return {
      data: customers.map((customer) => serializeCustomer(customer)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        counts: {
          pj,
          withEmail,
        },
      },
    };
  }

  async findCustomer(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertCustomerVisible(actor, tenantId, id);
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: customerUnitInclude,
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const policies = await this.prisma.policy.findMany({
      where: { tenantId, customerId: id },
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

    return {
      ...serializeCustomer(customer),
      policyAggregates: computeCustomerPolicyAggregates(policies),
    };
  }

  async createCustomer(tenantId: string, dto: CreateCustomerDto) {
    const units = await this.resolveRequestedUnits(tenantId, dto);
    try {
      const customer = await this.prisma.customer.create({
        data: {
          tenantId,
          type: dto.type,
          name: dto.name,
          document: dto.document,
          email: dto.email,
          phone: dto.phone,
          status: dto.status,
          lifecycleStage: dto.lifecycleStage ?? 'won',
          companyName: dto.companyName,
          renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : null,
          renewalStatus: dto.renewalStatus,
          renewalPipeline: dto.renewalPipeline,
          businessUnitId: units.originId,
          interestCategories: dto.interestCategories ?? [],
          ownerUserId: dto.ownerUserId ?? null,
          ...(units.unitIds.length
            ? {
                businessUnits: {
                  create: units.unitIds.map((businessUnitId) => ({
                    businessUnitId,
                    isOrigin: businessUnitId === units.originId,
                  })),
                },
              }
            : {}),
        },
        include: customerUnitInclude,
      });
      if (customer.interestCategories.length > 0) {
        await this.crossSell.generateForCustomer(
          tenantId,
          customer.id,
          customer.interestCategories,
        );
        await this.opportunities?.generateForCustomer(tenantId, customer.id);
      }
      return serializeCustomer(customer);
    } catch (error) {
      this.handleCustomerWriteError(error);
    }
  }

  async updateCustomer(
    tenantId: string,
    id: string,
    dto: UpdateCustomerDto,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertCustomerVisible(actor, tenantId, id);
    }
    await this.ensureCustomerBelongsToTenant(tenantId, id);

    try {
      const updated = await this.prisma.customer.update({
        where: { id },
        data: {
          ...(dto.type !== undefined ? { type: dto.type } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.document !== undefined ? { document: dto.document } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.lifecycleStage !== undefined
            ? { lifecycleStage: dto.lifecycleStage }
            : {}),
          ...(dto.companyName !== undefined
            ? { companyName: dto.companyName }
            : {}),
          ...(dto.renewalDate !== undefined
            ? {
                renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : null,
              }
            : {}),
          ...(dto.renewalStatus !== undefined
            ? { renewalStatus: dto.renewalStatus }
            : {}),
          ...(dto.renewalPipeline !== undefined
            ? { renewalPipeline: dto.renewalPipeline }
            : {}),
          ...(dto.interestCategories !== undefined
            ? { interestCategories: dto.interestCategories }
            : {}),
          ...(dto.ownerUserId !== undefined
            ? { ownerUserId: dto.ownerUserId }
            : {}),
        },
        include: customerUnitInclude,
      });

      if (dto.businessUnitId !== undefined || dto.businessUnitIds !== undefined) {
        const current = await this.prisma.customer.findFirst({
          where: { id, tenantId },
          select: {
            businessUnitId: true,
            businessUnits: { select: { businessUnitId: true } },
          },
        });
        const units = await this.resolveRequestedUnits(tenantId, dto, {
          originId: current?.businessUnitId,
          unitIds: current?.businessUnits.map((item) => item.businessUnitId),
        });
        await syncCustomerBusinessUnits(
          this.prisma,
          id,
          units.unitIds,
          units.originId,
        );
      }

      if (dto.interestCategories) {
        await this.crossSell.generateForCustomer(
          tenantId,
          id,
          dto.interestCategories,
        );
        await this.opportunities?.generateForCustomer(tenantId, id);
      }

      const refreshed = await this.prisma.customer.findFirst({
        where: { id, tenantId },
        include: customerUnitInclude,
      });
      return serializeCustomer(refreshed ?? updated);
    } catch (error) {
      this.handleCustomerWriteError(error);
    }
  }

  async deleteCustomer(
    tenantId: string,
    id: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertCustomerVisible(actor, tenantId, id);
    }
    await this.ensureCustomerBelongsToTenant(tenantId, id);
    await this.prisma.customer.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async buildCustomerWhere(
    tenantId: string,
    query: ListCustomersQueryDto,
    actor?: BusinessUnitActor,
  ): Promise<Prisma.CustomerWhereInput> {
    const search = query.search?.trim();

    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.lifecycleStage ? { lifecycleStage: query.lifecycleStage } : {}),
      ...(query.renewalStatus ? { renewalStatus: query.renewalStatus } : {}),
      ...(query.interestCategory
        ? { interestCategories: { has: query.interestCategory } }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { document: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.customerWhere(
        actor,
        query.businessUnitId,
      );
      if (buWhere) return andWhere(where, buWhere);
    }

    return where;
  }

  private async resolveRequestedUnits(
    tenantId: string,
    dto: { businessUnitId?: string; businessUnitIds?: string[] },
    existing?: { originId?: string | null; unitIds?: string[] },
  ) {
    const resolved = resolveBusinessUnitIds({
      businessUnitId: dto.businessUnitId,
      businessUnitIds: dto.businessUnitIds,
      existingOriginId: existing?.originId,
      existingUnitIds: existing?.unitIds,
    });
    const unitIds = await this.businessUnits.assertIds(
      tenantId,
      resolved.unitIds,
    );
    const originId =
      resolved.originId && unitIds.includes(resolved.originId)
        ? resolved.originId
        : (unitIds[0] ?? null);
    return { originId, unitIds };
  }

  private async ensureCustomerBelongsToTenant(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
  }

  private handleCustomerWriteError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Documento já cadastrado neste tenant');
    }
    throw error;
  }
}

function serializeCustomer(
  customer: Prisma.CustomerGetPayload<{ include: typeof customerUnitInclude }>,
) {
  return {
    ...customer,
    businessUnits: (customer.businessUnits ?? []).map((link) => ({
      id: link.businessUnit.id,
      name: link.businessUnit.name,
      slug: link.businessUnit.slug,
      type: link.businessUnit.type,
      isActive: link.businessUnit.isActive,
      isOrigin: link.isOrigin,
    })),
  };
}
