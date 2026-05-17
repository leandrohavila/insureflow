import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { CreateDealDto, UpdateDealDto } from './dto/deal.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async findDeals(tenantId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return deals.map((deal) => ({
      ...deal,
      value: deal.value.toNumber(),
    }));
  }

  async createDeal(tenantId: string, dto: CreateDealDto) {
    const deal = await this.prisma.deal.create({
      data: {
        tenantId,
        title: dto.title,
        company: dto.company,
        value: new Prisma.Decimal(dto.value),
        stage: dto.stage,
        status: dto.status,
        assignedTo: dto.assignedTo,
      },
    });

    return { ...deal, value: deal.value.toNumber() };
  }

  async updateDeal(tenantId: string, id: string, dto: UpdateDealDto) {
    await this.ensureDealBelongsToTenant(tenantId, id);

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
      },
    });

    return { ...deal, value: deal.value.toNumber() };
  }

  async deleteDeal(tenantId: string, id: string) {
    await this.ensureDealBelongsToTenant(tenantId, id);
    await this.prisma.deal.delete({ where: { id } });
    return { deleted: true, id };
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
