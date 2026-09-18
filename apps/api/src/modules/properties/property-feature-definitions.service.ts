import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CreatePropertyFeatureDefinitionDto,
  UpdatePropertyFeatureDefinitionDto,
} from './dto/property-feature.dto';
import { slugifyKey } from './properties.util';
import { PropertyFeatureDefinitionsRepository } from './repositories/property-feature-definitions.repository';

@Injectable()
export class PropertyFeatureDefinitionsService {
  constructor(
    private readonly definitions: PropertyFeatureDefinitionsRepository,
  ) {}

  findAll(tenantId: string) {
    return this.definitions.findMany(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const row = await this.definitions.findById(tenantId, id);
    if (!row) throw new NotFoundException('Característica não encontrada');
    return row;
  }

  private async uniqueKey(tenantId: string, label: string, requested?: string, excludeId?: string) {
    const base = slugifyKey(requested?.trim() || label);
    let key = base;
    let n = 2;
    while (await this.definitions.findByKey(tenantId, key, excludeId)) {
      key = `${base}_${n}`.slice(0, 40);
      n += 1;
    }
    return key;
  }

  async create(tenantId: string, dto: CreatePropertyFeatureDefinitionDto) {
    const key = await this.uniqueKey(tenantId, dto.label, dto.key);
    try {
      return await this.definitions.create({
        tenantId,
        key,
        label: dto.label.trim(),
        valueType: dto.valueType ?? 'BOOLEAN',
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      });
    } catch {
      throw new ConflictException('Já existe característica com esta chave');
    }
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePropertyFeatureDefinitionDto,
  ) {
    const current = await this.findOne(tenantId, id);
    const key =
      dto.key || dto.label
        ? await this.uniqueKey(tenantId, dto.label ?? current.label, dto.key, id)
        : current.key;
    return this.definitions.update(id, {
      ...(dto.label != null ? { label: dto.label.trim() } : {}),
      ...(dto.valueType ? { valueType: dto.valueType } : {}),
      ...(dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.isActive != null ? { isActive: dto.isActive } : {}),
      key,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.definitions.delete(id);
    return { ok: true };
  }
}
