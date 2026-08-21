import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BusinessUnitsService } from '../business-units/business-units.service';
import type {
  CreateMessageTemplateDto,
  ListMessageTemplatesQueryDto,
  UpdateMessageTemplateDto,
} from './dto/message-template.dto';

@Injectable()
export class MessageTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessUnits: BusinessUnitsService,
  ) {}

  async findAll(tenantId: string, query: ListMessageTemplatesQueryDto = {}) {
    const data = await this.prisma.messageTemplate.findMany({
      where: {
        tenantId,
        ...(query.channel ? { channel: query.channel } : {}),
        ...(query.kind ? { kind: query.kind } : {}),
        ...(query.active === undefined ? {} : { active: query.active }),
      },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return { data };
  }

  async findOne(tenantId: string, id: string) {
    const template = await this.prisma.messageTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }
    return template;
  }

  async create(tenantId: string, dto: CreateMessageTemplateDto) {
    if (dto.businessUnitId) {
      await this.businessUnits.assertIds(tenantId, [dto.businessUnitId]);
    }

    return this.prisma.messageTemplate.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        channel: dto.channel,
        content: dto.content.trim(),
        businessUnitId: dto.businessUnitId ?? null,
        kind: dto.kind ?? 'reactivation',
        active: dto.active ?? true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateMessageTemplateDto) {
    await this.findOne(tenantId, id);
    if (dto.businessUnitId) {
      await this.businessUnits.assertIds(tenantId, [dto.businessUnitId]);
    }

    return this.prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.channel !== undefined ? { channel: dto.channel } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.businessUnitId !== undefined
          ? { businessUnitId: dto.businessUnitId || null }
          : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.messageTemplate.delete({ where: { id } });
    return { deleted: true, id };
  }

  async findActiveForChannel(
    tenantId: string,
    channel: 'WHATSAPP' | 'EMAIL',
    kind = 'reactivation',
  ) {
    return this.prisma.messageTemplate.findFirst({
      where: { tenantId, channel, kind, active: true },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
