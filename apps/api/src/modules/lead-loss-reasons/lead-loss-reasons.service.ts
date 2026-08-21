import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitsService } from '../business-units/business-units.service';
import type {
  CreateLeadLossReasonDto,
  ListLeadLossReasonsQueryDto,
  UpdateLeadLossReasonDto,
} from './dto/lead-loss-reason.dto';

@Injectable()
export class LeadLossReasonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessUnits: BusinessUnitsService,
  ) {}

  async findAll(tenantId: string, query: ListLeadLossReasonsQueryDto = {}) {
    const data = await this.prisma.leadLossReason.findMany({
      where: {
        tenantId,
        ...(query.active === undefined ? {} : { isActive: query.active }),
      },
      orderBy: { name: 'asc' },
    });
    return { data };
  }

  async findOne(tenantId: string, id: string) {
    const reason = await this.prisma.leadLossReason.findFirst({
      where: { id, tenantId },
    });
    if (!reason) {
      throw new NotFoundException('Motivo de perda não encontrado');
    }
    return reason;
  }

  async create(tenantId: string, dto: CreateLeadLossReasonDto) {
    if (dto.businessUnitId) {
      await this.businessUnits.assertIds(tenantId, [dto.businessUnitId]);
    }

    try {
      return await this.prisma.leadLossReason.create({
        data: {
          tenantId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          isActive: dto.isActive ?? true,
          reactivationEnabled: dto.reactivationEnabled ?? true,
          reactivationDays: dto.reactivationDays ?? 30,
          maxAttempts: dto.maxAttempts ?? 3,
          businessUnitId: dto.businessUnitId ?? null,
        },
      });
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async update(tenantId: string, id: string, dto: UpdateLeadLossReasonDto) {
    await this.findOne(tenantId, id);
    if (dto.businessUnitId) {
      await this.businessUnits.assertIds(tenantId, [dto.businessUnitId]);
    }

    try {
      return await this.prisma.leadLossReason.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.reactivationEnabled !== undefined
            ? { reactivationEnabled: dto.reactivationEnabled }
            : {}),
          ...(dto.reactivationDays !== undefined
            ? { reactivationDays: dto.reactivationDays }
            : {}),
          ...(dto.maxAttempts !== undefined
            ? { maxAttempts: dto.maxAttempts }
            : {}),
          ...(dto.businessUnitId !== undefined
            ? { businessUnitId: dto.businessUnitId || null }
            : {}),
        },
      });
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.leadLossReason.delete({ where: { id } });
    return { deleted: true, id };
  }

  private handleWriteError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Já existe um motivo de perda com este nome');
    }
    throw error;
  }
}
