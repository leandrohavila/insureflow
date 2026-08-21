import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { interestCategoryLabel } from '../../common/constants/interest-categories';
import { suggestCrossSellCategories } from '../../common/utils/cross-sell-rules.util';
import { renderMessageTemplate } from '../../common/utils/message-template-render.util';
import { andWhere, type BusinessUnitActor } from '../../common/utils/business-unit-acl.util';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CommunicationsService } from '../communications/communications.service';
import { MessageTemplatesService } from '../message-templates/message-templates.service';
import type {
  ListCrossSellQueryDto,
  UpdateCrossSellOpportunityDto,
} from './dto/cross-sell.dto';

@Injectable()
export class CrossSellService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly communications: CommunicationsService,
    private readonly templates: MessageTemplatesService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async findAll(tenantId: string, query: ListCrossSellQueryDto, actor?: BusinessUnitActor) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    let where: Prisma.CrossSellOpportunityWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
    };
    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.crossSellWhere(actor);
      if (buWhere) where = andWhere(where, buWhere);
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.crossSellOpportunity.count({ where }),
      this.prisma.crossSellOpportunity.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, document: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: data.map((item) => ({
        ...item,
        convertedRevenue: item.convertedRevenue
          ? Number(item.convertedRevenue)
          : null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getMetrics(tenantId: string, actor?: BusinessUnitActor) {
    let scope: Prisma.CrossSellOpportunityWhereInput = { tenantId };
    if (actor && this.buAccess) {
      const buWhere = await this.buAccess.crossSellWhere(actor);
      if (buWhere) scope = andWhere(scope, buWhere);
    }

    const [generated, converted, revenue] = await Promise.all([
      this.prisma.crossSellOpportunity.count({ where: scope }),
      this.prisma.crossSellOpportunity.count({
        where: { ...scope, status: 'CONVERTED' },
      }),
      this.prisma.crossSellOpportunity.aggregate({
        where: { ...scope, status: 'CONVERTED' },
        _sum: { convertedRevenue: true },
      }),
    ]);

    return {
      generated,
      converted,
      conversionRate: generated === 0 ? 0 : Math.round((converted / generated) * 1000) / 10,
      revenueFromCrossSell: Number(revenue._sum.convertedRevenue ?? 0),
    };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCrossSellOpportunityDto,
    actorUserId?: string,
    actor?: BusinessUnitActor,
  ) {
    if (this.buAccess) {
      await this.buAccess.assertCrossSellVisible(actor, tenantId, id);
    }
    const existing = await this.prisma.crossSellOpportunity.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Oportunidade de cross-sell não encontrada');
    }

    const shouldNotify =
      dto.status === 'CONTACTED' && existing.status !== 'CONTACTED';

    const updated = await this.prisma.crossSellOpportunity.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.convertedDealId !== undefined
          ? { convertedDealId: dto.convertedDealId }
          : {}),
        ...(dto.convertedRevenue !== undefined
          ? { convertedRevenue: new Prisma.Decimal(dto.convertedRevenue) }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, document: true } },
      },
    });

    if (shouldNotify) {
      await this.notifyOpportunity(tenantId, updated, actorUserId);
    }

    return {
      ...updated,
      convertedRevenue: updated.convertedRevenue
        ? Number(updated.convertedRevenue)
        : null,
    };
  }

  async generateForTenant(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, status: 'active' },
      select: { id: true, interestCategories: true },
    });

    let created = 0;
    for (const customer of customers) {
      created += await this.generateForCustomer(
        tenantId,
        customer.id,
        customer.interestCategories,
      );
    }
    return { created };
  }

  async generateForCustomer(
    tenantId: string,
    customerId: string,
    categories: string[],
  ) {
    const suggestions = suggestCrossSellCategories(categories);
    let created = 0;

    for (const rule of suggestions) {
      const result = await this.prisma.crossSellOpportunity.upsert({
        where: {
          customerId_originCategory_suggestedCategory: {
            customerId,
            originCategory: rule.originCategory,
            suggestedCategory: rule.suggestedCategory,
          },
        },
        create: {
          tenantId,
          customerId,
          originCategory: rule.originCategory,
          suggestedCategory: rule.suggestedCategory,
          status: 'PENDING',
        },
        update: {},
      });
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created += 1;
      }
    }

    return created;
  }

  private async notifyOpportunity(
    tenantId: string,
    opportunity: {
      id: string;
      customerId: string;
      originCategory: string;
      suggestedCategory: string;
    },
    actorUserId?: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: opportunity.customerId, tenantId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        companyName: true,
        interestCategories: true,
      },
    });
    if (!customer) return;

    const channel = customer.phone?.trim() ? 'WHATSAPP' : 'EMAIL';
    const template = await this.templates.findActiveForChannel(
      tenantId,
      channel,
      'CROSS_SELL',
    );
    const content = renderMessageTemplate(
      template?.content ??
        'Olá {{nome}}. Além de {{interesse}}, podemos proteger você também com {{produto}}.',
      {
        nome: customer.name,
        interesse: interestCategoryLabel(opportunity.originCategory),
        produto: interestCategoryLabel(opportunity.suggestedCategory),
        empresa: customer.companyName,
      },
    );
    const to = await this.communications.resolveRecipient({
      channel,
      phone: customer.phone,
      email: customer.email,
    });

    await this.communications.dispatch({
      tenantId,
      channel,
      purpose: 'CROSS_SELL',
      content,
      to,
      customerId: customer.id,
      templateId: template?.id ?? null,
      performedById: actorUserId,
      metadata: {
        opportunityId: opportunity.id,
        originCategory: opportunity.originCategory,
        suggestedCategory: opportunity.suggestedCategory,
        source: 'cross_sell',
      },
    });
  }
}
