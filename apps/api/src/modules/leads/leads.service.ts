import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type {
  ConvertLeadDto,
  CreateLeadDto,
  ListLeadsQueryDto,
  UpdateLeadDto,
} from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async findLeads(tenantId: string, query: ListLeadsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildLeadWhere(tenantId, query);

    const [total, leads] = await this.prisma.$transaction([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: leads,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findLead(tenantId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });
    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }
    return lead;
  }

  async createLead(tenantId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        source: dto.source,
        status: dto.status,
        notes: dto.notes,
        assignedTo: dto.assignedTo,
      },
    });
  }

  async updateLead(tenantId: string, id: string, dto: UpdateLeadDto) {
    await this.ensureLeadBelongsToTenant(tenantId, id);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.company !== undefined ? { company: dto.company } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.assignedTo !== undefined ? { assignedTo: dto.assignedTo } : {}),
      },
    });
  }

  async deleteLead(tenantId: string, id: string) {
    await this.ensureLeadBelongsToTenant(tenantId, id);
    await this.prisma.lead.delete({ where: { id } });
    return { deleted: true, id };
  }

  async convertLead(tenantId: string, id: string, dto: ConvertLeadDto) {
    const lead = await this.findLead(tenantId, id);
    if (lead.dealId) {
      throw new ConflictException('Lead já convertido em negócio');
    }

    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.create({
        data: {
          tenantId,
          title: dto.title?.trim() || `Lead: ${lead.name}`,
          company: lead.company?.trim() || lead.name,
          value: new Prisma.Decimal(dto.value ?? 0),
          stage: dto.stage ?? 'novo',
          status: 'open',
          assignedTo: dto.assignedTo ?? lead.assignedTo,
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: 'converted',
          dealId: deal.id,
        },
      });

      return {
        lead: updatedLead,
        deal: { ...deal, value: deal.value.toNumber() },
      };
    });
  }

  private buildLeadWhere(
    tenantId: string,
    query: ListLeadsQueryDto,
  ): Prisma.LeadWhereInput {
    const search = query.search?.trim();

    return {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { source: { contains: search, mode: 'insensitive' } },
              { assignedTo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private async ensureLeadBelongsToTenant(tenantId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }
  }
}
