import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  andWhere,
  type BusinessUnitActor,
} from '../../common/utils/business-unit-acl.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitAccessService } from '../access/business-unit-access.service';
import type {
  CreateCommissionRuleDto,
  UpdateCommissionRuleDto,
} from './dto/sales-performance.dto';

@Injectable()
export class CommissionRulesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly buAccess?: BusinessUnitAccessService,
  ) {}

  async list(tenantId: string, actor?: BusinessUnitActor) {
    let where: Prisma.CommissionRuleWhereInput = { tenantId };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.dealWhere(actor);
      if (extra) where = andWhere(where, extra);
    }
    const rows = await this.prisma.commissionRule.findMany({
      where,
      include: {
        businessUnit: { select: { id: true, name: true, type: true } },
      },
      orderBy: { productType: 'asc' },
    });
    return rows.map(serializeRule);
  }

  async create(
    tenantId: string,
    dto: CreateCommissionRuleDto,
    actor?: BusinessUnitActor,
  ) {
    if (actor && this.buAccess) {
      await this.buAccess.resolveIds(actor, dto.businessUnitId);
    }
    const existing = await this.prisma.commissionRule.findUnique({
      where: {
        tenantId_businessUnitId_productType: {
          tenantId,
          businessUnitId: dto.businessUnitId,
          productType: dto.productType,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Já existe regra para este produto na empresa');
    }
    const created = await this.prisma.commissionRule.create({
      data: {
        tenantId,
        businessUnitId: dto.businessUnitId,
        productType: dto.productType,
        commissionPercentage: new Prisma.Decimal(dto.commissionPercentage),
      },
      include: {
        businessUnit: { select: { id: true, name: true, type: true } },
      },
    });
    return serializeRule(created);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCommissionRuleDto,
    actor?: BusinessUnitActor,
  ) {
    let where: Prisma.CommissionRuleWhereInput = { id, tenantId };
    if (actor && this.buAccess) {
      const extra = await this.buAccess.dealWhere(actor);
      if (extra) where = andWhere(where, extra);
    }
    const current = await this.prisma.commissionRule.findFirst({ where });
    if (!current) throw new NotFoundException('Regra de comissão não encontrada');
    const updated = await this.prisma.commissionRule.update({
      where: { id: current.id },
      data: {
        ...(dto.commissionPercentage !== undefined
          ? { commissionPercentage: new Prisma.Decimal(dto.commissionPercentage) }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        businessUnit: { select: { id: true, name: true, type: true } },
      },
    });
    return serializeRule(updated);
  }
}

function serializeRule(row: {
  id: string;
  tenantId: string;
  businessUnitId: string;
  productType: string;
  commissionPercentage: Prisma.Decimal;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  businessUnit?: { id: string; name: string; type: string } | null;
}) {
  return {
    ...row,
    commissionPercentage: Number(row.commissionPercentage),
  };
}
